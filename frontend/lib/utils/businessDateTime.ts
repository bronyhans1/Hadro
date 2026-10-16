/**
 * Display instants in the company's business timezone (IANA).
 * Backend stores UTC ISO strings; UI must not use the browser's local zone for business times.
 * Display wording and month names follow the active HADRO locale. Timezone validation
 * and calendar-day keys stay on fixed locales so they do not depend on language.
 */
import { getActiveLocale, translate } from "@/lib/i18n";

export const DEFAULT_BUSINESS_TIMEZONE = "Africa/Accra";

export function normalizeBusinessTimeZone(tz: string | null | undefined): string {
  const z = (tz ?? DEFAULT_BUSINESS_TIMEZONE).trim() || DEFAULT_BUSINESS_TIMEZONE;
  try {
    Intl.DateTimeFormat("en-US", { timeZone: z });
    return z;
  } catch {
    return DEFAULT_BUSINESS_TIMEZONE;
  }
}

function calendarDateKeyInZone(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: normalizeBusinessTimeZone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Calendar date in business zone (no time-of-day). */
export function formatBusinessDateOnly(
  iso: string | null | undefined,
  businessTimeZone?: string | null
): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const tz = normalizeBusinessTimeZone(businessTimeZone);
  try {
    return new Intl.DateTimeFormat(getActiveLocale(), {
      timeZone: tz,
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(d);
  } catch {
    return iso.slice(0, 10);
  }
}

/** Session / audit timestamp — matches mobile `formatSessionClock`. */
export function formatBusinessDateTime(
  iso: string | null | undefined,
  businessTimeZone?: string | null
): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const tz = normalizeBusinessTimeZone(businessTimeZone);
  try {
    return new Intl.DateTimeFormat(getActiveLocale(), {
      timeZone: tz,
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      hourCycle: "h23",
    }).format(d);
  } catch {
    return iso;
  }
}

/** Relative-friendly label for dashboard activity (Today / Yesterday in business zone). */
export function formatBusinessFriendlyDateTime(
  iso: string | null | undefined,
  businessTimeZone?: string | null
): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const tz = normalizeBusinessTimeZone(businessTimeZone);
  const now = new Date();
  const dayKey = calendarDateKeyInZone(d, tz);
  const todayKey = calendarDateKeyInZone(now, tz);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayKey = calendarDateKeyInZone(yesterday, tz);

  let time: string;
  try {
    time = new Intl.DateTimeFormat(getActiveLocale(), {
      timeZone: tz,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    time = formatBusinessDateTime(iso, tz);
  }

  if (dayKey === todayKey) return translate("common.todayAt", { values: { time } });
  if (dayKey === yesterdayKey) return translate("common.yesterdayAt", { values: { time } });
  try {
    return new Intl.DateTimeFormat(getActiveLocale(), {
      timeZone: tz,
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return formatBusinessDateTime(iso, tz);
  }
}

/**
 * Short relative time for operational UIs (e.g. "2 minutes ago", "Yesterday", "3 days ago").
 * Pair with an exact timestamp tooltip for accessibility.
 */
export function formatRelativeTimeAgo(iso: string | null | undefined, now = new Date()): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 0) return translate("notifications.justNow");

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return translate("notifications.justNow");
  if (minutes < 60) return translate("common.minuteAgo", { count: minutes });

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return translate("common.hourAgo", { count: hours });

  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startEvent = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startToday.getTime() - startEvent.getTime()) / 86_400_000);

  if (diffDays <= 0) return translate("common.hourAgo", { count: Math.max(hours, 1) });
  if (diffDays === 1) return translate("attendance.yesterday");
  if (diffDays < 7) return translate("common.dayAgo", { count: diffDays });
  if (diffDays < 14) return translate("common.lastWeek");
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks <= 1 ? translate("common.lastWeek") : translate("common.weekAgo", { count: weeks });
  }
  if (diffDays < 365) {
    const months = Math.max(1, Math.floor(diffDays / 30));
    return translate("common.monthAgo", { count: months });
  }
  const years = Math.max(1, Math.floor(diffDays / 365));
  return translate("common.yearAgo", { count: years });
}
