import type { MarketResearch, Tenant, ToolCall, ToolResult, User } from "./types";

type ToolContext = {
  tenant: Tenant;
  phone: string;
};

const placeholderUsers = new Map<string, User>();

function userKey(tenantId: string, phone: string) {
  return `${tenantId}:${phone}`;
}

export async function executeTool(call: ToolCall, context: ToolContext): Promise<ToolResult> {
  const result = await runTool(call, context);

  return {
    toolCallId: call.id,
    name: call.name,
    result
  };
}

async function runTool(call: ToolCall, context: ToolContext): Promise<unknown> {
  switch (call.name) {
    case "get_user":
      return getUser(context.tenant.id, context.phone);

    case "create_user":
      return createUser(context.tenant.id, context.phone, call.input);

    case "update_user":
      return updateUser(context.tenant.id, context.phone, call.input);

    case "get_onboarding_state":
      return getOnboardingState(context.tenant.id, context.phone);

    case "save_onboarding_step":
      return saveOnboardingStep(context.tenant.id, context.phone, call.input);

    case "save_entry":
      return saveEntry(context.tenant.id, context.phone, call.input);

    case "get_entries":
      return getEntries(context.tenant.id, context.phone, call.input);

    case "get_diagnostic":
      return getDiagnostic(context.tenant.id, context.phone);

    case "calculate_price":
      return calculatePrice(call.input);

    case "get_tax_status":
      return getTaxStatus(context.tenant.id, context.phone);

    case "mark_das_paid":
      return markDasPaid(context.tenant.id, context.phone, call.input);

    case "schedule_alert":
      return scheduleAlert(context.tenant.id, context.phone, call.input);

    case "research_market":
      return researchMarket(call.input);

    case "notify_accountant":
      return notifyAccountant(context.tenant.id, context.phone, call.input);

    default:
      throw new Error(`Unknown tool: ${call.name}`);
  }
}

async function getUser(tenantId: string, phone: string) {
  return placeholderUsers.get(userKey(tenantId, phone)) ?? null;
}

async function createUser(tenantId: string, phone: string, input: Record<string, unknown>) {
  const user: User = {
    id: crypto.randomUUID(),
    tenantId,
    phone,
    name: stringValue(input.name),
    profileType: enumValue(input.profileType, ["active_business", "starting_business"]),
    activity: stringValue(input.activity),
    city: stringValue(input.city),
    onboardingStatus: "new"
  };

  placeholderUsers.set(userKey(tenantId, phone), user);
  return user;
}

async function updateUser(tenantId: string, phone: string, input: Record<string, unknown>) {
  const existing = placeholderUsers.get(userKey(tenantId, phone));
  if (!existing) return null;

  const updated: User = {
    ...existing,
    name: stringValue(input.name) ?? existing.name,
    profileType: enumValue(input.profileType, ["active_business", "starting_business"]) ?? existing.profileType,
    activity: stringValue(input.activity) ?? existing.activity,
    city: stringValue(input.city) ?? existing.city,
    checkinTime: stringValue(input.checkinTime) ?? existing.checkinTime
  };

  placeholderUsers.set(userKey(tenantId, phone), updated);
  return updated;
}

async function getOnboardingState(tenantId: string, phone: string) {
  const user = placeholderUsers.get(userKey(tenantId, phone));

  return {
    status: user?.onboardingStatus ?? "new",
    nextStep: user?.profileType ? "ask_activity" : "ask_profile_type",
    collected: {
      profileType: user?.profileType,
      activity: user?.activity,
      city: user?.city
    }
  };
}

async function saveOnboardingStep(tenantId: string, phone: string, input: Record<string, unknown>) {
  const existing = placeholderUsers.get(userKey(tenantId, phone));
  const user = existing ?? {
    id: crypto.randomUUID(),
    tenantId,
    phone,
    onboardingStatus: "in_progress" as const
  };

  const updated: User = {
    ...user,
    profileType: enumValue(input.profileType, ["active_business", "starting_business"]) ?? user.profileType,
    activity: stringValue(input.activity) ?? user.activity,
    city: stringValue(input.city) ?? user.city,
    onboardingStatus: "in_progress"
  };

  placeholderUsers.set(userKey(tenantId, phone), updated);
  return { saved: true, user: updated };
}

async function saveEntry(tenantId: string, phone: string, input: Record<string, unknown>) {
  return {
    saved: true,
    tenantId,
    phone,
    type: input.type,
    amount: input.amount,
    description: input.description,
    occurredAt: input.occurredAt ?? new Date().toISOString()
  };
}

async function getEntries(tenantId: string, phone: string, input: Record<string, unknown>) {
  return {
    tenantId,
    phone,
    period: input.period ?? "current_month",
    entries: []
  };
}

async function getDiagnostic(tenantId: string, phone: string) {
  return {
    tenantId,
    phone,
    status: "insufficient_data",
    message: "Ainda nao ha lancamentos suficientes para diagnostico confiavel."
  };
}

async function calculatePrice(input: Record<string, unknown>) {
  const monthlyGoal = numberValue(input.monthlyGoal) ?? 0;
  const fixedCosts = numberValue(input.fixedCosts) ?? 0;
  const productiveUnits = numberValue(input.productiveUnits) ?? 1;
  const minimumPrice = (monthlyGoal + fixedCosts) / productiveUnits;

  return {
    monthlyGoal,
    fixedCosts,
    productiveUnits,
    minimumPrice: Number.isFinite(minimumPrice) ? Math.ceil(minimumPrice) : null
  };
}

async function getTaxStatus(tenantId: string, phone: string) {
  return {
    tenantId,
    phone,
    dasDueDay: 20,
    nextDasDueDate: "todo dia 20",
    dasnSimeiDueMonth: "maio",
    status: "not_connected"
  };
}

async function markDasPaid(tenantId: string, phone: string, input: Record<string, unknown>) {
  return {
    tenantId,
    phone,
    paid: true,
    period: input.period ?? "current_month"
  };
}

async function scheduleAlert(tenantId: string, phone: string, input: Record<string, unknown>) {
  return {
    tenantId,
    phone,
    scheduled: true,
    type: input.type,
    scheduledAt: input.scheduledAt
  };
}

async function researchMarket(input: Record<string, unknown>): Promise<MarketResearch> {
  const activity = stringValue(input.activity) ?? "atividade nao informada";
  const city = stringValue(input.city);

  return {
    activity,
    city,
    canBeMei: "uncertain",
    likelyCnae: undefined,
    priceRange: undefined,
    sectorPains: [],
    risks: ["Pesquisa externa ainda nao conectada neste esqueleto."],
    recommendation: "Conectar esta tool a um provedor de busca e retornar JSON estruturado com fontes.",
    sources: []
  };
}

async function notifyAccountant(tenantId: string, phone: string, input: Record<string, unknown>) {
  return {
    tenantId,
    phone,
    notificationId: crypto.randomUUID(),
    status: "created",
    responsibleName: stringValue(input.responsibleName) ?? "responsavel do escritorio",
    reason: input.reason,
    severity: input.severity ?? "medium",
    summary: input.summary,
    suggestedAction: input.suggestedAction
  };
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value.replace(",", "."));
  return undefined;
}

function enumValue<T extends string>(value: unknown, allowed: T[]): T | undefined {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : undefined;
}
