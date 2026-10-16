import { normalizeZoneForIntl } from "@/lib/formatDateTime";
import { getActiveLocale, translate } from "@/lib/i18n";

/** True when session was started via remote clock-in (not onsite QR/geofence). */
export function isRemoteAttendanceSession(session: {
  attendance_mode?: string | null;
} | null | undefined): boolean {
  return (session?.attendance_mode ?? "").toLowerCase() === "remote";
}

/** Ownership day for grouping/display — prefer attendance_date over check-in UTC day. */
export function sessionAttendanceDayKey(session: {
  attendance_date?: string | null;
  check_in?: string | null;
}): string {
  if (session.attendance_date) return session.attendance_date.slice(0, 10);
  if (session.check_in) return session.check_in.slice(0, 10);
  return "—";
}

/** True when payroll/reporting day differs from check-in calendar day (overnight). */
export function isOvernightSession(session: {
  attendance_date?: string | null;
  check_in?: string | null;
  overnight_session?: boolean;
}): boolean {
  if (session.overnight_session === true) return true;
  if (session.attendance_date && session.check_in) {
    return session.attendance_date.slice(0, 10) !== session.check_in.slice(0, 10);
  }
  return false;
}

/** Section heading for history grouped by attendance ownership day. */
export function formatAttendanceDayHeading(
  ymd: string,
  businessTimeZone?: string | null
): string {
  if (!ymd || ymd === "—") return translate("common.unknownDate");
  const d = new Date(`${ymd}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return ymd;
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
    return ymd;
  }
}

export function formatAttendanceDayShort(ymd: string): string {
  if (!ymd || ymd === "—") return "—";
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat(getActiveLocale(), {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
