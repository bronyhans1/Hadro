/**
 * Termination governance: `actual_return_date` is the **first day back at work**
 * (exclusive end for leave coverage and payroll).
 *
 * Valid return dates: [start_date, end_date + 1 calendar day].
 * Used days = count of leave days before return = (actual_return_date - start_date) in whole days.
 *
 * Default when terminating mid-leave: next calendar day (asOf + 1), so the
 * termination calendar day remains inside leave coverage and the first day
 * back is excluded. Explicit return dates may still choose asOf (today) when
 * the employee is expected back the same day.
 */

export function addCalendarDaysYmd(ymd: string, deltaDays: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return dt.toISOString().slice(0, 10);
}

export function maxTerminateReturnDateYmd(endDateYmd: string): string {
  return addCalendarDaysYmd(endDateYmd, 1);
}

/**
 * Default first-day-back for the terminate UI / clients.
 * Mid-leave: tomorrow (capped at day after approved end) so asOf stays eligible.
 */
export function defaultTerminateReturnDate(
  leave: { start_date: string; end_date: string },
  asOfDate: string
): string {
  const asOf = asOfDate.slice(0, 10);
  const maxReturn = maxTerminateReturnDateYmd(leave.end_date);
  if (asOf < leave.start_date) return leave.start_date;
  if (asOf > leave.end_date) return maxReturn;
  const nextDay = addCalendarDaysYmd(asOf, 1);
  return nextDay > maxReturn ? maxReturn : nextDay;
}

export function isValidTerminateReturnDate(
  startDateYmd: string,
  endDateYmd: string,
  actualReturnDateYmd: string
): boolean {
  if (!startDateYmd || !endDateYmd || !actualReturnDateYmd) return false;
  const maxReturn = maxTerminateReturnDateYmd(endDateYmd);
  return actualReturnDateYmd >= startDateYmd && actualReturnDateYmd <= maxReturn;
}

/** Whole leave days consumed before the employee returns to work. */
export function computeLeaveUsedDaysFirstDayBack(
  startDateYmd: string,
  actualReturnDateYmd: string
): number {
  const [sy, sm, sd] = startDateYmd.split("-").map(Number);
  const [ry, rm, rd] = actualReturnDateYmd.split("-").map(Number);
  const start = Date.UTC(sy, sm - 1, sd);
  const ret = Date.UTC(ry, rm - 1, rd);
  const diff = Math.floor((ret - start) / 86_400_000);
  return Math.max(0, diff);
}

export function computeRestoredDaysFromTermination(params: {
  startDateYmd: string;
  endDateYmd: string;
  totalDays: number;
  actualReturnDateYmd: string;
}): { usedDays: number; restoredDays: number } | null {
  if (
    !isValidTerminateReturnDate(
      params.startDateYmd,
      params.endDateYmd,
      params.actualReturnDateYmd
    )
  ) {
    return null;
  }
  const usedRaw = computeLeaveUsedDaysFirstDayBack(
    params.startDateYmd,
    params.actualReturnDateYmd
  );
  const usedDays = Math.min(Math.max(0, params.totalDays), usedRaw);
  const restoredDays = Math.max(0, params.totalDays - usedDays);
  return { usedDays, restoredDays };
}
