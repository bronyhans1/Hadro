import * as payrollRepo from "./payroll.repository";
import * as wageRatesRepo from "./wageRates.repository";
import * as sessionsRepo from "../sessions/sessions.repository";
import type { WorkSessionRecord } from "../sessions/sessions.repository";
import * as companyPolicyService from "../companyPolicy/companyPolicy.service";
import * as shiftsRepo from "../shifts/shifts.repository";
import { scheduledShiftMinutesFromTimes } from "../../lib/shiftTimeModel";
import { latePayDeductionFromLateMinutes } from "./salaryEarnings.engine";
import { WorkSessionStatus } from "../../constants/workSessionStatus";
import { isCompletedPayrollEligibleSession } from "../../lib/remoteAttendancePayroll";
import { isPayrollRecordProtected } from "./payrollRecordProtection";
import { getPayrollPeriodEditabilityForDate } from "../payrollPeriod/payrollPeriodEditable";
import { resolveEditablePayrollPeriodId } from "./payrollPeriodOwnership";
import {
  allocateDailySessionOvertime,
  computeHourlySessionGrossBeforeLate,
  payrollCalendarDayFromCheckIn,
  resolveSessionDurationMinutes,
} from "../../lib/overtime/hourlySessionPayroll.engine";
import {
  buildOvertimeCompensationSnapshot,
  overtimeCompensationFromPolicy,
} from "../../lib/overtime/overtimeCompensation";
import type { SessionDurationInput } from "../../lib/overtime/dailyDurationOvertime";

export type SessionPayrollResult =
  | { status: "ok" }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string };

function calendarDayUtcBounds(calendarDay: string): {
  dayStart: string;
  dayEnd: string;
} {
  const dayStart = `${calendarDay}T00:00:00.000Z`;
  const [yy, mm, dd] = calendarDay.split("-").map(Number);
  const dayEnd = new Date(Date.UTC(yy, mm - 1, dd + 1)).toISOString();
  return { dayStart, dayEnd };
}

function firstLateCompletedSessionId(rows: WorkSessionRecord[]): string | null {
  const eligible = rows.filter(
    (s) =>
      s.status === WorkSessionStatus.COMPLETED &&
      s.check_in &&
      s.check_out &&
      typeof s.late_minutes === "number" &&
      s.late_minutes > 0
  );
  if (eligible.length === 0) return null;
  eligible.sort(
    (a, b) => new Date(a.check_in!).getTime() - new Date(b.check_in!).getTime()
  );
  return eligible[0]!.id;
}

async function buildScheduledShiftMinutesByShiftId(
  companyId: string,
  sessions: WorkSessionRecord[]
): Promise<Map<string, number>> {
  const shiftIds = [
    ...new Set(
      sessions
        .map((s) => s.shift_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    ),
  ];
  const map = new Map<string, number>();
  await Promise.all(
    shiftIds.map(async (shiftId) => {
      const shift = await shiftsRepo.getShiftById(shiftId, companyId);
      if (!shift) return;
      const mins = scheduledShiftMinutesFromTimes(shift.start_time, shift.end_time);
      if (mins != null) map.set(shiftId, mins);
    })
  );
  return map;
}

function toDurationInput(
  session: WorkSessionRecord,
  calendarDay: string,
  scheduledShiftMinutesByShiftId: ReadonlyMap<string, number>
): SessionDurationInput {
  const scheduledShiftMinutes =
    session.shift_id != null
      ? scheduledShiftMinutesByShiftId.get(session.shift_id) ?? null
      : null;
  return {
    sessionId: session.id,
    durationMinutes: resolveSessionDurationMinutes(session),
    dayKey: calendarDay,
    orderMs: session.check_in ? new Date(session.check_in).getTime() : undefined,
    scheduledShiftMinutes,
  };
}

/**
 * Rebuild draft hourly payroll rows for all payroll-eligible sessions on one calendar day.
 * Approved/locked rows are never overwritten (repository protection).
 */
export async function syncDraftHourlyPayrollForAttendanceDay(
  userId: string,
  companyId: string,
  calendarDay: string,
  sessionsById: Map<string, WorkSessionRecord>,
  sameDaySessions: WorkSessionRecord[]
): Promise<{ wrote: number; protectedSkipped: number; rateSkipped: number }> {
  const editability = await getPayrollPeriodEditabilityForDate(companyId, calendarDay);
  if (!editability.editable) {
    return { wrote: 0, protectedSkipped: 0, rateSkipped: 0 };
  }
  const payrollPeriodId =
    editability.periodId ??
    (await resolveEditablePayrollPeriodId(companyId, calendarDay));

  const policy = await companyPolicyService.getPolicy(companyId);
  const mode = policy.overtime_policy_mode ?? "duration";

  const eligible = sameDaySessions.filter(isCompletedPayrollEligibleSession);
  const scheduledShiftMinutesByShiftId = await buildScheduledShiftMinutesByShiftId(
    companyId,
    eligible
  );
  const durationInputs = eligible.map((s) =>
    toDurationInput(s, calendarDay, scheduledShiftMinutesByShiftId)
  );
  const allocations = allocateDailySessionOvertime(
    durationInputs,
    mode,
    policy.default_daily_hours
  );

  const latePayActiveOnDay = companyPolicyService.isLatePayDeductionActiveOnAttendanceDate(
    policy,
    calendarDay
  );
  const lateOwnerId = latePayActiveOnDay
    ? firstLateCompletedSessionId(sameDaySessions)
    : null;

  let wrote = 0;
  let protectedSkipped = 0;
  let rateSkipped = 0;

  for (const alloc of allocations) {
    const session = sessionsById.get(alloc.sessionId);
    if (!session?.check_in) continue;

    const existing = await payrollRepo.getPayrollBySessionId(
      alloc.sessionId,
      companyId
    );
    if (existing && isPayrollRecordProtected(existing.status)) {
      protectedSkipped += 1;
      continue;
    }

    const payrollDate = payrollCalendarDayFromCheckIn(session.check_in);
    const hourlyRate = await wageRatesRepo.getHourlyRate(
      userId,
      companyId,
      payrollDate
    );
    if (hourlyRate === null || hourlyRate < 0) {
      rateSkipped += 1;
      continue;
    }

    const compensation = overtimeCompensationFromPolicy(policy);
    const otSnapshot = buildOvertimeCompensationSnapshot(compensation);

    const hoursWorked = Math.round((alloc.durationMinutes / 60) * 100) / 100;
    let grossEarnings = computeHourlySessionGrossBeforeLate({
      regularMinutes: alloc.regularMinutes,
      overtimeMinutes: alloc.overtimeMinutes,
      hourlyRate,
      compensation,
    });
    let grossBeforeLate: number | null = null;
    let lateDedAmount: number | null = null;

    if (latePayActiveOnDay) {
      const lateM =
        typeof session.late_minutes === "number" && session.late_minutes > 0
          ? session.late_minutes
          : 0;
      if (lateM > 0 && hourlyRate > 0 && lateOwnerId === alloc.sessionId) {
        grossBeforeLate = grossEarnings;
        const ded = latePayDeductionFromLateMinutes(lateM, hourlyRate);
        lateDedAmount = ded;
        grossEarnings = Math.max(
          0,
          Math.round((grossEarnings - ded) * 100) / 100
        );
      }
    }

    await payrollRepo.createPayrollRecord({
      user_id: userId,
      company_id: companyId,
      session_id: alloc.sessionId,
      regular_minutes: alloc.regularMinutes,
      overtime_minutes: alloc.overtimeMinutes,
      hours_worked: hoursWorked,
      hourly_rate: hourlyRate,
      gross_earnings: grossEarnings,
      payroll_date: payrollDate,
      gross_before_late_deduction: grossBeforeLate,
      late_deduction_amount: lateDedAmount,
      overtime_multiplier_applied: otSnapshot.overtime_multiplier_applied,
      overtime_compensation_method_applied:
        otSnapshot.overtime_compensation_method_applied,
      fixed_overtime_rate_applied: otSnapshot.fixed_overtime_rate_applied,
      payroll_period_id: payrollPeriodId,
    });
    wrote += 1;
  }

  return { wrote, protectedSkipped, rateSkipped };
}

/**
 * Process payroll for a completed session: daily OT aggregation for duration mode,
 * then upsert draft rows for all payroll-eligible sessions on the same calendar day.
 */
export async function processSessionPayroll(
  sessionId: string
): Promise<SessionPayrollResult> {
  try {
    const session = await sessionsRepo.getSessionById(sessionId);
    if (
      !session ||
      session.status !== WorkSessionStatus.COMPLETED ||
      !session.check_in ||
      !session.check_out
    ) {
      return { status: "skipped", reason: "session_not_eligible" };
    }

    const companyId = session.company_id;
    const userId = session.user_id;

    const payrollOn = await companyPolicyService.isPayrollEnabled(companyId);
    if (!payrollOn) return { status: "skipped", reason: "payroll_disabled" };

    if (!isCompletedPayrollEligibleSession(session)) {
      return { status: "skipped", reason: "session_not_payroll_eligible" };
    }

    const calendarDay = payrollCalendarDayFromCheckIn(session.check_in);
    const { dayStart, dayEnd } = calendarDayUtcBounds(calendarDay);

    const { rows: sameCalendarDay } = await sessionsRepo.listSessionsForUser(
      userId,
      companyId,
      { startIso: dayStart, endIso: dayEnd, limit: 200, offset: 0 }
    );

    const sameDayOnCalendar = sameCalendarDay.filter(
      (s) => s.check_in && payrollCalendarDayFromCheckIn(s.check_in) === calendarDay
    );
    const sessionsById = new Map(sameDayOnCalendar.map((s) => [s.id, s]));

    const hourlyRate = await wageRatesRepo.getHourlyRate(
      userId,
      companyId,
      calendarDay
    );
    if (hourlyRate === null || hourlyRate < 0) {
      return { status: "skipped", reason: "no_hourly_rate" };
    }

    await syncDraftHourlyPayrollForAttendanceDay(
      userId,
      companyId,
      calendarDay,
      sessionsById,
      sameDayOnCalendar
    );

    return { status: "ok" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("processSessionPayroll error", err);
    return { status: "failed", error: msg };
  }
}
