import { parseTimeToMinutes, expectedShiftDurationMinutes } from "../shiftTimeModel";
import { normalizeBusinessTimeZone } from "../businessCalendar";
import { utcInstantAtWallMinutesOnCalendarDate } from "./businessInstant";
import type { ShiftWindowSource } from "./types";

/** Default wall-clock end (17:00) when the employee has no assigned shift. */
export const DEFAULT_SHIFT_CLOSE_END_MINUTES = 17 * 60;

export type ScheduledShiftCloseResult = {
  expectedEndUtcIso: string;
  overnightLogicActive: boolean;
  startMinutes: number | null;
  endMinutes: number | null;
};

/**
 * Resolve the scheduled shift-close UTC instant for an ownership / attendance day
 * without requiring a work_session (used by workforce paid-event engines).
 *
 * Day shift 08:00–17:00 on Mon → close Mon 17:00 company-local.
 * Night shift 22:00–06:00 owned by Mon → close Tue 06:00 company-local.
 */
export function resolveScheduledShiftCloseForOwnershipDay(params: {
  ownershipYmd: string;
  businessTimeZone: string;
  overnightShiftsEnabled: boolean;
  shift: ShiftWindowSource | null;
  fallbackEndMinutes?: number;
}): ScheduledShiftCloseResult {
  const tz = normalizeBusinessTimeZone(params.businessTimeZone);
  const fallbackEnd = params.fallbackEndMinutes ?? DEFAULT_SHIFT_CLOSE_END_MINUTES;
  const ownershipYmd = params.ownershipYmd.slice(0, 10);

  if (!params.shift || !params.shift.is_active) {
    return {
      expectedEndUtcIso: utcInstantAtWallMinutesOnCalendarDate(ownershipYmd, fallbackEnd, tz),
      overnightLogicActive: false,
      startMinutes: null,
      endMinutes: fallbackEnd,
    };
  }

  const startM = parseTimeToMinutes(params.shift.start_time);
  const endM = parseTimeToMinutes(params.shift.end_time);
  if (startM === null || endM === null) {
    return {
      expectedEndUtcIso: utcInstantAtWallMinutesOnCalendarDate(ownershipYmd, fallbackEnd, tz),
      overnightLogicActive: false,
      startMinutes: null,
      endMinutes: fallbackEnd,
    };
  }

  const clockSpansMidnight = endM <= startM;
  const spansMidnight = Boolean(
    params.overnightShiftsEnabled && params.shift.spans_midnight && clockSpansMidnight
  );

  if (spansMidnight) {
    const shiftStartUtcIso = utcInstantAtWallMinutesOnCalendarDate(ownershipYmd, startM, tz);
    const duration = expectedShiftDurationMinutes(startM, endM);
    const expectedEndUtcIso = new Date(
      new Date(shiftStartUtcIso).getTime() + duration * 60_000
    ).toISOString();
    return {
      expectedEndUtcIso,
      overnightLogicActive: true,
      startMinutes: startM,
      endMinutes: endM,
    };
  }

  return {
    expectedEndUtcIso: utcInstantAtWallMinutesOnCalendarDate(ownershipYmd, endM, tz),
    overnightLogicActive: false,
    startMinutes: startM,
    endMinutes: endM,
  };
}

/** True when `now` is at or after the scheduled shift close for the ownership day. */
export function hasScheduledShiftClosed(
  params: Parameters<typeof resolveScheduledShiftCloseForOwnershipDay>[0],
  now: Date = new Date()
): boolean {
  const { expectedEndUtcIso } = resolveScheduledShiftCloseForOwnershipDay(params);
  return now.getTime() >= new Date(expectedEndUtcIso).getTime();
}
