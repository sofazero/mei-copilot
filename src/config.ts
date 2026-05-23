export type AppConfig = {
  port: number;
  evolutionApiUrl?: string;
  evolutionApiKey?: string;
  evolutionDryRun: boolean;
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
  auditToken?: string;
  llmEnabled: boolean;
  openaiApiKey?: string;
  openaiModel: string;
  llmTimeoutMs: number;
};

export function getConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  return {
    port: numberValue(env.PORT) ?? 3000,
    evolutionApiUrl: cleanUrl(env.EVOLUTION_API_URL),
    evolutionApiKey: stringValue(env.EVOLUTION_API_KEY),
    evolutionDryRun: env.EVOLUTION_DRY_RUN !== "false",
    supabaseUrl: cleanUrl(env.SUPABASE_URL),
    supabaseServiceRoleKey: stringValue(env.SUPABASE_SERVICE_ROLE_KEY),
    auditToken: stringValue(env.AUDIT_TOKEN),
    llmEnabled: env.LLM_ENABLED === "true",
    openaiApiKey: stringValue(env.OPENAI_API_KEY),
    openaiModel: stringValue(env.OPENAI_MODEL) ?? "gpt-4o-mini",
    llmTimeoutMs: numberValue(env.LLM_TIMEOUT_MS) ?? 15000
  };
}

function stringValue(value: string | undefined) {
  return value && value.trim() ? value.trim() : undefined;
}

function cleanUrl(value: string | undefined) {
  const url = stringValue(value);
  return url?.replace(/\/+$/, "");
}

function numberValue(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
