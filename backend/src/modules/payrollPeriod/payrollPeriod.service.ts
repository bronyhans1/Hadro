import { normalizeBusinessTimeZone } from "../../lib/businessCalendar";
import * as companyPolicyRepo from "../companyPolicy/companyPolicy.repository";
import * as usersRepo from "../users/users.repository";
import {
  PAYROLL_PERIOD_LIST_DEFAULT_LIMIT,
  PAYROLL_PERIOD_LIST_MAX_LIMIT,
  PAYROLL_PERIOD_MONTH_MAX,
  PAYROLL_PERIOD_MONTH_MIN,
  PAYROLL_PERIOD_STATUSES,
  PAYROLL_PERIOD_YEAR_MAX,
  PAYROLL_PERIOD_YEAR_MIN,
  formatPayrollPeriodStatusLabel,
  normalizePayrollPeriodStatus,
  type PayrollPeriodStatus,
} from "./payrollPeriod.constants";
import * as payrollPeriodRepo from "./payrollPeriod.repository";
import type {
  PayrollPeriodListOptions,
  PayrollPeriodListResult,
  PayrollPeriodRecord,
  PayrollPeriodResponse,
  ReopenPayrollPeriodInput,
} from "./payrollPeriod.types";
import {
  PAYROLL_REOPEN_EXPLANATION_MAX_LENGTH,
  PAYROLL_REOPEN_EXPLANATION_MIN_LENGTH,
  PAYROLL_REOPEN_REASON_CODES,
  PAYROLL_REOPEN_REASON_LABELS,
  type PayrollReopenReasonCode,
} from "./payrollPeriod.reopen.constants";
import * as payrollPeriodTimeline from "./payrollPeriod.timeline";

export class PayrollPeriodValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PayrollPeriodValidationError";
  }
}

export class PayrollPeriodTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PayrollPeriodTransitionError";
  }
}

const STATUS_RANK: Record<PayrollPeriodStatus, number> = {
  draft: 0,
  processing: 1,
  approved: 2,
  locked: 3,
  archived: 4,
};

function statusRank(status: PayrollPeriodStatus | string): number {
  const normalized = normalizePayrollPeriodStatus(status) ?? "draft";
  return STATUS_RANK[normalized] ?? 0;
}

function isAtLeastProcessing(status: PayrollPeriodStatus | string): boolean {
  return statusRank(status) >= STATUS_RANK.processing;
}

function isAtLeastApproved(status: PayrollPeriodStatus | string): boolean {
  return statusRank(status) >= STATUS_RANK.approved;
}

function isAtLeastLocked(status: PayrollPeriodStatus | string): boolean {
  return statusRank(status) >= STATUS_RANK.locked;
}

function isAtLeastArchived(status: PayrollPeriodStatus | string): boolean {
  return statusRank(status) >= STATUS_RANK.archived;
}

function canonicalStatus(status: PayrollPeriodStatus | string): PayrollPeriodStatus {
  return normalizePayrollPeriodStatus(status) ?? "draft";
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidPayrollPeriodUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function validatePayrollYear(year: number): void {
  if (!Number.isInteger(year) || year < PAYROLL_PERIOD_YEAR_MIN || year > PAYROLL_PERIOD_YEAR_MAX) {
    throw new PayrollPeriodValidationError(
      `Valid year (${PAYROLL_PERIOD_YEAR_MIN}-${PAYROLL_PERIOD_YEAR_MAX}) is required`
    );
  }
}

export function validatePayrollMonth(month: number): void {
  if (!Number.isInteger(month) || month < PAYROLL_PERIOD_MONTH_MIN || month > PAYROLL_PERIOD_MONTH_MAX) {
    throw new PayrollPeriodValidationError(
      `Valid month (${PAYROLL_PERIOD_MONTH_MIN}-${PAYROLL_PERIOD_MONTH_MAX}) is required`
    );
  }
}

export function validatePayrollYearMonth(year: number, month: number): void {
  validatePayrollYear(year);
  validatePayrollMonth(month);
}

export function parsePayrollPeriodStatus(
  raw: string | undefined
): PayrollPeriodStatus | undefined {
  if (!raw?.trim()) return undefined;
  const normalized = normalizePayrollPeriodStatus(raw);
  if (!normalized) {
    throw new PayrollPeriodValidationError(
      `Invalid status. Allowed: ${PAYROLL_PERIOD_STATUSES.join(", ")}`
    );
  }
  return normalized;
}

export function formatPayrollPeriodLabel(year: number, month: number): string {
  const names = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${names[month - 1] ?? month} ${year}`;
}

async function resolveBusinessTimezone(companyId: string): Promise<string> {
  const policy = await companyPolicyRepo.getPolicyByCompany(companyId);
  return normalizeBusinessTimeZone(policy?.business_timezone);
}

async function resolveActorName(
  userId: string | null | undefined
): Promise<string | null> {
  if (!userId) return null;
  const user = await usersRepo.getUserById(userId);
  if (!user) return null;
  const name = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
  return name || user.email || null;
}

function resolveReopenReasonLabel(
  reasonCode: string | null | undefined
): string | null {
  if (!reasonCode) return null;
  const code = reasonCode as PayrollReopenReasonCode;
  return PAYROLL_REOPEN_REASON_LABELS[code] ?? reasonCode;
}

export function parseReopenReasonCode(raw: unknown): PayrollReopenReasonCode {
  if (typeof raw !== "string" || !raw.trim()) {
    throw new PayrollPeriodValidationError("Reopen reason code is required");
  }
  const code = raw.trim().toLowerCase();
  if (!PAYROLL_REOPEN_REASON_CODES.includes(code as PayrollReopenReasonCode)) {
    throw new PayrollPeriodValidationError(
      `Invalid reopen reason code. Allowed: ${PAYROLL_REOPEN_REASON_CODES.join(", ")}`
    );
  }
  return code as PayrollReopenReasonCode;
}

export function validateReopenExplanation(raw: unknown): string {
  if (typeof raw !== "string") {
    throw new PayrollPeriodValidationError("Reopen explanation is required");
  }
  const explanation = raw.trim();
  if (!explanation) {
    throw new PayrollPeriodValidationError("Reopen explanation is required");
  }
  if (explanation.length < PAYROLL_REOPEN_EXPLANATION_MIN_LENGTH) {
    throw new PayrollPeriodValidationError(
      `Reopen explanation must be at least ${PAYROLL_REOPEN_EXPLANATION_MIN_LENGTH} characters`
    );
  }
  if (explanation.length > PAYROLL_REOPEN_EXPLANATION_MAX_LENGTH) {
    throw new PayrollPeriodValidationError(
      `Reopen explanation must be at most ${PAYROLL_REOPEN_EXPLANATION_MAX_LENGTH} characters`
    );
  }
  return explanation;
}

export function normalizeReopenInput(body: unknown): ReopenPayrollPeriodInput {
  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  return {
    reason_code: parseReopenReasonCode(payload.reason_code),
    explanation: validateReopenExplanation(payload.explanation),
  };
}

export async function toPayrollPeriodResponse(
  record: PayrollPeriodRecord
): Promise<PayrollPeriodResponse> {
  const [generated_by_name, submitted_by_name, approved_by_name, locked_by_name, closed_by_name, reopened_by_name] =
    await Promise.all([
    resolveActorName(record.generated_by),
    resolveActorName(record.submitted_by),
    resolveActorName(record.approved_by),
    resolveActorName(record.locked_by),
    resolveActorName(record.closed_by),
    resolveActorName(record.reopened_by),
  ]);
  return {
    ...record,
    status: canonicalStatus(record.status),
    period_label: formatPayrollPeriodLabel(record.payroll_year, record.payroll_month),
    generated_by_name,
    submitted_by_name,
    approved_by_name,
    locked_by_name,
    closed_by_name,
    reopened_by_name,
    reopen_reason_label: resolveReopenReasonLabel(record.reopen_reason),
  };
}

export async function getOrCreate(
  companyId: string,
  year: number,
  month: number,
  generatedBy?: string | null
): Promise<PayrollPeriodResponse> {
  validatePayrollYearMonth(year, month);

  const businessTimezone = await resolveBusinessTimezone(companyId);
  const existing = await payrollPeriodRepo.findByCompanyMonth(companyId, year, month);
  const row = await payrollPeriodRepo.upsertDraft({
    company_id: companyId,
    payroll_year: year,
    payroll_month: month,
    business_timezone: businessTimezone,
    generated_by: generatedBy ?? null,
  });

  if (!existing) {
    const performerName = await resolveActorName(generatedBy);
    await payrollPeriodTimeline.recordPayrollPeriodCreated(row, generatedBy, performerName);
  }

  return toPayrollPeriodResponse(row);
}

export async function getByCompanyMonth(
  companyId: string,
  year: number,
  month: number
): Promise<PayrollPeriodResponse | null> {
  validatePayrollYearMonth(year, month);
  const row = await payrollPeriodRepo.findByCompanyMonth(companyId, year, month);
  if (!row) return null;
  return toPayrollPeriodResponse(row);
}

export async function getById(
  companyId: string,
  id: string
): Promise<PayrollPeriodResponse | null> {
  if (!isValidPayrollPeriodUuid(id)) {
    throw new PayrollPeriodValidationError("Valid period id is required");
  }
  const row = await payrollPeriodRepo.findById(id, companyId);
  if (!row) return null;
  return toPayrollPeriodResponse(row);
}

export function normalizeListOptions(query: {
  year?: unknown;
  status?: unknown;
  limit?: unknown;
  offset?: unknown;
}): PayrollPeriodListOptions {
  const options: PayrollPeriodListOptions = {};

  if (query.year !== undefined && query.year !== "") {
    const year = Number(query.year);
    validatePayrollYear(year);
    options.year = year;
  }

  if (query.status !== undefined && query.status !== "") {
    options.status = parsePayrollPeriodStatus(String(query.status));
  }

  let limit = PAYROLL_PERIOD_LIST_DEFAULT_LIMIT;
  if (query.limit !== undefined && query.limit !== "") {
    const parsed = Number(query.limit);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new PayrollPeriodValidationError("limit must be a positive integer");
    }
    limit = Math.min(parsed, PAYROLL_PERIOD_LIST_MAX_LIMIT);
  }
  options.limit = limit;

  let offset = 0;
  if (query.offset !== undefined && query.offset !== "") {
    const parsed = Number(query.offset);
    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new PayrollPeriodValidationError("offset must be a non-negative integer");
    }
    offset = parsed;
  }
  options.offset = offset;

  return options;
}

export async function listPeriods(
  companyId: string,
  options: PayrollPeriodListOptions
): Promise<{ periods: PayrollPeriodResponse[]; total: number }> {
  const result: PayrollPeriodListResult = await payrollPeriodRepo.listByCompany(
    companyId,
    options
  );
  const periods = await Promise.all(result.periods.map((row) => toPayrollPeriodResponse(row)));
  return { periods, total: result.total };
}

export async function submitForReview(
  companyId: string,
  periodId: string,
  userId: string
): Promise<PayrollPeriodResponse | null> {
  if (!isValidPayrollPeriodUuid(periodId)) {
    throw new PayrollPeriodValidationError("Valid period id is required");
  }

  const row = await payrollPeriodRepo.findById(periodId, companyId);
  if (!row) return null;

  if (isAtLeastProcessing(row.status)) {
    return toPayrollPeriodResponse(row);
  }

  if (canonicalStatus(row.status) !== "draft") {
    throw new PayrollPeriodTransitionError(
      "Payroll period can only be submitted for processing from draft status"
    );
  }

  const now = new Date().toISOString();
  const updated = await payrollPeriodRepo.updateTransition(periodId, companyId, {
    status: "processing",
    submitted_for_review_at: now,
    submitted_by: userId,
    updated_at: now,
  });
  if (!updated) return null;
  const performerName = await resolveActorName(userId);
  await payrollPeriodTimeline.recordPayrollPeriodSubmittedForReview(
    updated,
    canonicalStatus(row.status),
    userId,
    performerName
  );
  return toPayrollPeriodResponse(updated);
}

export async function approve(
  companyId: string,
  periodId: string,
  userId: string
): Promise<PayrollPeriodResponse | null> {
  if (!isValidPayrollPeriodUuid(periodId)) {
    throw new PayrollPeriodValidationError("Valid period id is required");
  }

  const row = await payrollPeriodRepo.findById(periodId, companyId);
  if (!row) return null;

  if (isAtLeastApproved(row.status)) {
    return toPayrollPeriodResponse(row);
  }

  if (canonicalStatus(row.status) !== "processing") {
    throw new PayrollPeriodTransitionError(
      "Payroll period must be in processing before it can be approved"
    );
  }

  const now = new Date().toISOString();
  const updated = await payrollPeriodRepo.updateTransition(periodId, companyId, {
    status: "approved",
    approved_at: now,
    approved_by: userId,
    updated_at: now,
  });
  if (!updated) return null;
  const performerName = await resolveActorName(userId);
  await payrollPeriodTimeline.recordPayrollPeriodApproved(
    updated,
    canonicalStatus(row.status),
    userId,
    performerName
  );
  return toPayrollPeriodResponse(updated);
}

export async function lock(
  companyId: string,
  periodId: string,
  userId: string
): Promise<PayrollPeriodResponse | null> {
  if (!isValidPayrollPeriodUuid(periodId)) {
    throw new PayrollPeriodValidationError("Valid period id is required");
  }

  const row = await payrollPeriodRepo.findById(periodId, companyId);
  if (!row) return null;

  if (isAtLeastLocked(row.status)) {
    return toPayrollPeriodResponse(row);
  }

  if (canonicalStatus(row.status) !== "approved") {
    throw new PayrollPeriodTransitionError(
      "Payroll period must be approved before it can be locked"
    );
  }

  const now = new Date().toISOString();
  const updated = await payrollPeriodRepo.updateTransition(periodId, companyId, {
    status: "locked",
    locked_at: now,
    locked_by: userId,
    updated_at: now,
  });
  if (!updated) return null;
  const performerName = await resolveActorName(userId);
  await payrollPeriodTimeline.recordPayrollPeriodLocked(
    updated,
    canonicalStatus(row.status),
    userId,
    performerName
  );
  return toPayrollPeriodResponse(updated);
}

export async function close(
  companyId: string,
  periodId: string,
  userId: string
): Promise<PayrollPeriodResponse | null> {
  if (!isValidPayrollPeriodUuid(periodId)) {
    throw new PayrollPeriodValidationError("Valid period id is required");
  }

  const row = await payrollPeriodRepo.findById(periodId, companyId);
  if (!row) return null;

  if (isAtLeastArchived(row.status)) {
    return toPayrollPeriodResponse(row);
  }

  if (canonicalStatus(row.status) !== "locked") {
    throw new PayrollPeriodTransitionError(
      "Payroll period must be locked before it can be archived"
    );
  }

  const now = new Date().toISOString();
  const updated = await payrollPeriodRepo.updateTransition(periodId, companyId, {
    status: "archived",
    closed_at: now,
    closed_by: userId,
    updated_at: now,
  });
  if (!updated) return null;
  const performerName = await resolveActorName(userId);
  await payrollPeriodTimeline.recordPayrollPeriodClosed(
    updated,
    canonicalStatus(row.status),
    userId,
    performerName
  );
  return toPayrollPeriodResponse(updated);
}

/** Unlock locked period back to approved (still protected from regeneration). */
export async function unlock(
  companyId: string,
  periodId: string,
  userId: string
): Promise<PayrollPeriodResponse | null> {
  if (!isValidPayrollPeriodUuid(periodId)) {
    throw new PayrollPeriodValidationError("Valid period id is required");
  }

  const row = await payrollPeriodRepo.findById(periodId, companyId);
  if (!row) return null;

  const status = canonicalStatus(row.status);
  if (status === "approved") {
    return toPayrollPeriodResponse(row);
  }
  if (status !== "locked") {
    throw new PayrollPeriodTransitionError(
      "Only a locked payroll period can be unlocked"
    );
  }

  const now = new Date().toISOString();
  const updated = await payrollPeriodRepo.updateTransition(periodId, companyId, {
    status: "approved",
    updated_at: now,
  });
  if (!updated) return null;
  const performerName = await resolveActorName(userId);
  await payrollPeriodTimeline.recordPayrollPeriodUnlocked(
    updated,
    status,
    userId,
    performerName
  );
  return toPayrollPeriodResponse(updated);
}

export async function reopen(
  companyId: string,
  periodId: string,
  userId: string,
  input: ReopenPayrollPeriodInput
): Promise<PayrollPeriodResponse | null> {
  if (!isValidPayrollPeriodUuid(periodId)) {
    throw new PayrollPeriodValidationError("Valid period id is required");
  }

  const reasonCode = parseReopenReasonCode(input.reason_code);
  const explanation = validateReopenExplanation(input.explanation);

  const row = await payrollPeriodRepo.findById(periodId, companyId);
  if (!row) return null;

  const status = canonicalStatus(row.status);
  if (status === "processing" && row.reopened_at) {
    throw new PayrollPeriodTransitionError(
      "Payroll period has already been reopened and is awaiting approval"
    );
  }

  if (status !== "approved" && status !== "locked" && status !== "archived") {
    throw new PayrollPeriodTransitionError(
      "Payroll period must be approved, locked, or archived before it can be reopened"
    );
  }

  const now = new Date().toISOString();
  const updated = await payrollPeriodRepo.updateTransition(periodId, companyId, {
    status: "processing",
    reopened_at: now,
    reopened_by: userId,
    reopen_reason: reasonCode,
    reopen_explanation: explanation,
    updated_at: now,
  });
  if (!updated) return null;
  const performerName = await resolveActorName(userId);
  await payrollPeriodTimeline.recordPayrollPeriodReopened(
    updated,
    userId,
    performerName,
    reasonCode,
    status
  );
  return toPayrollPeriodResponse(updated);
}

/**
 * Explicit payroll regeneration for a mutable period (draft/processing only).
 * Resyncs monthly salary accruals for all monthly-wage employees in the period month.
 */
export async function regeneratePeriodPayroll(
  companyId: string,
  periodId: string,
  userId: string,
  reason?: string | null
): Promise<PayrollPeriodResponse | null> {
  if (!isValidPayrollPeriodUuid(periodId)) {
    throw new PayrollPeriodValidationError("Valid period id is required");
  }

  const row = await payrollPeriodRepo.findById(periodId, companyId);
  if (!row) return null;

  const status = canonicalStatus(row.status);
  if (status !== "draft" && status !== "processing") {
    throw new PayrollPeriodTransitionError(
      `This payroll period (${formatPayrollPeriodLabel(row.payroll_year, row.payroll_month)}) ` +
        `has been ${formatPayrollPeriodStatusLabel(status).toLowerCase()} and cannot be modified. ` +
        `To make changes, reopen the payroll period (Payroll Administrator only) or create a payroll adjustment.`
    );
  }

  const { resyncCompanyUsersForYearMonth } = await import(
    "../payroll/salaryEarnings.resync"
  );
  await resyncCompanyUsersForYearMonth(companyId, row.payroll_year, row.payroll_month);

  const performerName = await resolveActorName(userId);
  await payrollPeriodTimeline.recordPayrollPeriodRegenerated(
    row,
    userId,
    performerName,
    reason ?? null
  );
  return toPayrollPeriodResponse(row);
}
