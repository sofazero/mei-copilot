import type { AuditEvent, AuditEventType, Tenant, ToolName } from "./types";
import { insertSupabase } from "../storage/supabase";

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
  if (process.env.AUDIT_STDOUT !== "false") {
    console.log(JSON.stringify({ audit: event }));
  }
  void persistAuditEvent(event);

  return event;
}

export function getAuditEvents() {
  return [...auditEvents];
}

export function clearAuditEvents() {
  auditEvents.length = 0;
}

async function persistAuditEvent(event: AuditEvent) {
  try {
    await insertSupabase("audit_events", {
      id: event.id,
      tenant_id: event.tenantId,
      phone: event.phone,
      message_id: event.messageId,
      run_id: event.runId,
      type: event.type,
      payload_json: event.payload,
      created_at: event.createdAt
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        auditPersistError: error instanceof Error ? error.message : "Erro inesperado ao persistir audit event",
        eventId: event.id
      })
    );
  }
}
