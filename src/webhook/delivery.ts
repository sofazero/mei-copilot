import { getConfig } from "../config";
import type { OutboundMessage, Tenant } from "../agent/types";

export type SendMessageResult = {
  provider: "evolution";
  dryRun: boolean;
  instance: string;
  phone: string;
  text: string;
  status: "sent" | "dry_run";
  response?: unknown;
};

export async function sendEvolutionMessage(tenant: Tenant, phone: string, message: OutboundMessage): Promise<SendMessageResult> {
  const config = getConfig();

  if (config.evolutionDryRun || !config.evolutionApiUrl || !config.evolutionApiKey) {
    return {
      provider: "evolution",
      dryRun: true,
      instance: tenant.whatsappInstance,
      phone,
      text: message.text,
      status: "dry_run"
    };
  }

  const response = await fetch(`${config.evolutionApiUrl}/message/sendText/${tenant.whatsappInstance}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: config.evolutionApiKey
    },
    body: JSON.stringify({
      number: phone,
      text: message.text
    })
  });

  const body = await safeJson(response);

  if (!response.ok) {
    throw new Error(`Evolution API send failed: ${response.status} ${JSON.stringify(body)}`);
  }

  return {
    provider: "evolution",
    dryRun: false,
    instance: tenant.whatsappInstance,
    phone,
    text: message.text,
    status: "sent",
    response: body
  };
}

async function safeJson(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

