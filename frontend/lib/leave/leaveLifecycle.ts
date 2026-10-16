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

export function leaveDaysRemaining(endDate: string, asOfDate?: string): number {
  const today = asOfDate ?? todayYmd();
  if (today > endDate) return 0;
  const from = new Date(`${today}T00:00:00Z`);
  const to = new Date(`${endDate}T00:00:00Z`);
  const diff = Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff + 1 : 0;
}

/** Approved leave that has not yet ended (terminatable). */
export function isApprovedLeaveActive(
  leave: { status: string; end_date: string },
  asOfDate?: string
): boolean {
  const status = (leave.status ?? "").trim().toLowerCase();
  if (status !== "approved") return false;
  const today = asOfDate ?? todayYmd();
  return leave.end_date >= today;
}

export function defaultTerminateReturnDate(
  leave: { start_date: string; end_date: string },
  asOfDate?: string
): string {
  const today = asOfDate ?? todayYmd();
  if (today < leave.start_date) return leave.start_date;
  if (today > leave.end_date) return maxTerminateReturnDateYmd(leave.end_date);
  return today;
}

/** First day back at work may be the day after approved leave ends. */
export function maxTerminateReturnDateYmd(endDateYmd: string): string {
  const [y, m, d] = endDateYmd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  return dt.toISOString().slice(0, 10);
}

export function computeLeaveUsedDaysFirstDayBack(
  startDateYmd: string,
  actualReturnDateYmd: string
): number {
  const [sy, sm, sd] = startDateYmd.split("-").map(Number);
  const [ry, rm, rd] = actualReturnDateYmd.split("-").map(Number);
  const diff = Math.floor(
    (Date.UTC(ry, rm - 1, rd) - Date.UTC(sy, sm - 1, sd)) / 86_400_000
  );
  return Math.max(0, diff);
}

export function estimateRestoredDaysPreview(
  leave: { start_date: string; end_date: string; total_days?: number | null },
  actualReturnDate: string
): number | null {
  if (!actualReturnDate.trim()) return null;
  const maxReturn = maxTerminateReturnDateYmd(leave.end_date);
  if (actualReturnDate < leave.start_date || actualReturnDate > maxReturn) return null;
  const used = computeLeaveUsedDaysFirstDayBack(leave.start_date, actualReturnDate);
  return Math.max(0, (leave.total_days ?? 0) - used);
}
