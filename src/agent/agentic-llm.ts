import { getConfig } from "../config";
import { logError } from "../logger";
import { logAuditEvent } from "./audit";
import { JULIA_AGENT_DECISION_PROMPT } from "./prompts";
import type { ConversationMemory, ConversationState, FinancialEntryInput, JuliaTurnInput } from "./types";

type ConversationContext = {
  state: ConversationState;
  memory: ConversationMemory;
};

export type AgenticLlmDecision =
  | {
      action: "answer";
      state: ConversationState;
      objective: string;
      answer: string;
      memoryPatch?: Partial<ConversationMemory>;
    }
  | {
      action: "save_entries";
      state: ConversationState;
      objective: string;
      entries: FinancialEntryInput[];
      memoryPatch?: Partial<ConversationMemory>;
    }
  | {
      action: "get_summary";
      state: ConversationState;
      objective: string;
      period: "today" | "month";
      memoryPatch?: Partial<ConversationMemory>;
    };

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

export async function decideNextStepWithLlm(
  input: JuliaTurnInput,
  context: ConversationContext,
  runId: string,
  stepNumber: number
): Promise<AgenticLlmDecision | null> {
  const config = getConfig();
  if (!config.llmEnabled || !config.openaiApiKey) return null;

  logAuditEvent({
    type: "llm_called",
    tenant: input.tenant,
    phone: input.phone,
    messageId: input.messageId,
    runId,
    stepNumber,
    payload: {
      task: "agent_decision",
      model: config.openaiModel
    }
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.llmTimeoutMs);

  try {
    const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.openaiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: config.openaiModel,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: JULIA_AGENT_DECISION_PROMPT
          },
          {
            role: "user",
            content: JSON.stringify({
              currentState: context.state,
              memory: context.memory,
              profile: {
                name: input.name,
                activity: input.activity,
                city: input.city,
                businessStatus: input.businessStatus,
                cnae: input.cnae,
                segment: input.segment,
                preferredCheckinTime: input.preferredCheckinTime,
                responsibleName: input.responsibleName,
                profileJson: input.profileJson
              },
              tenant: {
                id: input.tenant.id,
                brandName: input.tenant.brandName
              },
              userMessage: input.text
            })
          }
        ]
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`LLM request failed with status ${response.status}`);
    }

    const body = await response.json();
    const content = body?.choices?.[0]?.message?.content;
    const parsed = parseJsonObject(content);
    const decision = validateDecision(parsed, input.text);

    logAuditEvent({
      type: "llm_completed",
      tenant: input.tenant,
      phone: input.phone,
      messageId: input.messageId,
      runId,
      stepNumber,
      payload: {
        task: "agent_decision",
        action: decision?.action,
        state: decision?.state
      }
    });

    return decision;
  } catch (error) {
    logAuditEvent({
      type: "llm_failed",
      tenant: input.tenant,
      phone: input.phone,
      messageId: input.messageId,
      runId,
      stepNumber,
      payload: {
        task: "agent_decision",
        error: error instanceof Error ? error.message : "Erro inesperado na LLM"
      }
    });

    logError("llm_agent_decision_error", error, {
      tenantId: input.tenant.id,
      phone: input.phone,
      messageId: input.messageId
    });

    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function parseJsonObject(content: unknown) {
  if (typeof content !== "string") return null;

  try {
    const parsed = JSON.parse(content);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function validateDecision(value: Record<string, unknown> | null, sourceText: string): AgenticLlmDecision | null {
  if (!value) return null;

  const action = value.action;
  const state = toConversationState(value.state) ?? "daily_checkin";
  const objective = stringValue(value.objective) ?? "continuar atendimento";
  const memoryPatch = toMemoryPatch(value.memoryPatch);

  if (action === "answer") {
    const answer = stringValue(value.answer);
    if (!answer) return null;

    return {
      action,
      state,
      objective,
      answer,
      memoryPatch
    };
  }

  if (action === "get_summary") {
    const period = value.period === "month" ? "month" : "today";

    return {
      action,
      state,
      objective,
      period,
      memoryPatch
    };
  }

  if (action === "save_entries" && Array.isArray(value.entries)) {
    const entries = value.entries
      .map((entry) => validateEntry(entry, sourceText))
      .filter((entry): entry is FinancialEntryInput => Boolean(entry));

    if (!entries.length) return null;

    return {
      action,
      state,
      objective,
      entries,
      memoryPatch
    };
  }

  return null;
}

function validateEntry(value: unknown, sourceText: string): FinancialEntryInput | null {
  if (!isRecord(value)) return null;

  const type = value.type === "income" || value.type === "expense" ? value.type : null;
  const amount = typeof value.amount === "number" ? value.amount : null;
  const entryGroup = toEntryGroup(value.entryGroup, type);
  const category = stringValue(value.category);
  const description = stringValue(value.description);

  if (!type || amount === null || !Number.isFinite(amount) || amount <= 0 || !category) return null;

  return {
    type,
    amount,
    entryGroup,
    category: category.slice(0, 80),
    description: description?.slice(0, 120),
    sourceText
  };
}

function toEntryGroup(value: unknown, type: FinancialEntryInput["type"] | null): FinancialEntryInput["entryGroup"] {
  if (value === "receitas" || value === "despesas_variaveis" || value === "despesas_fixas") return value;
  return type === "income" ? "receitas" : "despesas_variaveis";
}

function toMemoryPatch(value: unknown): Partial<ConversationMemory> | undefined {
  if (!isRecord(value)) return undefined;

  const patch: Partial<ConversationMemory> = {};
  const diagnosticAnswer = stringValue(value.diagnosticAnswer);
  const pricingRaw = stringValue(value.pricingRaw);
  const monthlyGoalRaw = stringValue(value.monthlyGoalRaw);
  const businessStatus = toBusinessStatus(value.businessStatus);
  const onboardingStage = toOnboardingStage(value.onboardingStage);

  if (diagnosticAnswer) patch.diagnosticAnswer = diagnosticAnswer;
  if (pricingRaw) patch.pricingRaw = pricingRaw;
  if (monthlyGoalRaw) patch.monthlyGoalRaw = monthlyGoalRaw;
  if (businessStatus) patch.businessStatus = businessStatus;
  if (onboardingStage) patch.onboardingStage = onboardingStage;

  return Object.keys(patch).length ? patch : undefined;
}

function toConversationState(value: unknown): ConversationState | undefined {
  return [
    "new",
    "permission_sent",
    "permission_accepted",
    "segment_pain_sent",
    "diagnostic_question_sent",
    "onboarding",
    "daily_checkin",
    "entry_capture",
    "human_review_needed",
    "opt_out"
  ].includes(String(value))
    ? (value as ConversationState)
    : undefined;
}

function toBusinessStatus(value: unknown): ConversationMemory["businessStatus"] {
  return value === "active_mei" || value === "starting_mei" || value === "unknown" ? value : undefined;
}

function toOnboardingStage(value: unknown): ConversationMemory["onboardingStage"] {
  return ["diagnostic_answered", "mei_status", "pricing", "monthly_goal", "category_setup", "done"].includes(String(value))
    ? (value as ConversationMemory["onboardingStage"])
    : undefined;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
