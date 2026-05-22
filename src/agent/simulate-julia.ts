import { clearAuditEvents, getAuditEvents } from "./audit";
import { createDeliveryPlan } from "./delivery";
import { runJuliaTurn } from "./agent";
import type { JuliaTurnInput, Tenant } from "./types";

const tenant: Tenant = {
  id: "tenant_demo",
  name: "Contabilidade Demo",
  brandName: "Contabilidade Demo",
  whatsappInstance: "demo",
  status: "active"
};

const profile = {
  tenant,
  phone: "5512999999999",
  name: "Carlos",
  activity: "aluguel de kit festa",
  city: "Taubaté"
};

const messages = [
  "oi",
  "pode falar",
  "uso mais o WhatsApp mesmo",
  "já tenho MEI aberto",
  "costumo cobrar R$ 350 por festa",
  "quero que sobre uns R$ 4.000 por mês",
  "Hoje recebi 150,00 e gastei 40 de material",
  "como foi hoje?",
  "quanto sobrou esse mês?"
];

async function main() {
  clearAuditEvents();

  console.log("Simulação local da Julia");
  console.log("========================\n");

  for (const text of messages) {
    const input: JuliaTurnInput = {
      ...profile,
      text,
      messageId: crypto.randomUUID()
    };

    console.log(`MEI: ${text}`);

    const output = await runJuliaTurn(input);
    const delivery = createDeliveryPlan(output.answer);

    for (const message of delivery.messages) {
      console.log(`Julia: ${message.text}`);
      console.log(`       [typingDelayMs=${message.typingDelayMs}]`);
    }

    console.log(`       [state=${output.state}; objective=${output.objective}; runId=${output.runId}]\n`);
  }

  console.log("Logs de auditoria");
  console.log("=================\n");

  for (const event of getAuditEvents()) {
    console.log(
      JSON.stringify(
        {
          type: event.type,
          runId: event.runId,
          stepNumber: event.stepNumber,
          toolName: event.toolName,
          payload: event.payload
        },
        null,
        2
      )
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
