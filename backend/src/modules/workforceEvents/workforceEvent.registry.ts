import type { WorkforceEventProcessor, WorkforceEventType } from "./types";
import { creditPaidLeaveWorkforceEvent } from "./paidLeave/paidLeaveDailyEarnings.engine";

const processors = new Map<WorkforceEventType, WorkforceEventProcessor>();

processors.set("paid_leave", creditPaidLeaveWorkforceEvent);

/**
 * Resolve a workforce event processor. Future event types register here —
 * callers never hardcode paid-leave payroll math.
 */
export function getWorkforceEventProcessor(
  eventType: WorkforceEventType
): WorkforceEventProcessor | null {
  return processors.get(eventType) ?? null;
}

export function registerWorkforceEventProcessor(
  eventType: WorkforceEventType,
  processor: WorkforceEventProcessor
): void {
  processors.set(eventType, processor);
}

export async function emitWorkforceEvent(
  eventType: WorkforceEventType,
  ctx: Omit<Parameters<WorkforceEventProcessor>[0], "eventType">
): Promise<ReturnType<WorkforceEventProcessor>> {
  const processor = getWorkforceEventProcessor(eventType);
  if (!processor) {
    return { status: "skipped", reason: `no_processor:${eventType}` };
  }
  return processor({ ...ctx, eventType });
}
