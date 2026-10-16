import { expectedShiftDurationMinutes, parseTimeToMinutes } from "../../lib/shiftTimeModel";
import * as usersRepo from "../users/users.repository";
import * as shiftsRepo from "../shifts/shifts.repository";
import { shiftRowActive } from "../shifts/shifts.service";

/**
 * Expected paid-leave hours for an hourly employee on a calendar day.
 * Uses assigned shift length when available; otherwise company default daily hours.
 */
export async function resolveExpectedLeaveHoursForUser(
  userId: string,
  companyId: string,
  defaultDailyHours: number
): Promise<number> {
  const shift = await resolveScheduledShiftForUser(userId, companyId);
  if (shift) {
    const startM = parseTimeToMinutes(shift.start_time);
    const endM = parseTimeToMinutes(shift.end_time);
    if (startM !== null && endM !== null) {
      const mins = expectedShiftDurationMinutes(startM, endM);
      if (mins > 0) return Math.round((mins / 60) * 100) / 100;
    }
  }
  const h = Math.max(1, Math.min(24, defaultDailyHours));
  return h;
}

export async function resolveScheduledShiftForUser(
  userId: string,
  companyId: string
): Promise<shiftsRepo.ShiftRecord | null> {
  const user = await usersRepo.getUserById(userId);
  if (user?.shift_id) {
    const s = await shiftsRepo.getShiftById(user.shift_id, companyId);
    if (s && shiftRowActive(s)) return s;
  }
  const rows = await shiftsRepo.getShifts(companyId);
  const active = rows.filter(shiftRowActive);
  return active.length > 0 ? active[0]! : null;
}
