import type { SessionHistoryItem } from "@/lib/api/attendance.api";
import { isRemoteSession } from "@/lib/attendance/sessionTypeDisplay";
import { formatDurationMinutes } from "@/lib/dashboard/formatters";
import { translate } from "@/lib/i18n";
import { getCurrentMonthRange, toDateString } from "@/lib/utils/date";

export type HistoryDatePresetId =
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_30_days"
  | "this_month"
  | "clear";

export function applyHistoryDatePreset(
  preset: HistoryDatePresetId
): { start: string; end: string } | null {
  if (preset === "clear") return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "today":
      return { start: toDateString(today), end: toDateString(today) };
    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: toDateString(yesterday), end: toDateString(yesterday) };
    }
    case "last_7_days": {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { start: toDateString(start), end: toDateString(today) };
    }
    case "last_30_days": {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { start: toDateString(start), end: toDateString(today) };
    }
    case "this_month":
      return getCurrentMonthRange();
  }
}

export function hasHistoryFilters(opts: {
  start: string;
  end: string;
  employeeFilter: string;
}): boolean {
  return Boolean(opts.start.trim() || opts.end.trim() || opts.employeeFilter);
}

const MANUAL_REASON_KEYS: Record<string, string> = {
  phone_unavailable: "attendance.reasonPhoneUnavailable",
  device_battery_dead: "attendance.reasonDeviceBatteryDead",
  app_or_network_issue: "attendance.reasonAppOrNetwork",
  missed_scan: "attendance.reasonMissedScan",
  supervisor_override: "attendance.reasonSupervisorOverride",
  other: "attendance.reasonOther",
};

export function reasonLabel(code: string | null | undefined): string {
  if (!code) return "";
  const key = MANUAL_REASON_KEYS[code];
  if (key) return translate(key);
  return code.replace(/_/g, " ");
}

export function manualSummary(r: SessionHistoryItem): string {
  const parts: string[] = [];
  if (r.manual_check_in) {
    parts.push(translate("attendance.manualReasonIn", { values: { reason: reasonLabel(r.manual_check_in_reason) } }));
  }
  if (r.manual_check_out) {
    parts.push(translate("attendance.manualReasonOut", { values: { reason: reasonLabel(r.manual_check_out_reason) } }));
  }
  return parts.join(" · ");
}

export function manualColumnLabel(r: SessionHistoryItem): "Manual" | "Partial" | null {
  const inM = !!r.manual_check_in;
  const outM = !!r.manual_check_out;
  if (inM && outM) return "Manual";
  if (inM || outM) return "Partial";
  return null;
}

export function sessionStatusVariant(
  status: string
): "success" | "warning" | "neutral" | "present" | "default" {
  const s = status?.toUpperCase();
  if (s === "COMPLETED") return "success";
  if (s === "ACTIVE") return "present";
  if (s === "CANCELLED") return "neutral";
  return "default";
}

export interface HistorySummaryMetrics {
  sessions: number;
  employees: number;
  remote: number;
  manual: number;
  completed: number;
  averageDuration: string;
}

export function computeHistorySummary(
  rows: SessionHistoryItem[],
  total: number
): HistorySummaryMetrics {
  const durations = rows
    .map((r) => r.duration_minutes)
    .filter((m): m is number => m !== null && m >= 0);
  const avg =
    durations.length > 0
      ? Math.round(durations.reduce((sum, m) => sum + m, 0) / durations.length)
      : null;

  return {
    sessions: total,
    employees: new Set(rows.map((r) => r.user_id)).size,
    remote: rows.filter((r) => isRemoteSession(r.attendance_mode)).length,
    manual: rows.filter((r) => manualColumnLabel(r) !== null).length,
    completed: rows.filter((r) => r.status?.toUpperCase() === "COMPLETED").length,
    averageDuration: formatDurationMinutes(avg),
  };
}

export function detectActiveDatePreset(
  start: string,
  end: string
): HistoryDatePresetId | null {
  const presets: HistoryDatePresetId[] = [
    "today",
    "yesterday",
    "last_7_days",
    "last_30_days",
    "this_month",
  ];
  for (const preset of presets) {
    const range = applyHistoryDatePreset(preset);
    if (range && range.start === start && range.end === end) return preset;
  }
  return null;
}
