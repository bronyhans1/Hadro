import {
  normalizeBusinessTimeZone,
  yearMonthTodayInTimeZone,
} from "../../lib/businessCalendar";

/**
 * Calendar-only gate: paid leave payroll rows may not be created for future dates.
 * Prefer {@link canEmitPaidLeaveWorkforceEarning} when shift-close timing matters.
 */
export function canCreditPaidLeaveDay(
  earningsDateYmd: string,
  todayIso: string
): boolean {
  const ed = earningsDateYmd.slice(0, 10);
  const today = todayIso.slice(0, 10);
  return ed <= today;
}

/**
 * Workforce engine gate: past ownership days are eligible for catch-up;
 * the company-local current day requires the scheduled shift to have closed.
 */
export function canEmitPaidLeaveWorkforceEarning(params: {
  earningsDateYmd: string;
  companyTodayYmd: string;
  shiftHasClosed: boolean;
}): boolean {
  const ed = params.earningsDateYmd.slice(0, 10);
  const today = params.companyTodayYmd.slice(0, 10);
  if (ed > today) return false;
  if (ed < today) return true;
  return params.shiftHasClosed;
}

/** Company-local calendar today (YYYY-MM-DD) for payroll leave credit gates. */
export function resolveCompanyTodayIso(
  policy: { business_timezone?: string | null },
  now: Date = new Date()
): string {
  const tz = normalizeBusinessTimeZone(policy.business_timezone);
  return yearMonthTodayInTimeZone(now, tz).todayIso;
}
