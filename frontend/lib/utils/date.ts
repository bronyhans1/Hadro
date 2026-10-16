import { getActiveLocale } from "@/lib/i18n";

/** Format YYYY-MM-DD for date inputs (local calendar date). */
export function toDateString(d: Date): string {
  return formatLocalYmd(d);
}

/** Local YYYY-MM-DD without UTC shift. */
export function formatLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Today's date as local YYYY-MM-DD. */
export function getTodayYmdLocal(): string {
  return formatLocalYmd(new Date());
}

/** Month range (1–12) as YYYY-MM-DD strings. */
export function getMonthRangeFromParts(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { start: formatLocalYmd(start), end: formatLocalYmd(end) };
}

/** Add months to a year/month pair (month is 1–12). */
export function addMonths(
  year: number,
  month: number,
  delta: number
): { year: number; month: number } {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

/** Full month label e.g. "May 2026". */
export function formatMonthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString(getActiveLocale(), {
    month: "long",
    year: "numeric",
  });
}

/** ISO week day index: Monday = 0 … Sunday = 6. */
export function isoWeekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

/** Start and end of current month as YYYY-MM-DD. */
export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: toDateString(start), end: toDateString(end) };
}

/** Calendar presets for report date ranges (local date, matches `<input type="date">`). */
export type ReportDatePresetId = "this_month" | "last_month" | "last_7_days";

export function applyReportDatePresetRange(preset: ReportDatePresetId): {
  start: string;
  end: string;
} {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (preset) {
    case "this_month":
      return getCurrentMonthRange();
    case "last_month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: toDateString(start), end: toDateString(end) };
    }
    case "last_7_days": {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { start: toDateString(start), end: toDateString(today) };
    }
  }
}

/** Year + month (1–12) for payroll month pickers. */
export function getYearMonthPreset(preset: "this_month" | "last_month"): {
  year: number;
  month: number;
} {
  const now = new Date();
  if (preset === "this_month") {
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}
