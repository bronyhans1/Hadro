import type { PayrollDayClassification } from "./payrollLeaveAwareness.service";
import { classifyAttendanceDayByWorkedMinutes } from "./salaryEarnings.engine";

export type SalaryDailyEarningSource = "attendance" | "paid_leave";

export type MonthlyWorkingDayPayrollResult = {
  dayUnits: number;
  gross: number;
  earningSource: SalaryDailyEarningSource;
};

/**
 * Monthly working-day credit with leave-aware eligibility (Phase B).
 * UNPAID_LEAVE → non-payable; PAID_LEAVE → full payable day; WORKING → attendance rules.
 */
export function resolveMonthlyWorkingDayPayroll(params: {
  leaveClassification: PayrollDayClassification | undefined;
  workedMinutes: number;
  overrideUnits?: number;
  classificationEnabled: boolean;
  thresholds: { min: number; full: number };
  dailyRate: number;
}): MonthlyWorkingDayPayrollResult {
  const leaveClass = params.leaveClassification ?? "WORKING";

  if (leaveClass === "UNPAID_LEAVE") {
    return { dayUnits: 0, gross: 0, earningSource: "attendance" };
  }

  if (leaveClass === "PAID_LEAVE") {
    const gross = Math.round(params.dailyRate * 100) / 100;
    return { dayUnits: 1, gross, earningSource: "paid_leave" };
  }

  const dayUnits =
    params.overrideUnits !== undefined
      ? params.overrideUnits
      : params.classificationEnabled
        ? classifyAttendanceDayByWorkedMinutes(params.workedMinutes, params.thresholds).day_units
        : params.workedMinutes > 0
          ? 1
          : 0;

  const gross =
    dayUnits > 0 ? Math.round(params.dailyRate * dayUnits * 100) / 100 : 0;

  return { dayUnits, gross, earningSource: "attendance" };
}

export function computeHourlyPaidLeaveGross(hours: number, hourlyRate: number): number {
  const h = Math.max(0, hours);
  const rate = Math.max(0, hourlyRate);
  return Math.round(h * rate * 100) / 100;
}
