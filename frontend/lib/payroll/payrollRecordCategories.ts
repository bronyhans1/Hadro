/** Display-only earning classification — mirrors backend payrollRecordSemantics. */

export type PayrollRecordLike = {
  record_type?: string | null;
  earning_source?: string | null;
};

export function isManualOvertimeEarningRecord(r: PayrollRecordLike): boolean {
  const rt = r.record_type ?? "session_hourly";
  return rt === "manual_overtime" || (r.earning_source ?? "attendance") === "manual_overtime";
}

export function isAttendanceEarningRecord(r: PayrollRecordLike): boolean {
  const rt = r.record_type ?? "session_hourly";
  if (rt === "session_hourly") return true;
  if (rt === "leave_hourly" || rt === "manual_overtime") return false;
  return (r.earning_source ?? "attendance") === "attendance";
}

export function isPaidLeaveEarningRecord(r: PayrollRecordLike): boolean {
  const rt = r.record_type ?? "session_hourly";
  if (rt === "leave_hourly") return true;
  if (rt === "session_hourly" || rt === "manual_overtime") return false;
  return (r.earning_source ?? "attendance") === "paid_leave";
}
