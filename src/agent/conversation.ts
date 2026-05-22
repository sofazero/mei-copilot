import type { ConversationState, JuliaProfile } from "./types";
import { getConversationFromSupabase, upsertSupabase } from "../storage/supabase";

type ConversationRecord = {
  state: ConversationState;
  profile: JuliaProfile;
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
  const localState = conversations.get(conversationKey(profile.tenant.id, profile.phone))?.state;
  if (localState) return localState;

  try {
    const row = await getConversationFromSupabase(profile.tenant.id, profile.phone);
    const state = row?.state;

    if (isConversationState(state)) {
      conversations.set(conversationKey(profile.tenant.id, profile.phone), {
        state,
        profile,
        updatedAt: new Date().toISOString()
      });

      return state;
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        conversationReadError: error instanceof Error ? error.message : "Erro inesperado ao ler conversa"
      })
    );
  }

  return "new";
}

export function saveConversationState(profile: JuliaProfile, state: ConversationState) {
  const updatedAt = new Date().toISOString();

  conversations.set(conversationKey(profile.tenant.id, profile.phone), {
    state,
    profile,
    updatedAt
  });

  void persistConversationState(profile, state, updatedAt);

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

async function persistConversationState(profile: JuliaProfile, state: ConversationState, updatedAt: string) {
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
        last_message_at: updatedAt,
        updated_at: updatedAt
      },
      "tenant_id,phone"
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        conversationPersistError: error instanceof Error ? error.message : "Erro inesperado ao persistir conversa",
        tenantId: profile.tenant.id,
        phone: profile.phone
      })
    );
  }
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
