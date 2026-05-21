import type { AuditEvent, AuditEventType, Tenant, ToolName } from "./types";

type AuditInput = {
  type: AuditEventType;
  tenant?: Tenant;
  phone?: string;
  messageId?: string;
  runId?: string;
  stepNumber?: number;
  toolName?: ToolName;
  payload?: Record<string, unknown>;
};

const auditEvents: AuditEvent[] = [];

export function logAuditEvent(input: AuditInput): AuditEvent {
  const event: AuditEvent = {
    id: crypto.randomUUID(),
    type: input.type,
    tenantId: input.tenant?.id,
    phone: input.phone,
    messageId: input.messageId,
    runId: input.runId,
    stepNumber: input.stepNumber,
    toolName: input.toolName,
    payload: input.payload ?? {},
    createdAt: new Date().toISOString()
  };

  auditEvents.push(event);
  console.log(JSON.stringify({ audit: event }));

  return event;
}

export function getAuditEvents() {
  return [...auditEvents];
}

export function clearAuditEvents() {
  auditEvents.length = 0;
}
