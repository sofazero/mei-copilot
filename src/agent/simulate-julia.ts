import { runJuliaTurn } from "./agent";
import { clearAuditEvents, getAuditEvents } from "./audit";
import { createDeliveryPlan } from "./delivery";
import type { JuliaProfile, JuliaTurnInput, Tenant } from "./types";

const tenant: Tenant = {
  id: "tenant_demo",
  name: "Contabilidade Demo",
  brandName: "Contabilidade Demo",
  whatsappInstance: "demo",
  status: "active"
};

type Scenario = {
  title: string;
  profile: JuliaProfile;
  messages: string[];
};

const scenarios: Scenario[] = [
  {
    title: "Com contexto cadastrado pelo contador",
    profile: {
      tenant,
      phone: "5512999999991",
      name: "Carlos",
      activity: "manutenção de ar-condicionado",
      city: "Taubaté",
      businessStatus: "active_mei"
    },
    messages: [
      "oi",
      "quero entender se estou cobrando certo",
      "cobro 180 por limpeza",
      "gasto uns 35 de produto e deslocamento",
      "tenho uns 900 de custo fixo no mês",
      "quero sobrar 5000 por mês e faço umas 35 limpezas",
      "hoje recebi 180 e gastei 35 de produto",
      "como foi hoje?"
    ]
  },
  {
    title: "Sem contexto cadastrado",
    profile: {
      tenant,
      phone: "5512999999992",
      name: "Marina"
    },
    messages: [
      "oi",
      "sou manicure e faço atendimento em casa",
      "quero organizar melhor meu lucro",
      "cobro 45 a mão",
      "gasto uns 8 por atendimento",
      "quero sobrar 3000 por mês e faço umas 80 clientes",
      "hoje recebi 90 e gastei 16 de material",
      "quanto sobrou esse mês?"
    ]
  }
];

async function main() {
  clearAuditEvents();

  console.log("Simulação local da Julia");
  console.log("========================\n");

  for (const scenario of scenarios) {
    console.log(`Cenário: ${scenario.title}`);
    console.log("-".repeat(scenario.title.length + 9));
    console.log("");

    for (const text of scenario.messages) {
      const input: JuliaTurnInput = {
        ...scenario.profile,
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
