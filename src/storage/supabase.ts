import { getConfig } from "../config";

type SupabaseWriteInput = {
  table: string;
  body: Record<string, unknown>;
  onConflict?: string;
};

export type FinancialEntryRow = {
  type: "income" | "expense";
  amount: number | string;
  entry_group?: string | null;
  category?: string | null;
  description?: string | null;
  occurred_at: string;
};

export function hasSupabaseConfig() {
  const config = getConfig();
  return Boolean(config.supabaseUrl && config.supabaseServiceRoleKey);
}

export async function insertSupabase(table: string, body: Record<string, unknown>) {
  return writeSupabase({
    table,
    body
  });
}

export async function upsertSupabase(table: string, body: Record<string, unknown>, onConflict: string) {
  return writeSupabase({
    table,
    body,
    onConflict
  });
}

export async function getConversationFromSupabase(tenantId: string, phone: string) {
  const config = getConfig();
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) return null;

  const url = new URL(`${config.supabaseUrl}/rest/v1/conversations`);
  url.searchParams.set("tenant_id", `eq.${tenantId}`);
  url.searchParams.set("phone", `eq.${phone}`);
  url.searchParams.set("select", "state,profile_json,memory_json");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: supabaseHeaders(config.supabaseServiceRoleKey)
  });

  if (!response.ok) {
    throw new Error(`Supabase conversation read failed: ${response.status} ${await response.text()}`);
  }

  const rows = (await response.json()) as Array<Record<string, unknown>>;
  return rows[0] ?? null;
}

export async function getContactFromSupabase(tenantId: string, phone: string) {
  const config = getConfig();
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) return null;

  const url = new URL(`${config.supabaseUrl}/rest/v1/contacts`);
  url.searchParams.set("tenant_id", `eq.${tenantId}`);
  url.searchParams.set("phone", `eq.${phone}`);
  url.searchParams.set("select", "name,activity,city,status");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: supabaseHeaders(config.supabaseServiceRoleKey)
  });

  if (!response.ok) {
    throw new Error(`Supabase contact read failed: ${response.status} ${await response.text()}`);
  }

  const rows = (await response.json()) as Array<Record<string, unknown>>;
  return rows[0] ?? null;
}

export async function getFinancialEntriesFromSupabase(tenantId: string, phone: string, period: "today" | "month") {
  const config = getConfig();
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) return [];

  const url = new URL(`${config.supabaseUrl}/rest/v1/financial_entries`);
  url.searchParams.set("tenant_id", `eq.${tenantId}`);
  url.searchParams.set("phone", `eq.${phone}`);
  url.searchParams.set("occurred_at", `gte.${periodStart(period)}`);
  url.searchParams.set("select", "type,amount,entry_group,category,description,occurred_at");
  url.searchParams.set("order", "occurred_at.desc,created_at.desc");

  const response = await fetch(url, {
    headers: supabaseHeaders(config.supabaseServiceRoleKey)
  });

  if (!response.ok) {
    throw new Error(`Supabase financial entries read failed: ${response.status} ${await response.text()}`);
  }

  return (await response.json()) as FinancialEntryRow[];
}

async function writeSupabase(input: SupabaseWriteInput) {
  const config = getConfig();
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) return null;

  const url = new URL(`${config.supabaseUrl}/rest/v1/${input.table}`);
  if (input.onConflict) url.searchParams.set("on_conflict", input.onConflict);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...supabaseHeaders(config.supabaseServiceRoleKey),
      "Content-Type": "application/json",
      Prefer: input.onConflict ? "resolution=merge-duplicates" : "return=minimal"
    },
    body: JSON.stringify(input.body)
  });

  if (!response.ok) {
    throw new Error(`Supabase write failed on ${input.table}: ${response.status} ${await response.text()}`);
  }

  return true;
}

function supabaseHeaders(serviceRoleKey: string) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`
  };
}

function periodStart(period: "today" | "month") {
  const now = new Date();
  if (period === "today") return now.toISOString().slice(0, 10);

  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
}
