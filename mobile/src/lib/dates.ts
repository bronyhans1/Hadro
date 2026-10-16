import { getActiveLocale } from "@/lib/i18n";

/** Local calendar midnight for today (stable anchor for date pickers). */
export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Format a local calendar date as YYYY-MM-DD (API contract). */
export function formatYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse YYYY-MM-DD to local midnight (no UTC shift for date-only fields). */
export function parseYmd(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const date = new Date(y, mo, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo || date.getDate() !== d) {
    return null;
  }
  return date;
}

export function formatDisplayDate(ymd: string): string {
  const parsed = parseYmd(ymd);
  if (!parsed) return ymd;
  return parsed.toLocaleDateString(getActiveLocale(), {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
