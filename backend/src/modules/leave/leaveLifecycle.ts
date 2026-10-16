/** YYYY-MM-DD for date-only comparisons (UTC). */
export function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Approved leave where asOfDate falls within [start_date, end_date] (inclusive).
 * Used for attendance blocking and "currently on leave" visibility.
 */
export function isCurrentlyOnApprovedLeave(
  leave: { status: string; start_date: string; end_date: string },
  asOfDate?: string
): boolean {
  const status = (leave.status ?? "").trim().toLowerCase();
  if (status !== "approved") return false;
  const today = asOfDate ?? todayYmd();
  return leave.start_date <= today && leave.end_date >= today;
}

/** Inclusive calendar days from fromYmd through toYmd (YYYY-MM-DD). */
export function inclusiveDaysBetween(fromYmd: string, toYmd: string): number {
  const from = new Date(`${fromYmd}T00:00:00Z`);
  const to = new Date(`${toYmd}T00:00:00Z`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
  const diff = Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff + 1 : 0;
}

/** Days remaining in leave including today (through end_date). */
export function leaveDaysRemaining(endDate: string, asOfDate?: string): number {
  const today = asOfDate ?? todayYmd();
  if (today > endDate) return 0;
  return inclusiveDaysBetween(today, endDate);
}

/** Approved leave that has not yet ended (terminatable / active). */
export function isApprovedLeaveActive(
  leave: { status: string; end_date: string },
  asOfDate?: string
): boolean {
  const status = (leave.status ?? "").trim().toLowerCase();
  if (status !== "approved") return false;
  const today = asOfDate ?? todayYmd();
  return leave.end_date >= today;
}
