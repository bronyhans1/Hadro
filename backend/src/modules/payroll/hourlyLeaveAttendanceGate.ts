import * as payrollRepo from "./payroll.repository";

/**
 * Shared pre-credit gate for hourly paid-leave inserts.
 *
 * - If an approved/locked session_hourly exists for the attendance day → skip leave credit.
 * - Otherwise clear draft session_hourly for that day, then allow leave credit.
 *
 * Never mutates approved/locked attendance rows.
 */
export type HourlyLeaveAttendanceGateResult =
  | { ok: true }
  | { ok: false; reason: "protected_attendance_row" };

export async function prepareHourlyLeaveCreditAgainstAttendance(params: {
  userId: string;
  companyId: string;
  /** Company-local attendance / ownership day (YYYY-MM-DD). */
  attendanceDayYmd: string;
}): Promise<HourlyLeaveAttendanceGateResult> {
  const day = params.attendanceDayYmd.slice(0, 10);
  const protectedAttendance =
    await payrollRepo.findProtectedSessionHourlyForAttendanceDay(
      params.userId,
      params.companyId,
      day
    );
  if (protectedAttendance) {
    return { ok: false, reason: "protected_attendance_row" };
  }

  await payrollRepo.deleteDraftSessionHourlyForUserAttendanceDay(
    params.userId,
    params.companyId,
    day
  );
  return { ok: true };
}
