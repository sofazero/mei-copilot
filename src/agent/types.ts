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

export type ConversationState =
  | "new"
  | "permission_sent"
  | "permission_accepted"
  | "segment_pain_sent"
  | "diagnostic_question_sent"
  | "onboarding"
  | "daily_checkin"
  | "entry_capture"
  | "human_review_needed"
  | "opt_out";

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

export type FinancialEntryType = "income" | "expense";

export type FinancialEntryInput = {
  type: FinancialEntryType;
  amount: number;
  entryGroup: "receitas" | "despesas_variaveis" | "despesas_fixas";
  category: string;
  description?: string;
  sourceText: string;
  occurredAt?: string;
};

export type ToolName =
  | "get_segment_pain"
  | "get_diagnostic_question"
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

export type JuliaProfile = {
  tenant: Tenant;
  phone: string;
  name?: string;
  activity?: string;
  city?: string;
};

export type ConversationMemory = {
  diagnosticAnswer?: string;
  businessStatus?: "active_mei" | "starting_mei" | "unknown";
  pricingRaw?: string;
  monthlyGoalRaw?: string;
  onboardingStage?: "diagnostic_answered" | "mei_status" | "pricing" | "monthly_goal" | "category_setup" | "done";
};

export type JuliaTurnInput = JuliaProfile & {
  text: string;
  messageId?: string;
};

export type JuliaTurnOutput = {
  answer: string;
  state: ConversationState;
  stepsUsed: number;
  objective: string;
  runId: string;
};

export type OutboundMessage = {
  text: string;
  typingDelayMs: number;
};

export type DeliveryPlan = {
  messages: OutboundMessage[];
  totalTypingDelayMs: number;
};

export type AuditEventType =
  | "webhook_received"
  | "webhook_ignored"
  | "contact_profile_loaded"
  | "conversation_memory_updated"
  | "message_buffered"
  | "message_ready"
  | "agent_run_started"
  | "agent_step"
  | "tool_called"
  | "tool_completed"
  | "agent_run_completed"
  | "delivery_planned"
  | "presence_sent"
  | "presence_failed"
  | "message_sent";

export type AuditEvent = {
  id: string;
  type: AuditEventType;
  tenantId?: string;
  phone?: string;
  messageId?: string;
  runId?: string;
  stepNumber?: number;
  toolName?: ToolName;
  payload: Record<string, unknown>;
  createdAt: string;
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
