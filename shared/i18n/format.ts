import { getActiveLocale, translate } from "./translate";
import type { Locale } from "./locales";

/**
 * Locale-aware formatting. Currency is always passed explicitly.
 * Language selection must not change an organization's currency code or amount.
 * When a caller omits locale, the active user preference is used. English stays English.
 */

function asDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatDate(
  value: Date | string | number,
  locale: Locale = getActiveLocale(),
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(locale, options ?? { dateStyle: "medium" }).format(asDate(value));
}

export function formatTime(
  value: Date | string | number,
  locale: Locale = getActiveLocale(),
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(locale, options ?? { timeStyle: "short" }).format(asDate(value));
}

export function formatNumber(
  value: number,
  locale: Locale = getActiveLocale(),
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/** Compact worked-time label. The minute count is unchanged; only the unit text follows the locale. */
export function formatCompactDuration(totalMinutes: number): string {
  const minutes = Math.max(0, Math.floor(totalMinutes));
  if (minutes < 60) {
    return translate("common.compactMinutes", { values: { count: minutes } });
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!rest) return translate("common.compactHours", { values: { count: hours } });
  return translate("common.compactHoursMinutes", { values: { hours, minutes: rest } });
}

export function formatCurrency(
  value: number,
  currency: string,
  locale: Locale = getActiveLocale(),
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency, ...options }).format(value);
}
