import * as payrollRepo from "./payroll.repository";
import * as wageRepo from "../wageRates/wageRates.repository";
import * as payrollWageRepo from "./wageRates.repository";
import * as companyPolicy from "../companyPolicy/companyPolicy.service";
import { getPayrollDayClassificationsForRange } from "./payrollLeaveAwareness.service";
import { isPayrollRecordProtected } from "./payrollRecordProtection";
import { resolveExpectedLeaveHoursForUser, resolveScheduledShiftForUser } from "./leaveExpectedHours.service";
import { computeHourlyPaidLeaveGross } from "./salaryLeavePayroll.engine";
import {
  canEmitPaidLeaveWorkforceEarning,
  resolveCompanyTodayIso,
} from "./paidLeavePayrollEligibility";
import { getPayrollPeriodEditability } from "../payrollPeriod/payrollPeriodEditable";
import { resolveEditablePayrollPeriodId } from "./payrollPeriodOwnership";
import {
  hasScheduledShiftClosed,
  toShiftWindowSource,
} from "../../lib/shiftWindow";
import { normalizeBusinessTimeZone } from "../../lib/businessCalendar";

/** Sync paid-leave hourly credits for a calendar month (no attendance session required). */
export async function syncHourlyLeavePayrollForMonth(
  userId: string,
  companyId: string,
  year: number,
  month: number,
  todayIsoOverride?: string
): Promise<void> {
  const payrollOn = await companyPolicy.isPayrollEnabled(companyId);
  if (!payrollOn) return;

  const editability = await getPayrollPeriodEditability(companyId, year, month);
  if (!editability.editable) return;
  const payrollPeriodId =
    editability.periodId ??
    (await resolveEditablePayrollPeriodId(
      companyId,
      `${year}-${String(month).padStart(2, "0")}-01`
    ));

  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const asOf = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const wage = await wageRepo.getEffectiveWageRow(userId, companyId, asOf);
  if (!wage || wage.rate_type !== "hourly") {
    await payrollRepo.deleteDraftLeaveHourlyForUserMonth(userId, companyId, year, month).catch(() => undefined);
    return;
  }

  const policy = await companyPolicy.getPolicy(companyId);
  const todayIso = todayIsoOverride ?? resolveCompanyTodayIso(policy);
  const defaultDailyHours = Math.max(1, Math.min(24, policy.default_daily_hours ?? 8));
  const startYmd = `${year}-${String(month).padStart(2, "0")}-01`;
  const bizTz = normalizeBusinessTimeZone(
    (policy as { business_timezone?: string | null }).business_timezone
  );
  const overnightOn =
    (policy as { overnight_shifts_enabled?: boolean }).overnight_shifts_enabled === true;
  const shift = await resolveScheduledShiftForUser(userId, companyId);
  const shiftSource = shift ? toShiftWindowSource(shift) : null;

  const leaveByDay = await getPayrollDayClassificationsForRange(
    userId,
    companyId,
    startYmd,
    asOf
  );

  const existingMonth = await payrollRepo.getPayrollByUserMonth(userId, companyId, year, month);
  const protectedDates = new Set(
    existingMonth
      .filter(
        (r) =>
          (r.record_type ?? "session_hourly") === "leave_hourly" &&
          isPayrollRecordProtected(r.status)
      )
      .map((r) => (r.earnings_date ?? r.payroll_date).slice(0, 10))
  );

  await payrollRepo.deleteDraftLeaveHourlyForUserMonth(userId, companyId, year, month);

  const expectedHours = await resolveExpectedLeaveHoursForUser(
    userId,
    companyId,
    defaultDailyHours
  );

  for (let d = 1; d <= lastDay; d++) {
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (protectedDates.has(iso)) continue;

    const ctx = leaveByDay.get(iso);
    if (ctx?.classification !== "PAID_LEAVE" || !ctx.leaveCoverage) continue;

    const shiftHasClosed = hasScheduledShiftClosed({
      ownershipYmd: iso,
      businessTimeZone: bizTz,
      overnightShiftsEnabled: overnightOn,
      shift: shiftSource,
    });
    if (
      !canEmitPaidLeaveWorkforceEarning({
        earningsDateYmd: iso,
        companyTodayYmd: todayIso,
        shiftHasClosed,
      })
    ) {
      continue;
    }

    const hourlyRate = await payrollWageRepo.getHourlyRate(userId, companyId, iso);
    if (hourlyRate === null || hourlyRate < 0) continue;

    const gross = computeHourlyPaidLeaveGross(expectedHours, hourlyRate);
    if (gross <= 0) continue;

    const regularMinutes = Math.round(expectedHours * 60);

    await payrollRepo.insertLeaveHourlyRecord({
      user_id: userId,
      company_id: companyId,
      earnings_date: iso,
      leave_request_id: ctx.leaveCoverage.leaveRequestId,
      regular_minutes: regularMinutes,
      hours_worked: expectedHours,
      hourly_rate: hourlyRate,
      gross_earnings: gross,
      payroll_period_id: payrollPeriodId,
    });
  }
}
