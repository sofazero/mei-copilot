export type Tenant = {
  id: string;
  name: string;
  brandName: string;
  whatsappInstance: string;
  status: "active" | "paused";
};

export type User = {
  id: string;
  tenantId: string;
  phone: string;
  name?: string;
  profileType?: "active_business" | "starting_business";
  activity?: string;
  city?: string;
  onboardingStatus: "new" | "in_progress" | "completed";
  checkinTime?: string;
};

export type AgentMessage = {
  role: "user" | "assistant" | "tool";
  content: string;
  toolName?: string;
  toolCallId?: string;
};

export type ToolCall = {
  id: string;
  name: ToolName;
  input: Record<string, unknown>;
};

export type ToolResult = {
  toolCallId: string;
  name: ToolName;
  result: unknown;
};

export type ToolName =
  | "get_user"
  | "create_user"
  | "update_user"
  | "get_onboarding_state"
  | "save_onboarding_step"
  | "save_entry"
  | "get_entries"
  | "get_diagnostic"
  | "calculate_price"
  | "get_tax_status"
  | "mark_das_paid"
  | "schedule_alert"
  | "research_market"
  | "notify_accountant";

export type AgentTurnInput = {
  tenant: Tenant;
  phone: string;
  text: string;
  messageId?: string;
};

export type AgentTurnOutput = {
  answer: string;
  stepsUsed: number;
  toolResults: ToolResult[];
};

export type MarketResearch = {
  activity: string;
  city?: string;
  canBeMei: "yes" | "no" | "uncertain";
  likelyCnae?: string;
  priceRange?: string;
  sectorPains: string[];
  seasonality?: string;
  risks: string[];
  recommendation: string;
  sources: string[];
};
