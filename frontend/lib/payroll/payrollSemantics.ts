/** Mirrors backend payrollSemantics — UI display only. */

import { translate } from "@/lib/i18n";

export const PAYROLL_RECORD_TYPE_SALARY_DAILY = "salary_daily";
export const PAYROLL_RECORD_TYPE_SESSION_HOURLY = "session_hourly";
export const PAYROLL_RECORD_TYPE_LEAVE_HOURLY = "leave_hourly";
export const PAYROLL_RECORD_TYPE_MANUAL_OVERTIME = "manual_overtime";

export function isSalaryDailyPayrollRecord(recordType?: string | null): boolean {
  return recordType === PAYROLL_RECORD_TYPE_SALARY_DAILY;
}

export function isLeaveHourlyPayrollRecord(recordType?: string | null): boolean {
  return recordType === PAYROLL_RECORD_TYPE_LEAVE_HOURLY;
}

export function isManualOvertimePayrollRecord(recordType?: string | null): boolean {
  return recordType === PAYROLL_RECORD_TYPE_MANUAL_OVERTIME;
}

export function payrollRecordTypeLabel(recordType?: string | null): string {
  if (isSalaryDailyPayrollRecord(recordType)) return translate("payroll.monthlyDayCredit");
  if (isLeaveHourlyPayrollRecord(recordType)) return translate("payroll.paidLeave");
  if (isManualOvertimePayrollRecord(recordType)) return translate("payroll.manualOvertimeBadge");
  if (recordType === PAYROLL_RECORD_TYPE_SESSION_HOURLY || !recordType) return translate("payroll.hourlySession");
  return recordType ?? translate("payroll.unknown");
}

/** Prefer Paid Leave when earning_source or leave_hourly identifies leave pay. */
export function payrollEarningDisplayLabel(record: {
  record_type?: string | null;
  earning_source?: string | null;
}): string {
  if ((record.earning_source ?? "").toLowerCase() === "paid_leave") return translate("payroll.paidLeave");
  if (isLeaveHourlyPayrollRecord(record.record_type)) return translate("payroll.paidLeave");
  return payrollRecordTypeLabel(record.record_type);
}

function salaryNa(): string {
  return translate("payroll.salaryBasedNa");
}

export function displayHoursWorked(record: {
  record_type?: string | null;
  hours_worked?: number | null;
}): string {
  if (isSalaryDailyPayrollRecord(record.record_type)) return salaryNa();
  if (record.hours_worked == null) return "—";
  return String(record.hours_worked);
}

export function displayRegularMinutes(record: {
  record_type?: string | null;
  regular_minutes?: number | null;
}): string {
  if (isSalaryDailyPayrollRecord(record.record_type)) return salaryNa();
  if (record.regular_minutes == null) return "—";
  return String(record.regular_minutes);
}

export function displayOvertimeMinutes(record: {
  record_type?: string | null;
  overtime_minutes?: number | null;
}): string {
  if (isSalaryDailyPayrollRecord(record.record_type)) return salaryNa();
  if (record.overtime_minutes == null) return "—";
  return String(record.overtime_minutes);
}

export function displayAttendanceDay(record: {
  record_type?: string | null;
  earnings_date?: string | null;
  payroll_date?: string | null;
}): string {
  if (isSalaryDailyPayrollRecord(record.record_type) || isLeaveHourlyPayrollRecord(record.record_type)) {
    const d = record.earnings_date ?? record.payroll_date;
    return d ? String(d).slice(0, 10) : "—";
  }
  return record.payroll_date ?? "—";
}

export function displayRateHeader(recordType?: string | null): string {
  return isSalaryDailyPayrollRecord(recordType) ? translate("payroll.dailyRate") : translate("payroll.hourlyRate");
}
