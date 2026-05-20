import { runAgentTurn } from "../agent/agent";
import type { Tenant } from "../agent/types";

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
  if (payload.data?.key?.fromMe) return { ignored: true };

  const tenant = await findTenantByInstance(payload.instance);
  if (!tenant || tenant.status !== "active") return { ignored: true };

  const phone = normalizeRemoteJid(payload.data?.key?.remoteJid);
  const text = getMessageText(payload);
  if (!phone || !text) return { ignored: true };

  const output = await runAgentTurn({
    tenant,
    phone,
    text,
    messageId: payload.data?.key?.id
  });

  await sendWhatsAppMessage(tenant, phone, output.answer);

  return {
    sent: true,
    stepsUsed: output.stepsUsed
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

function getMessageText(payload: EvolutionWebhookPayload) {
  return payload.data?.message?.conversation ?? payload.data?.message?.extendedTextMessage?.text;
}

async function sendWhatsAppMessage(tenant: Tenant, phone: string, text: string) {
  return {
    instance: tenant.whatsappInstance,
    phone,
    text
  };
}

