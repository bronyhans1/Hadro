/**
 * Workforce Event architecture — paid non-attendance day credits and future event types.
 *
 * Events are emitted by the 24-hour workforce engine (e.g. after scheduled shift close),
 * not by UI refresh or leave-completion hooks.
 */

export const WORKFORCE_EVENT_TYPES = [
  "paid_leave",
  "paid_holiday",
  "training_day",
  "company_assignment",
  "jury_duty",
  "bereavement_leave",
  "maternity_leave",
  "paternity_leave",
  "remote_workforce",
] as const;

export type WorkforceEventType = (typeof WORKFORCE_EVENT_TYPES)[number];

export type WorkforceEventEarningSource = "paid_leave" | "attendance" | "workforce_event";

export type WorkforceEventContext = {
  companyId: string;
  userId: string;
  /** Ownership / attendance calendar day (YYYY-MM-DD) in company business timezone. */
  ownershipYmd: string;
  eventType: WorkforceEventType;
  /** Optional source row (e.g. leave_requests.id). */
  sourceId?: string | null;
  now?: Date;
};

export type WorkforceEventCreditResult =
  | { status: "credited"; recordId: string; recordType: string; gross: number }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string };

export type WorkforceEventProcessor = (
  ctx: WorkforceEventContext
) => Promise<WorkforceEventCreditResult>;
