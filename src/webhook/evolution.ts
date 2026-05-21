import { runJuliaTurn } from "../agent/agent";
import { logAuditEvent } from "../agent/audit";
import { bufferIncomingMessage } from "../agent/conversation";
import { createDeliveryPlan } from "../agent/delivery";
import type { Tenant } from "../agent/types";
import { sendEvolutionMessage } from "./delivery";

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

  const bufferedText = await bufferIncomingMessage(
    {
      tenant,
      phone
    },
    text
  );

  logAuditEvent({
    type: "message_buffered",
    tenant,
    phone,
    messageId: payload.data?.key?.id,
    payload: {
      text
    }
  });

  if (!bufferedText) return { buffered: true };

  logAuditEvent({
    type: "message_ready",
    tenant,
    phone,
    messageId: payload.data?.key?.id,
    payload: {
      text: bufferedText
    }
  });

  const output = await runJuliaTurn({
    tenant,
    phone,
    text: bufferedText,
    messageId: payload.data?.key?.id
  });

  const deliveryPlan = createDeliveryPlan(output.answer);

  logAuditEvent({
    type: "delivery_planned",
    tenant,
    phone,
    messageId: payload.data?.key?.id,
    runId: output.runId,
    payload: {
      messages: deliveryPlan.messages,
      totalTypingDelayMs: deliveryPlan.totalTypingDelayMs
    }
  });

  for (const message of deliveryPlan.messages) {
    await delay(message.typingDelayMs);
    const sendResult = await sendEvolutionMessage(tenant, phone, message);

    logAuditEvent({
      type: "message_sent",
      tenant,
      phone,
      messageId: payload.data?.key?.id,
      runId: output.runId,
      payload: {
        text: message.text,
        typingDelayMs: message.typingDelayMs,
        sendResult
      }
    });
  }

  return {
    sent: true,
    state: output.state,
    objective: output.objective,
    stepsUsed: output.stepsUsed,
    messagesSent: deliveryPlan.messages.length,
    totalTypingDelayMs: deliveryPlan.totalTypingDelayMs
  };
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
