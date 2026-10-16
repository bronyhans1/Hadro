/**
 * Format instants in the company's business timezone so mobile matches web/earnings
 * and avoids device-default locale quirks on Android/iOS.
 */

import { getActiveLocale, translate } from "@/lib/i18n";

export const DEFAULT_BUSINESS_TIMEZONE = "Africa/Accra";

export function normalizeZoneForIntl(tz: string | null | undefined): string {
  const z = (tz ?? DEFAULT_BUSINESS_TIMEZONE).trim() || DEFAULT_BUSINESS_TIMEZONE;
  try {
    Intl.DateTimeFormat("en-US", { timeZone: z });
    return z;
  } catch {
    return DEFAULT_BUSINESS_TIMEZONE;
  }
}

const TIME_PARTS_OPTS = (tz: string) =>
  ({
    timeZone: tz,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    hourCycle: "h23" as const,
  }) as const;

export function formatSessionClock(iso: string | null | undefined, businessTimeZone?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const tz = normalizeZoneForIntl(businessTimeZone);
  try {
    return new Intl.DateTimeFormat(getActiveLocale(), {
      timeZone: tz,
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      hourCycle: "h23",
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

export function formatSessionDay(iso: string | null | undefined, businessTimeZone?: string | null): string {
  if (!iso) return translate("common.unknownDate");
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const tz = normalizeZoneForIntl(businessTimeZone);
  try {
    return new Intl.DateTimeFormat(getActiveLocale(), {
      timeZone: tz,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return "—";
  }
}

/** Hour (0–23) in the business zone, for greetings / copy tied to company calendar. */
export function formatBusinessTimeOnly(isoOrNow: string | Date, businessTimeZone?: string | null): string {
  const d = typeof isoOrNow === "string" ? new Date(isoOrNow) : isoOrNow;
  if (Number.isNaN(d.getTime())) return "—";
  const tz = normalizeZoneForIntl(businessTimeZone);
  try {
    return new Intl.DateTimeFormat("en-US", TIME_PARTS_OPTS(tz)).format(d);
  } catch {
    return d.toISOString().slice(11, 16);
  }
}

export function currentHourInBusinessZone(now: Date, businessTimeZone?: string | null): number {
  const tz = normalizeZoneForIntl(businessTimeZone);
  try {
    const parts = new Intl.DateTimeFormat("en-US", TIME_PARTS_OPTS(tz)).formatToParts(now);
    const h = Number(parts.find((p) => p.type === "hour")?.value);
    return Number.isFinite(h) ? h : 0;
  } catch {
    return now.getUTCHours();
  }
}
