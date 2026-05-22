import type { ConversationMemory, ConversationState, JuliaProfile } from "./types";
import { getConversationFromSupabase, upsertSupabase } from "../storage/supabase";
import { logError } from "../logger";

type ConversationRecord = {
  state: ConversationState;
  profile: JuliaProfile;
  memory: ConversationMemory;
  updatedAt: string;
};

type PendingMessage = {
  parts: string[];
  timer?: ReturnType<typeof setTimeout>;
};

const conversations = new Map<string, ConversationRecord>();
const pendingMessages = new Map<string, PendingMessage>();

function conversationKey(tenantId: string, phone: string) {
  return `${tenantId}:${phone}`;
}

export async function getConversationState(profile: JuliaProfile): Promise<ConversationState> {
  return (await getConversationContext(profile)).state;
}

export async function getConversationContext(profile: JuliaProfile): Promise<{
  state: ConversationState;
  memory: ConversationMemory;
}> {
  const local = conversations.get(conversationKey(profile.tenant.id, profile.phone));
  if (local) {
    return {
      state: local.state,
      memory: local.memory
    };
  }

  try {
    const row = await getConversationFromSupabase(profile.tenant.id, profile.phone);
    const state = row?.state;
    const memory = toConversationMemory(row?.memory_json);

    if (isConversationState(state)) {
      conversations.set(conversationKey(profile.tenant.id, profile.phone), {
        state,
        profile,
        memory,
        updatedAt: new Date().toISOString()
      });

      return {
        state,
        memory
      };
    }
  } catch (error) {
    logError("conversation_read_error", error, {
      tenantId: profile.tenant.id,
      phone: profile.phone
    });
  }

  return {
    state: "new",
    memory: {}
  };
}

export function saveConversationState(
  profile: JuliaProfile,
  state: ConversationState,
  memoryPatch: Partial<ConversationMemory> = {}
) {
  const updatedAt = new Date().toISOString();
  const key = conversationKey(profile.tenant.id, profile.phone);
  const previous = conversations.get(key);
  const memory = {
    ...(previous?.memory ?? {}),
    ...memoryPatch
  };

  conversations.set(key, {
    state,
    profile,
    memory,
    updatedAt
  });

  void persistConversationState(profile, state, memory, updatedAt);

  return state;
}

export function enqueueIncomingMessage(
  profile: JuliaProfile,
  text: string,
  onReady: (text: string) => void | Promise<void>,
  waitMs = 20000
) {
  const key = conversationKey(profile.tenant.id, profile.phone);
  const current = pendingMessages.get(key);

  if (current?.timer) {
    clearTimeout(current.timer);
  }

  const parts = [...(current?.parts ?? []), text];
  const timer = setTimeout(() => {
    const latest = pendingMessages.get(key);
    if (!latest) return;

    pendingMessages.delete(key);
    void onReady(latest.parts.join("\n").trim());
  }, waitMs);

  pendingMessages.set(key, {
    parts,
    timer
  });

  return {
    buffered: true,
    partsCount: parts.length,
    waitMs
  };
}

async function persistConversationState(
  profile: JuliaProfile,
  state: ConversationState,
  memory: ConversationMemory,
  updatedAt: string
) {
  try {
    await upsertSupabase(
      "conversations",
      {
        tenant_id: profile.tenant.id,
        phone: profile.phone,
        state,
        profile_json: {
          name: profile.name,
          activity: profile.activity,
          city: profile.city,
          tenantName: profile.tenant.brandName
        },
        memory_json: memory,
        last_message_at: updatedAt,
        updated_at: updatedAt
      },
      "tenant_id,phone"
    );
  } catch (error) {
    logError("conversation_persist_error", error, {
      tenantId: profile.tenant.id,
      phone: profile.phone,
      state
    });
  }
}

function toConversationMemory(value: unknown): ConversationMemory {
  if (!isRecord(value)) return {};

  return {
    diagnosticAnswer: stringOrUndefined(value.diagnosticAnswer),
    businessStatus: toBusinessStatus(value.businessStatus),
    pricingRaw: stringOrUndefined(value.pricingRaw),
    monthlyGoalRaw: stringOrUndefined(value.monthlyGoalRaw),
    onboardingStage: toOnboardingStage(value.onboardingStage)
  };
}

function toBusinessStatus(value: unknown): ConversationMemory["businessStatus"] {
  return value === "active_mei" || value === "starting_mei" || value === "unknown" ? value : undefined;
}

function toOnboardingStage(value: unknown): ConversationMemory["onboardingStage"] {
  return ["diagnostic_answered", "mei_status", "pricing", "monthly_goal", "done"].includes(String(value))
    ? (value as ConversationMemory["onboardingStage"])
    : undefined;
}

function stringOrUndefined(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isConversationState(value: unknown): value is ConversationState {
  return (
    typeof value === "string" &&
    [
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
    ].includes(value)
  );
}
