import type { ConversationState, JuliaProfile } from "./types";

type ConversationRecord = {
  state: ConversationState;
  profile: JuliaProfile;
  updatedAt: string;
};

type PendingMessage = {
  parts: string[];
  token: number;
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

export async function bufferIncomingMessage(profile: JuliaProfile, text: string, waitMs = 3500) {
  const key = conversationKey(profile.tenant.id, profile.phone);
  const current = pendingMessages.get(key);
  const token = (current?.token ?? 0) + 1;

  pendingMessages.set(key, {
    parts: [...(current?.parts ?? []), text],
    token
  });

  await delay(waitMs);

  const latest = pendingMessages.get(key);
  if (!latest || latest.token !== token) return null;

  pendingMessages.delete(key);
  return latest.parts.join("\n").trim();
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
