import type { PayrollRecord } from "./payroll.repository";

export const PAYROLL_EARNING_SOURCES = [
  "attendance",
  "paid_leave",
  "manual_overtime",
] as const;
export type PayrollEarningSource = (typeof PAYROLL_EARNING_SOURCES)[number];

export const PAYROLL_RECORD_TYPES = [
  "session_hourly",
  "salary_daily",
  "leave_hourly",
  "manual_overtime",
] as const;
export type PayrollRecordType = (typeof PAYROLL_RECORD_TYPES)[number];

export function isManualOvertimeEarningRecord(
  r: Pick<PayrollRecord, "record_type" | "earning_source">
): boolean {
  const rt = r.record_type ?? "session_hourly";
  return rt === "manual_overtime" || (r.earning_source ?? "attendance") === "manual_overtime";
}

/** Worked attendance earnings (session or salary from attendance). */
export function isAttendanceEarningRecord(r: Pick<PayrollRecord, "record_type" | "earning_source">): boolean {
  const rt = r.record_type ?? "session_hourly";
  if (rt === "session_hourly") return true;
  if (rt === "leave_hourly") return false;
  return (r.earning_source ?? "attendance") === "attendance";
}

/** Paid leave earnings (hourly leave row or salary_daily tagged paid_leave). */
export function isPaidLeaveEarningRecord(r: Pick<PayrollRecord, "record_type" | "earning_source">): boolean {
  const rt = r.record_type ?? "session_hourly";
  if (rt === "leave_hourly") return true;
  return (r.earning_source ?? "attendance") === "paid_leave";
}
