import { runJuliaTurn } from "../agent/agent";
import { logAuditEvent } from "../agent/audit";
import { enqueueIncomingMessage } from "../agent/conversation";
import { createDeliveryPlan } from "../agent/delivery";
import type { Tenant } from "../agent/types";
import { logError } from "../logger";
import { upsertSupabase } from "../storage/supabase";
import { sendEvolutionMessage, sendEvolutionPresence } from "./delivery";

type EvolutionWebhookPayload = {
  instance: string;
  data?: {
    key?: {
      remoteJid?: string;
      id?: string;
      fromMe?: boolean;
    };
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text?: string;
      };
    };
  };
};

export async function handleEvolutionWebhook(payload: EvolutionWebhookPayload) {
  logAuditEvent({
    type: "webhook_received",
    messageId: payload.data?.key?.id,
    payload: {
      instance: payload.instance,
      remoteJid: payload.data?.key?.remoteJid,
      fromMe: payload.data?.key?.fromMe,
      text: getMessageText(payload)
    }
  });

  const remoteJid = payload.data?.key?.remoteJid;

  if (payload.data?.key?.fromMe) {
    logAuditEvent({
      type: "webhook_ignored",
      messageId: payload.data?.key?.id,
      payload: {
        reason: "from_me"
      }
    });

    return { ignored: true };
  }

  if (isGroupJid(remoteJid)) {
    logAuditEvent({
      type: "webhook_ignored",
      messageId: payload.data?.key?.id,
      payload: {
        reason: "group_message",
        remoteJid
      }
    });

    return { ignored: true };
  }

  const tenant = await findTenantByInstance(payload.instance);
  if (!tenant || tenant.status !== "active") {
    logAuditEvent({
      type: "webhook_ignored",
      tenant: tenant ?? undefined,
      messageId: payload.data?.key?.id,
      payload: {
        reason: "tenant_inactive_or_not_found",
        instance: payload.instance
      }
    });

    return { ignored: true };
  }

  const phone = normalizeRemoteJid(remoteJid);
  const text = getMessageText(payload);
  if (!phone || !text) {
    logAuditEvent({
      type: "webhook_ignored",
      tenant,
      phone,
      messageId: payload.data?.key?.id,
      payload: {
        reason: "missing_phone_or_text"
      }
    });

    return { ignored: true };
  }

  void persistContact(tenant, phone);

  const bufferResult = enqueueIncomingMessage(
    {
      tenant,
      phone
    },
    text,
    (bufferedText) =>
      processBufferedMessage({
        tenant,
        phone,
        text: bufferedText,
        messageId: payload.data?.key?.id
      })
  );

  logAuditEvent({
    type: "message_buffered",
    tenant,
    phone,
    messageId: payload.data?.key?.id,
    payload: {
      text,
      partsCount: bufferResult.partsCount,
      waitMs: bufferResult.waitMs
    }
  });

  return {
    buffered: true,
    partsCount: bufferResult.partsCount,
    waitMs: bufferResult.waitMs
  };
}

async function persistContact(tenant: Tenant, phone: string) {
  try {
    const now = new Date().toISOString();

    await upsertSupabase(
      "contacts",
      {
        tenant_id: tenant.id,
        tenant_name: tenant.brandName,
        phone,
        status: "active",
        updated_at: now
      },
      "tenant_id,phone"
    );
  } catch (error) {
    logError("contact_persist_error", error, {
      tenantId: tenant.id,
      phone
    });
  }
}

async function processBufferedMessage(input: { tenant: Tenant; phone: string; text: string; messageId?: string }) {
  logAuditEvent({
    type: "message_ready",
    tenant: input.tenant,
    phone: input.phone,
    messageId: input.messageId,
    payload: {
      text: input.text
    }
  });

  const output = await runJuliaTurn({
    tenant: input.tenant,
    phone: input.phone,
    text: input.text,
    messageId: input.messageId
  });

  const deliveryPlan = createDeliveryPlan(output.answer);

  logAuditEvent({
    type: "delivery_planned",
    tenant: input.tenant,
    phone: input.phone,
    messageId: input.messageId,
    runId: output.runId,
    payload: {
      messages: deliveryPlan.messages,
      totalTypingDelayMs: deliveryPlan.totalTypingDelayMs
    }
  });

  for (const message of deliveryPlan.messages) {
    try {
      const presenceResult = await sendEvolutionPresence(input.tenant, input.phone, message.typingDelayMs);

      logAuditEvent({
        type: "presence_sent",
        tenant: input.tenant,
        phone: input.phone,
        messageId: input.messageId,
        runId: output.runId,
        payload: {
          typingDelayMs: message.typingDelayMs,
          presenceResult
        }
      });
    } catch (error) {
      logAuditEvent({
        type: "presence_failed",
        tenant: input.tenant,
        phone: input.phone,
        messageId: input.messageId,
        runId: output.runId,
        payload: {
          typingDelayMs: message.typingDelayMs,
          error: error instanceof Error ? error.message : "Erro inesperado ao enviar presença"
        }
      });
    }

    await delay(message.typingDelayMs);

    const sendResult = await sendEvolutionMessage(input.tenant, input.phone, message);

    logAuditEvent({
      type: "message_sent",
      tenant: input.tenant,
      phone: input.phone,
      messageId: input.messageId,
      runId: output.runId,
      payload: {
        text: message.text,
        typingDelayMs: message.typingDelayMs,
        sendResult
      }
    });
  }
}

async function findTenantByInstance(instance: string): Promise<Tenant | null> {
  return {
    id: "tenant_demo",
    name: "Contabilidade Demo",
    brandName: "Contabilidade Demo",
    whatsappInstance: instance,
    status: "active"
  };
}

function normalizeRemoteJid(remoteJid?: string) {
  return remoteJid?.replace("@s.whatsapp.net", "");
}

function isGroupJid(remoteJid?: string) {
  return remoteJid?.endsWith("@g.us") ?? false;
}

function getMessageText(payload: EvolutionWebhookPayload) {
  return payload.data?.message?.conversation ?? payload.data?.message?.extendedTextMessage?.text;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
