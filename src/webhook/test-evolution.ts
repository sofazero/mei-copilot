import { clearAuditEvents, getAuditEvents } from "../agent/audit";
import { handleEvolutionWebhook } from "./evolution";

clearAuditEvents();

const result = await handleEvolutionWebhook({
  instance: "demo",
  data: {
    key: {
      remoteJid: "5512999999999@s.whatsapp.net",
      id: crypto.randomUUID(),
      fromMe: false
    },
    message: {
      conversation: "oi"
    }
  }
});

console.log("Resultado do webhook");
console.log("====================");
console.log(JSON.stringify(result, null, 2));

console.log("\nLogs de auditoria");
console.log("=================");
console.log(JSON.stringify(getAuditEvents(), null, 2));
