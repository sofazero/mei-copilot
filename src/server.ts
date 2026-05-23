import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { getAuditEvents } from "./agent/audit";
import { getConfig } from "./config";
import { handleEvolutionWebhook } from "./webhook/evolution";

const config = getConfig();

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

    if (request.method === "GET" && url.pathname === "/health") {
      return sendJson(response, {
        ok: true,
        service: "mei-copilot",
        evolutionDryRun: config.evolutionDryRun
      });
    }

    if (request.method === "GET" && url.pathname === "/audit") {
      if (!isAuditAuthorized(request, url)) {
        return sendJson(response, { error: "unauthorized" }, 401);
      }

      return sendJson(response, {
        events: getAuditEvents()
      });
    }

    if (request.method === "POST" && url.pathname === "/webhook/evolution") {
      const payload = await readJsonBody(request);
      const result = await handleEvolutionWebhook(payload);
      return sendJson(response, result);
    }

    return sendJson(response, { error: "not_found" }, 404);
  } catch (error) {
    return sendJson(
      response,
      {
        error: "internal_error",
        message: error instanceof Error ? error.message : "Erro inesperado"
      },
      500
    );
  }
});

server.listen(config.port, () => {
  console.log(`MEI Copilot ouvindo na porta ${config.port}`);
});

async function readJsonBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (!chunks.length) return {};

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function sendJson(
  response: ServerResponse,
  body: unknown,
  status = 200
) {
  response.writeHead(status, {
    "Content-Type": "application/json"
  });
  response.end(JSON.stringify(body));
}

function isAuditAuthorized(request: IncomingMessage, url: URL) {
  if (!config.auditToken) return config.evolutionDryRun;

  const authorization = request.headers.authorization;
  const bearerToken = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : undefined;
  return bearerToken === config.auditToken || url.searchParams.get("token") === config.auditToken;
}
