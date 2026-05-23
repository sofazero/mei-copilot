import { getConfig } from "../config";
import { logError } from "../logger";
import { logAuditEvent } from "./audit";
import type { FinancialEntryInput, JuliaTurnInput } from "./types";

type LlmEntry = {
  type?: unknown;
  amount?: unknown;
  entryGroup?: unknown;
  category?: unknown;
  description?: unknown;
};

type LlmExtraction = {
  entries?: unknown;
  confidence?: unknown;
  reason?: unknown;
};

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

export async function extractFinancialEntriesWithLlm(
  input: JuliaTurnInput,
  runId: string,
  stepNumber: number
): Promise<FinancialEntryInput[] | null> {
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
      task: "extract_financial_entries",
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
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: [
              "Você extrai lançamentos financeiros de mensagens de WhatsApp de MEIs.",
              "Responda somente JSON válido, sem markdown.",
              "Extraia apenas entradas e gastos claramente informados.",
              "Se houver uma entrada e um gasto na mesma frase, retorne os dois lançamentos.",
              "Use type income para receita e expense para despesa.",
              "Use entryGroup receitas, despesas_variaveis ou despesas_fixas.",
              "Para aluguel de kit festa, prefira categorias como aluguel de kit, sinal/reserva, adicionais, entrega cobrada do cliente, materiais descartáveis, reposição de itens, limpeza/manutenção, entrega/transporte, estrutura, marketing ou sistema/ferramentas.",
              "Se estiver ambíguo, retorne entries vazio."
            ].join(" ")
          },
          {
            role: "user",
            content: JSON.stringify({
              schema: {
                entries: [
                  {
                    type: "income|expense",
                    amount: "number",
                    entryGroup: "receitas|despesas_variaveis|despesas_fixas",
                    category: "string",
                    description: "string opcional"
                  }
                ],
                confidence: "number de 0 a 1",
                reason: "string curta"
              },
              profile: {
                activity: input.activity,
                city: input.city
              },
              text: input.text
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
    const entries = validateEntries(parsed, input.text);

    logAuditEvent({
      type: "llm_completed",
      tenant: input.tenant,
      phone: input.phone,
      messageId: input.messageId,
      runId,
      stepNumber,
      payload: {
        task: "extract_financial_entries",
        entriesCount: entries.length,
        confidence: isRecord(parsed) ? parsed.confidence : undefined
      }
    });

    return entries;
  } catch (error) {
    logAuditEvent({
      type: "llm_failed",
      tenant: input.tenant,
      phone: input.phone,
      messageId: input.messageId,
      runId,
      stepNumber,
      payload: {
        task: "extract_financial_entries",
        error: error instanceof Error ? error.message : "Erro inesperado na LLM"
      }
    });

    logError("llm_financial_extraction_error", error, {
      tenantId: input.tenant.id,
      phone: input.phone,
      messageId: input.messageId
    });

    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function parseJsonObject(content: unknown): LlmExtraction | null {
  if (typeof content !== "string") return null;

  try {
    const parsed = JSON.parse(content);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function validateEntries(parsed: LlmExtraction | null, sourceText: string): FinancialEntryInput[] {
  if (!parsed || !Array.isArray(parsed.entries)) return [];

  return parsed.entries
    .map((entry) => validateEntry(entry, sourceText))
    .filter((entry): entry is FinancialEntryInput => Boolean(entry));
}

function validateEntry(value: unknown, sourceText: string): FinancialEntryInput | null {
  if (!isRecord(value)) return null;

  const entry = value as LlmEntry;
  const type = entry.type === "income" || entry.type === "expense" ? entry.type : null;
  const amount = typeof entry.amount === "number" ? entry.amount : null;
  const entryGroup = toEntryGroup(entry.entryGroup, type);
  const category = typeof entry.category === "string" && entry.category.trim() ? entry.category.trim() : null;
  const description =
    typeof entry.description === "string" && entry.description.trim() ? entry.description.trim() : undefined;

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
