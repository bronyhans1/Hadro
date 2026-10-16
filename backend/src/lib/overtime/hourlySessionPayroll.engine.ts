import {
  OVERTIME_POLICY_MODE_DURATION,
  OVERTIME_POLICY_MODE_NONE,
  type OvertimePolicyMode,
} from "../../constants/overtimePolicyMode";
import {
  aggregateShiftAwareDailyOvertime,
  type SessionDurationInput,
} from "./dailyDurationOvertime";
import {
  computeOvertimePayFromCompensation,
  type OvertimeCompensationParams,
} from "./overtimeCompensation";

export type SessionOtAllocation = {
  sessionId: string;
  durationMinutes: number;
  regularMinutes: number;
  overtimeMinutes: number;
};

export function resolveSessionDurationMinutes(session: {
  duration_minutes?: number | null;
  check_in?: string | null;
  check_out?: string | null;
}): number {
  if (
    typeof session.duration_minutes === "number" &&
    session.duration_minutes >= 0
  ) {
    return session.duration_minutes;
  }
  if (!session.check_in || !session.check_out) return 0;
  return Math.floor(
    (new Date(session.check_out).getTime() - new Date(session.check_in).getTime()) /
      60000
  );
}

export function payrollCalendarDayFromCheckIn(checkInIso: string): string {
  return checkInIso.slice(0, 10);
}

/**
 * Single source of truth for hourly session regular/OT minute split.
 * Shift-assigned sessions cap regular time at scheduled shift duration; company
 * default_daily_hours caps total regular minutes per calendar day (FIFO).
 */
export function allocateDailySessionOvertime(
  sessions: SessionDurationInput[],
  mode: OvertimePolicyMode,
  defaultDailyHours: number
): SessionOtAllocation[] {
  const eligible = sessions.filter((s) => s.durationMinutes >= 0);
  if (eligible.length === 0) return [];

  if (mode === OVERTIME_POLICY_MODE_NONE) {
    return eligible.map((s) => ({
      sessionId: s.sessionId,
      durationMinutes: s.durationMinutes,
      regularMinutes: s.durationMinutes,
      overtimeMinutes: 0,
    }));
  }

  const payrollMode =
    mode === OVERTIME_POLICY_MODE_DURATION ? mode : OVERTIME_POLICY_MODE_DURATION;

  if (payrollMode === OVERTIME_POLICY_MODE_DURATION) {
    const byDay = aggregateShiftAwareDailyOvertime(eligible, defaultDailyHours);
    const dayKeys = [...new Set(eligible.map((s) => s.dayKey))];
    const out: SessionOtAllocation[] = [];
    for (const dayKey of dayKeys) {
      const day = byDay.find((d) => d.dayKey === dayKey);
      if (!day) continue;
      for (const row of day.bySession) {
        out.push({
          sessionId: row.sessionId,
          durationMinutes: row.durationMinutes,
          regularMinutes: row.allocatedRegularMinutes,
          overtimeMinutes: row.allocatedOvertimeMinutes,
        });
      }
    }
    return out;
  }

  return [];
}

export function computeHourlySessionGross(params: {
  regularMinutes: number;
  overtimeMinutes: number;
  hourlyRate: number;
  compensation: OvertimeCompensationParams;
}): number {
  const regularPay = (params.regularMinutes / 60) * params.hourlyRate;
  const overtimePay = computeOvertimePayFromCompensation(
    params.overtimeMinutes,
    params.hourlyRate,
    params.compensation
  );
  return Math.round((regularPay + overtimePay) * 100) / 100;
}

export function computeHourlySessionGrossBeforeLate(params: {
  regularMinutes: number;
  overtimeMinutes: number;
  hourlyRate: number;
  compensation: OvertimeCompensationParams;
}): number {
  return computeHourlySessionGross(params);
}
