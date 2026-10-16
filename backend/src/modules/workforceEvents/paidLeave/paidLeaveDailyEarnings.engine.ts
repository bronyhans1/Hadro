import * as payrollRepo from "../../payroll/payroll.repository";
import * as wageRepo from "../../wageRates/wageRates.repository";
import * as payrollWageRepo from "../../payroll/wageRates.repository";
import * as companyPolicy from "../../companyPolicy/companyPolicy.service";
import * as holidaysRepo from "../../holidays/holidays.repository";
import {
  classifyDay,
  computeDailyRate,
  countPayableDivisorDays,
  holidayMap,
  normalizeWorkingWeekdays,
  type SalaryDivisorType,
} from "../../payroll/salaryEarnings.engine";
import { getPayrollDayClassification } from "../../payroll/payrollLeaveAwareness.service";
import { computeHourlyPaidLeaveGross } from "../../payroll/salaryLeavePayroll.engine";
import {
  resolveExpectedLeaveHoursForUser,
  resolveScheduledShiftForUser,
} from "../../payroll/leaveExpectedHours.service";
import {
  canEmitPaidLeaveWorkforceEarning,
  resolveCompanyTodayIso,
} from "../../payroll/paidLeavePayrollEligibility";
import { getPayrollPeriodEditability } from "../../payrollPeriod/payrollPeriodEditable";
import { resolveEditablePayrollPeriodId } from "../../payroll/payrollPeriodOwnership";
import {
  hasScheduledShiftClosed,
  toShiftWindowSource,
} from "../../../lib/shiftWindow";
import { normalizeBusinessTimeZone } from "../../../lib/businessCalendar";
import type { WorkforceEventContext, WorkforceEventCreditResult } from "../types";

/**
 * Credit one ownership day of approved paid leave into payroll_records.
 * No work_session required. Idempotent against existing draft/protected rows.
 */
export async function creditPaidLeaveWorkforceEvent(
  ctx: WorkforceEventContext
): Promise<WorkforceEventCreditResult> {
  try {
    const { companyId, userId } = ctx;
    const ownershipYmd = ctx.ownershipYmd.slice(0, 10);
    const now = ctx.now ?? new Date();

    const payrollOn = await companyPolicy.isPayrollEnabled(companyId);
    if (!payrollOn) {
      return { status: "skipped", reason: "payroll_disabled" };
    }

    const policy = await companyPolicy.getPolicy(companyId);
    const todayIso = resolveCompanyTodayIso(policy, now);
    const bizTz = normalizeBusinessTimeZone(
      (policy as { business_timezone?: string | null }).business_timezone
    );
    const overnightOn =
      (policy as { overnight_shifts_enabled?: boolean }).overnight_shifts_enabled === true;

    const shift = await resolveScheduledShiftForUser(userId, companyId);
    const shiftHasClosed = hasScheduledShiftClosed(
      {
        ownershipYmd,
        businessTimeZone: bizTz,
        overnightShiftsEnabled: overnightOn,
        shift: shift ? toShiftWindowSource(shift) : null,
      },
      now
    );

    if (
      !canEmitPaidLeaveWorkforceEarning({
        earningsDateYmd: ownershipYmd,
        companyTodayYmd: todayIso,
        shiftHasClosed,
      })
    ) {
      return {
        status: "skipped",
        reason: shiftHasClosed ? "not_elapsed" : "shift_not_closed",
      };
    }

    const dayCtx = await getPayrollDayClassification(userId, companyId, ownershipYmd);
    if (dayCtx.classification !== "PAID_LEAVE" || !dayCtx.leaveCoverage) {
      return { status: "skipped", reason: "not_paid_leave_day" };
    }

    const workingWeekdays = normalizeWorkingWeekdays(
      (policy as { working_weekdays?: unknown }).working_weekdays
    );
    const holRows = await holidaysRepo.listHolidaysForCompanyRange(
      companyId,
      ownershipYmd,
      ownershipYmd
    );
    const hmap = holidayMap(
      holRows.map((h) => ({ date: h.holiday_date.slice(0, 10), is_paid: h.is_paid }))
    );
    const dayKind = classifyDay(ownershipYmd, workingWeekdays, hmap);
    if (dayKind.kind !== "working_day") {
      return { status: "skipped", reason: `non_working_day:${dayKind.kind}` };
    }

    const year = Number(ownershipYmd.slice(0, 4));
    const month = Number(ownershipYmd.slice(5, 7));
    const editability = await getPayrollPeriodEditability(companyId, year, month);
    if (!editability.editable) {
      return { status: "skipped", reason: "period_locked" };
    }

    const payrollPeriodId =
      editability.periodId ??
      (await resolveEditablePayrollPeriodId(companyId, ownershipYmd));

    const leaveRequestId =
      ctx.sourceId ?? dayCtx.leaveCoverage.leaveRequestId;

    const wage = await wageRepo.getEffectiveWageRow(userId, companyId, ownershipYmd);
    if (!wage) {
      return { status: "skipped", reason: "no_wage" };
    }

    if (wage.rate_type === "hourly") {
      const existing = await payrollRepo.getLeaveHourlyRecord(
        userId,
        companyId,
        ownershipYmd
      );
      if (existing) {
        return {
          status: "skipped",
          reason: "already_credited",
        };
      }

      const hourlyRate = await payrollWageRepo.getHourlyRate(
        userId,
        companyId,
        ownershipYmd
      );
      if (hourlyRate === null || hourlyRate < 0) {
        return { status: "skipped", reason: "no_hourly_rate" };
      }

      const defaultDailyHours = Math.max(
        1,
        Math.min(24, (policy as { default_daily_hours?: number }).default_daily_hours ?? 8)
      );
      const expectedHours = await resolveExpectedLeaveHoursForUser(
        userId,
        companyId,
        defaultDailyHours
      );
      const gross = computeHourlyPaidLeaveGross(expectedHours, hourlyRate);
      if (gross <= 0) {
        return { status: "skipped", reason: "zero_gross" };
      }

      const row = await payrollRepo.insertLeaveHourlyRecord({
        user_id: userId,
        company_id: companyId,
        earnings_date: ownershipYmd,
        leave_request_id: leaveRequestId,
        regular_minutes: Math.round(expectedHours * 60),
        hours_worked: expectedHours,
        hourly_rate: hourlyRate,
        gross_earnings: gross,
        payroll_period_id: payrollPeriodId,
      });

      return {
        status: "credited",
        recordId: row.id,
        recordType: "leave_hourly",
        gross,
      };
    }

    if (wage.rate_type === "monthly" && wage.monthly_salary && wage.monthly_salary > 0) {
      const existing = await payrollRepo.getSalaryDailyRecord(
        userId,
        companyId,
        ownershipYmd
      );
      if (existing && (existing.earning_source ?? "attendance") === "paid_leave") {
        return { status: "skipped", reason: "already_credited" };
      }
      if (existing && existing.status && ["approved", "locked"].includes(existing.status)) {
        return { status: "skipped", reason: "protected_salary_row" };
      }

      const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
      const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
      const monthHolidays = await holidaysRepo.listHolidaysForCompanyRange(
        companyId,
        monthStart,
        monthEnd
      );
      const monthHmap = holidayMap(
        monthHolidays.map((h) => ({
          date: h.holiday_date.slice(0, 10),
          is_paid: h.is_paid,
        }))
      );
      const divisorDays = countPayableDivisorDays(year, month, workingWeekdays, monthHmap);
      const dailyRate = computeDailyRate(
        wage.monthly_salary,
        (wage.salary_divisor_type as SalaryDivisorType) ?? "dynamic_working_days",
        wage.salary_divisor_value,
        divisorDays.length
      );
      const gross = Math.round(dailyRate * 100) / 100;
      if (gross <= 0) {
        return { status: "skipped", reason: "zero_gross" };
      }

      const row = await payrollRepo.insertSalaryDailyRecord({
        user_id: userId,
        company_id: companyId,
        earnings_date: ownershipYmd,
        gross_earnings: gross,
        daily_rate: dailyRate,
        earning_source: "paid_leave",
        leave_request_id: leaveRequestId,
        payroll_period_id: payrollPeriodId,
      });

      return {
        status: "credited",
        recordId: row.id,
        recordType: "salary_daily",
        gross,
      };
    }

    return { status: "skipped", reason: "unsupported_wage" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[workforce-events] paid_leave credit failed", ctx, message);
    return { status: "failed", error: message };
  }
}
