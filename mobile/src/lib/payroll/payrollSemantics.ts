/** Mirrors frontend/lib/payroll/payrollSemantics.ts — mobile display only. */

import { translate } from "@/lib/i18n";

export const PAYROLL_RECORD_TYPE_SALARY_DAILY = "salary_daily";
export const PAYROLL_RECORD_TYPE_SESSION_HOURLY = "session_hourly";
export const PAYROLL_RECORD_TYPE_LEAVE_HOURLY = "leave_hourly";

export function isSalaryDailyPayrollRecord(recordType?: string | null): boolean {
  return recordType === PAYROLL_RECORD_TYPE_SALARY_DAILY;
}

export function isLeaveHourlyPayrollRecord(recordType?: string | null): boolean {
  return recordType === PAYROLL_RECORD_TYPE_LEAVE_HOURLY;
}

export function isPaidLeaveHistoryRow(row: {
  record_type?: string | null;
  earning_source?: string | null;
  payroll_day_classification?: string | null;
}): boolean {
  if (row.payroll_day_classification === "PAID_LEAVE") return true;
  if ((row.earning_source ?? "").toLowerCase() === "paid_leave") return true;
  if (isLeaveHourlyPayrollRecord(row.record_type)) return true;
  return false;
}

export function payrollRecordTypeLabel(recordType?: string | null): string {
  if (isLeaveHourlyPayrollRecord(recordType)) return translate("payroll.paidLeave");
  if (isSalaryDailyPayrollRecord(recordType)) return translate("payroll.monthlyDayCredit");
  if (recordType === PAYROLL_RECORD_TYPE_SESSION_HOURLY || !recordType) return translate("payroll.hourlySession");
  return recordType ?? translate("payroll.unknown");
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
  if (
    isSalaryDailyPayrollRecord(record.record_type) ||
    isLeaveHourlyPayrollRecord(record.record_type)
  ) {
    const d = record.earnings_date ?? record.payroll_date;
    return d ? String(d).slice(0, 10) : "—";
  }
  return record.payroll_date ? String(record.payroll_date).slice(0, 10) : "—";
}

export function displayRateHeader(recordType?: string | null): string {
  return isSalaryDailyPayrollRecord(recordType) ? translate("payroll.dailyRate") : translate("payroll.hourlyRate");
}

/** Earnings daily_history row label. */
export function earningsHistoryTypeLabel(
  recordType?: string | null,
  opts?: {
    earning_source?: string | null;
    payroll_day_classification?: string | null;
  }
): string {
  if (
    isPaidLeaveHistoryRow({
      record_type: recordType,
      earning_source: opts?.earning_source,
      payroll_day_classification: opts?.payroll_day_classification,
    })
  ) {
    return translate("payroll.paidLeave");
  }
  return payrollRecordTypeLabel(recordType);
}
