import type { ConversationState, JuliaProfile } from "./types";

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

export function getConversationState(profile: JuliaProfile): ConversationState {
  return conversations.get(conversationKey(profile.tenant.id, profile.phone))?.state ?? "new";
}

export function saveConversationState(profile: JuliaProfile, state: ConversationState) {
  conversations.set(conversationKey(profile.tenant.id, profile.phone), {
    state,
    profile,
    updatedAt: new Date().toISOString()
  });

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
