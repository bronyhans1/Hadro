import type { LeaveRequestRecord } from "../leave/leave.repository";
import {
  classifyLeavePayrollCompensation,
  type LeavePayrollCompensationClass,
} from "./leavePayrollClassification";

export const PAYROLL_DAY_CLASSIFICATIONS = ["WORKING", "PAID_LEAVE", "UNPAID_LEAVE"] as const;

export type PayrollDayClassification = (typeof PAYROLL_DAY_CLASSIFICATIONS)[number];

export type LeavePayrollLifecycleStatus =
  | "approved"
  | "terminated"
  | "completed"
  | "cancelled"
  | "rejected"
  | "pending";

const PAYROLL_RELEVANT_STATUSES = new Set<string>(["approved", "terminated", "completed"]);

export function normalizeLeaveLifecycleStatus(status: string | null | undefined): string {
  return (status ?? "").trim().toLowerCase();
}

export function isPayrollRelevantLeaveStatus(status: string | null | undefined): boolean {
  return PAYROLL_RELEVANT_STATUSES.has(normalizeLeaveLifecycleStatus(status));
}

/**
 * Whether `dateYmd` falls in the leave period for payroll awareness (not earnings).
 *
 * - approved: [start_date, end_date] inclusive
 * - completed: historical [start_date, end_date] inclusive
 * - terminated: [start_date, actual_return_date) — return date is first day back at work
 * - cancelled / rejected / pending: never
 */
export function isDateWithinLeavePayrollPeriod(
  leave: Pick<LeaveRequestRecord, "status" | "start_date" | "end_date" | "actual_return_date">,
  dateYmd: string
): boolean {
  const status = normalizeLeaveLifecycleStatus(leave.status);
  if (!PAYROLL_RELEVANT_STATUSES.has(status)) return false;
  if (!leave.start_date || !leave.end_date) return false;
  if (dateYmd < leave.start_date) return false;

  if (status === "terminated") {
    const returnYmd = leave.actual_return_date?.slice(0, 10);
    if (!returnYmd) return dateYmd <= leave.end_date;
    return dateYmd < returnYmd;
  }

  return dateYmd <= leave.end_date;
}

export type LeaveCoverageForDate = {
  leaveRequestId: string;
  leaveType: string;
  leaveStatus: LeavePayrollLifecycleStatus;
  compensationClass: LeavePayrollCompensationClass;
  payrollDayClassification: Extract<PayrollDayClassification, "PAID_LEAVE" | "UNPAID_LEAVE">;
  startDate: string;
  endDate: string;
  actualReturnDate: string | null;
};

function lifecyclePriority(status: string): number {
  switch (status) {
    case "approved":
      return 3;
    case "terminated":
      return 2;
    case "completed":
      return 1;
    default:
      return 0;
  }
}

/**
 * Pick the governing leave row for a calendar day (for payroll / reports / exports).
 * Does not affect earnings.
 */
export function resolveLeaveCoverageForDate(
  leaves: LeaveRequestRecord[],
  dateYmd: string
): LeaveCoverageForDate | null {
  const candidates = leaves.filter((l) => isDateWithinLeavePayrollPeriod(l, dateYmd));
  if (candidates.length === 0) return null;

  const sorted = [...candidates].sort((a, b) => {
    const pa = lifecyclePriority(normalizeLeaveLifecycleStatus(a.status));
    const pb = lifecyclePriority(normalizeLeaveLifecycleStatus(b.status));
    if (pb !== pa) return pb - pa;
    if (a.start_date !== b.start_date) return a.start_date < b.start_date ? -1 : 1;
    return a.id < b.id ? -1 : 1;
  });

  const pick = sorted[0]!;
  const compensationClass = classifyLeavePayrollCompensation(pick);
  const payrollDayClassification =
    compensationClass === "paid" ? "PAID_LEAVE" : "UNPAID_LEAVE";

  return {
    leaveRequestId: pick.id,
    leaveType: pick.leave_type,
    leaveStatus: normalizeLeaveLifecycleStatus(pick.status) as LeavePayrollLifecycleStatus,
    compensationClass,
    payrollDayClassification,
    startDate: pick.start_date,
    endDate: pick.end_date,
    actualReturnDate: pick.actual_return_date?.slice(0, 10) ?? null,
  };
}

export function payrollDayClassificationFromCoverage(
  coverage: LeaveCoverageForDate | null
): PayrollDayClassification {
  if (!coverage) return "WORKING";
  return coverage.payrollDayClassification;
}
