import * as timelineService from "../timeline/timeline.service";
import type { PayrollPeriodRecord } from "./payrollPeriod.types";
import type { PayrollPeriodStatus } from "./payrollPeriod.constants";
import {
  formatPayrollPeriodStatusLabel,
  normalizePayrollPeriodStatus,
} from "./payrollPeriod.constants";
import { PAYROLL_REOPEN_REASON_LABELS, type PayrollReopenReasonCode } from "./payrollPeriod.reopen.constants";

export const PAYROLL_TIMELINE_MODULE = "payroll";
export const PAYROLL_PERIOD_ENTITY_TYPE = "payroll_period";

export const PAYROLL_PERIOD_TIMELINE_EVENTS = {
  CREATED: "payroll_period.created",
  SUBMITTED_FOR_REVIEW: "payroll_period.submitted_for_review",
  APPROVED: "payroll_period.approved",
  LOCKED: "payroll_period.locked",
  UNLOCKED: "payroll_period.unlocked",
  CLOSED: "payroll_period.closed",
  ARCHIVED: "payroll_period.archived",
  REOPENED: "payroll_period.reopened",
  REGENERATED: "payroll_period.regenerated",
} as const;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function periodLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1] ?? month} ${year}`;
}

function statusLabel(status: PayrollPeriodStatus | string): string {
  return formatPayrollPeriodStatusLabel(status);
}

function canonical(status: PayrollPeriodStatus | string): PayrollPeriodStatus {
  return normalizePayrollPeriodStatus(status) ?? "draft";
}

function baseMetadata(
  period: PayrollPeriodRecord,
  previousStatus: PayrollPeriodStatus | string,
  currentStatus: PayrollPeriodStatus | string,
  extra?: Record<string, unknown>
): Record<string, unknown> {
  return {
    year: period.payroll_year,
    month: period.payroll_month,
    previous_status: canonical(previousStatus),
    current_status: canonical(currentStatus),
    ...extra,
  };
}

async function safeRecord(
  input: Parameters<typeof timelineService.recordEvent>[0]
): Promise<void> {
  try {
    await timelineService.recordEvent(input);
  } catch (err) {
    console.error("[timeline] payroll period event failed", err);
  }
}

export async function recordPayrollPeriodCreated(
  period: PayrollPeriodRecord,
  performedBy: string | null | undefined,
  performedByName: string | null | undefined
): Promise<void> {
  const label = periodLabel(period.payroll_year, period.payroll_month);
  await safeRecord({
    companyId: period.company_id,
    module: PAYROLL_TIMELINE_MODULE,
    entityType: PAYROLL_PERIOD_ENTITY_TYPE,
    entityId: period.id,
    eventType: PAYROLL_PERIOD_TIMELINE_EVENTS.CREATED,
    title: "Payroll Period Created",
    description: `${label} payroll period was created.`,
    performedBy: performedBy ?? null,
    performedByName: performedByName ?? null,
    occurredAt: period.generated_at ?? undefined,
    metadata: baseMetadata(period, "draft", "draft"),
  });
}

export async function recordPayrollPeriodSubmittedForReview(
  period: PayrollPeriodRecord,
  previousStatus: PayrollPeriodStatus,
  performedBy: string,
  performedByName: string | null | undefined
): Promise<void> {
  const label = periodLabel(period.payroll_year, period.payroll_month);
  await safeRecord({
    companyId: period.company_id,
    module: PAYROLL_TIMELINE_MODULE,
    entityType: PAYROLL_PERIOD_ENTITY_TYPE,
    entityId: period.id,
    eventType: PAYROLL_PERIOD_TIMELINE_EVENTS.SUBMITTED_FOR_REVIEW,
    title: "Payroll Submitted for Processing",
    description: `${label} payroll was submitted for processing.`,
    performedBy,
    performedByName: performedByName ?? null,
    occurredAt: period.submitted_for_review_at ?? undefined,
    metadata: baseMetadata(period, previousStatus, "processing"),
  });
}

export async function recordPayrollPeriodApproved(
  period: PayrollPeriodRecord,
  previousStatus: PayrollPeriodStatus,
  performedBy: string,
  performedByName: string | null | undefined
): Promise<void> {
  const label = periodLabel(period.payroll_year, period.payroll_month);
  await safeRecord({
    companyId: period.company_id,
    module: PAYROLL_TIMELINE_MODULE,
    entityType: PAYROLL_PERIOD_ENTITY_TYPE,
    entityId: period.id,
    eventType: PAYROLL_PERIOD_TIMELINE_EVENTS.APPROVED,
    title: "Payroll Approved",
    description: `${label} payroll was approved.`,
    performedBy,
    performedByName: performedByName ?? null,
    occurredAt: period.approved_at ?? undefined,
    metadata: baseMetadata(period, previousStatus, "approved"),
  });
}

export async function recordPayrollPeriodLocked(
  period: PayrollPeriodRecord,
  previousStatus: PayrollPeriodStatus,
  performedBy: string,
  performedByName: string | null | undefined
): Promise<void> {
  const label = periodLabel(period.payroll_year, period.payroll_month);
  await safeRecord({
    companyId: period.company_id,
    module: PAYROLL_TIMELINE_MODULE,
    entityType: PAYROLL_PERIOD_ENTITY_TYPE,
    entityId: period.id,
    eventType: PAYROLL_PERIOD_TIMELINE_EVENTS.LOCKED,
    title: "Payroll Locked",
    description: `${label} payroll was locked.`,
    performedBy,
    performedByName: performedByName ?? null,
    occurredAt: period.locked_at ?? undefined,
    metadata: baseMetadata(period, previousStatus, "locked"),
  });
}

export async function recordPayrollPeriodUnlocked(
  period: PayrollPeriodRecord,
  previousStatus: PayrollPeriodStatus,
  performedBy: string,
  performedByName: string | null | undefined
): Promise<void> {
  const label = periodLabel(period.payroll_year, period.payroll_month);
  await safeRecord({
    companyId: period.company_id,
    module: PAYROLL_TIMELINE_MODULE,
    entityType: PAYROLL_PERIOD_ENTITY_TYPE,
    entityId: period.id,
    eventType: PAYROLL_PERIOD_TIMELINE_EVENTS.UNLOCKED,
    title: "Payroll Unlocked",
    description: `${label} payroll was unlocked to approved.`,
    performedBy,
    performedByName: performedByName ?? null,
    occurredAt: period.updated_at ?? undefined,
    metadata: baseMetadata(period, previousStatus, "approved"),
  });
}

export async function recordPayrollPeriodClosed(
  period: PayrollPeriodRecord,
  previousStatus: PayrollPeriodStatus,
  performedBy: string,
  performedByName: string | null | undefined
): Promise<void> {
  const label = periodLabel(period.payroll_year, period.payroll_month);
  await safeRecord({
    companyId: period.company_id,
    module: PAYROLL_TIMELINE_MODULE,
    entityType: PAYROLL_PERIOD_ENTITY_TYPE,
    entityId: period.id,
    eventType: PAYROLL_PERIOD_TIMELINE_EVENTS.ARCHIVED,
    title: "Payroll Archived",
    description: `${label} payroll was archived.`,
    performedBy,
    performedByName: performedByName ?? null,
    occurredAt: period.closed_at ?? undefined,
    metadata: baseMetadata(period, previousStatus, "archived"),
  });
}

export async function recordPayrollPeriodReopened(
  period: PayrollPeriodRecord,
  performedBy: string,
  performedByName: string | null | undefined,
  reasonCode: string,
  previousStatus: PayrollPeriodStatus | string = "archived"
): Promise<void> {
  const label = periodLabel(period.payroll_year, period.payroll_month);
  const reasonLabel =
    PAYROLL_REOPEN_REASON_LABELS[reasonCode as PayrollReopenReasonCode] ?? reasonCode;
  await safeRecord({
    companyId: period.company_id,
    module: PAYROLL_TIMELINE_MODULE,
    entityType: PAYROLL_PERIOD_ENTITY_TYPE,
    entityId: period.id,
    eventType: PAYROLL_PERIOD_TIMELINE_EVENTS.REOPENED,
    title: "Payroll Reopened",
    description: `${label} payroll was reopened for correction (${reasonLabel}).`,
    performedBy,
    performedByName: performedByName ?? null,
    occurredAt: period.reopened_at ?? undefined,
    metadata: baseMetadata(period, previousStatus, "processing", {
      reason: reasonCode,
      reason_label: reasonLabel,
    }),
  });
}

export async function recordPayrollPeriodRegenerated(
  period: PayrollPeriodRecord,
  performedBy: string,
  performedByName: string | null | undefined,
  reason: string | null
): Promise<void> {
  const label = periodLabel(period.payroll_year, period.payroll_month);
  const status = canonical(period.status);
  await safeRecord({
    companyId: period.company_id,
    module: PAYROLL_TIMELINE_MODULE,
    entityType: PAYROLL_PERIOD_ENTITY_TYPE,
    entityId: period.id,
    eventType: PAYROLL_PERIOD_TIMELINE_EVENTS.REGENERATED,
    title: "Payroll Regenerated",
    description: `${label} payroll was explicitly regenerated.`,
    performedBy,
    performedByName: performedByName ?? null,
    occurredAt: new Date().toISOString(),
    metadata: baseMetadata(period, status, status, {
      reason: reason ?? null,
    }),
  });
}

export { statusLabel };
