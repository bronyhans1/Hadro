import * as leaveRepo from "../leave/leave.repository";
import {
  isPaidLeaveForPayroll,
  isUnpaidLeaveForPayroll,
} from "./leavePayrollClassification";
import {
  payrollDayClassificationFromCoverage,
  resolveLeaveCoverageForDate,
  type LeaveCoverageForDate,
  type PayrollDayClassification,
} from "./payrollLeaveCoverage";

export type { LeaveCoverageForDate, PayrollDayClassification };

export type PayrollDayContext = {
  date: string;
  classification: PayrollDayClassification;
  leaveCoverage: LeaveCoverageForDate | null;
  /** True when an approved/completed/terminated leave covers the date with paid compensation. */
  coveredByPaidLeave: boolean;
  /** True when an approved/completed/terminated leave covers the date with unpaid compensation. */
  coveredByUnpaidLeave: boolean;
};

/** Reporting readiness: metadata for payroll summaries (no earnings impact). */
export type PayrollLeaveReadinessMeta = {
  today_payroll_day_classification: PayrollDayClassification;
  today_covered_by_approved_paid_leave: boolean;
  today_leave_request_id: string | null;
};

async function loadPayrollRelevantLeave(
  userId: string,
  companyId: string,
  dateYmd: string
): Promise<leaveRepo.LeaveRequestRecord[]> {
  return leaveRepo.listLeaveRequestsForPayrollCoverage(userId, companyId, dateYmd, dateYmd);
}

/**
 * Classify a single calendar day for payroll awareness (WORKING | PAID_LEAVE | UNPAID_LEAVE).
 * Does not read or write payroll_records and does not change earnings.
 */
export async function getPayrollDayClassification(
  userId: string,
  companyId: string,
  dateYmd: string
): Promise<PayrollDayContext> {
  const leaves = await loadPayrollRelevantLeave(userId, companyId, dateYmd);
  const leaveCoverage = resolveLeaveCoverageForDate(leaves, dateYmd);
  const classification = payrollDayClassificationFromCoverage(leaveCoverage);
  return {
    date: dateYmd,
    classification,
    leaveCoverage,
    coveredByPaidLeave: classification === "PAID_LEAVE",
    coveredByUnpaidLeave: classification === "UNPAID_LEAVE",
  };
}

export async function isEmployeeOnPaidLeaveForDate(
  userId: string,
  companyId: string,
  dateYmd: string
): Promise<boolean> {
  const ctx = await getPayrollDayClassification(userId, companyId, dateYmd);
  return ctx.coveredByPaidLeave;
}

export async function isEmployeeOnUnpaidLeaveForDate(
  userId: string,
  companyId: string,
  dateYmd: string
): Promise<boolean> {
  const ctx = await getPayrollDayClassification(userId, companyId, dateYmd);
  return ctx.coveredByUnpaidLeave;
}

/**
 * Resolve leave coverage for a date (reusable by payroll, reports, exports, analytics).
 */
export async function resolveLeaveCoverageForEmployeeDate(
  userId: string,
  companyId: string,
  dateYmd: string
): Promise<LeaveCoverageForDate | null> {
  const leaves = await loadPayrollRelevantLeave(userId, companyId, dateYmd);
  return resolveLeaveCoverageForDate(leaves, dateYmd);
}

/** Lightweight fields for earnings API / future summaries — no amount changes. */
export async function getPayrollLeaveReadinessMeta(
  userId: string,
  companyId: string,
  dateYmd: string
): Promise<PayrollLeaveReadinessMeta> {
  const ctx = await getPayrollDayClassification(userId, companyId, dateYmd);
  return {
    today_payroll_day_classification: ctx.classification,
    today_covered_by_approved_paid_leave: ctx.coveredByPaidLeave,
    today_leave_request_id: ctx.leaveCoverage?.leaveRequestId ?? null,
  };
}

/** Classify many dates in one query (e.g. month grid). */
export async function getPayrollDayClassificationsForRange(
  userId: string,
  companyId: string,
  startYmd: string,
  endYmd: string
): Promise<Map<string, PayrollDayContext>> {
  const leaves = await leaveRepo.listLeaveRequestsForPayrollCoverage(
    userId,
    companyId,
    startYmd,
    endYmd
  );
  const out = new Map<string, PayrollDayContext>();
  const [sy, sm, sd] = startYmd.split("-").map(Number);
  const [ey, em, ed] = endYmd.split("-").map(Number);
  const cur = new Date(Date.UTC(sy, sm - 1, sd));
  const end = new Date(Date.UTC(ey, em - 1, ed));
  while (cur.getTime() <= end.getTime()) {
    const ymd = cur.toISOString().slice(0, 10);
    const leaveCoverage = resolveLeaveCoverageForDate(leaves, ymd);
    const classification = payrollDayClassificationFromCoverage(leaveCoverage);
    out.set(ymd, {
      date: ymd,
      classification,
      leaveCoverage,
      coveredByPaidLeave: classification === "PAID_LEAVE",
      coveredByUnpaidLeave: classification === "UNPAID_LEAVE",
    });
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

export { isPaidLeaveForPayroll, isUnpaidLeaveForPayroll };
