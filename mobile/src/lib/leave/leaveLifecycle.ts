import { translate } from "@/lib/i18n";

export function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Approved leave where today falls within [start_date, end_date] (inclusive). */
export function isCurrentlyOnApprovedLeave(
  leave: { status: string; start_date: string; end_date: string },
  asOfDate?: string
): boolean {
  const status = (leave.status ?? "").trim().toLowerCase();
  if (status !== "approved") return false;
  const today = asOfDate ?? todayYmd();
  return leave.start_date <= today && leave.end_date >= today;
}

export const ATTENDANCE_BLOCKED_ON_LEAVE_MESSAGE =
  "You are currently on approved leave until";

export function attendanceBlockedOnLeaveMessage(endDate: string): string {
  return translate("attendance.blockedOnLeave", { values: { date: endDate } });
}
