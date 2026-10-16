import type { BadgeVariant } from "@/components/ui/Badge";
import { humanizeEnumKey } from "@/lib/format/displayLabels";
import { formatCompactDuration, getActiveLocale, translate } from "@/lib/i18n";

export function formatMinutes(m: number): string {
  return formatCompactDuration(m);
}

export function formatDurationMinutes(m: number | null): string {
  if (m === null || m < 0) return "—";
  return formatMinutes(m);
}

export function normalizeLeaveStatus(status: string): string {
  return (status ?? "").trim().toLowerCase();
}

export function formatLeaveStatus(status: string): {
  label: string;
  variant: BadgeVariant;
} {
  switch (normalizeLeaveStatus(status)) {
    case "pending":
      return { label: translate("leave.pending"), variant: "pending" };
    case "approved":
      return { label: translate("leave.approved"), variant: "approved" };
    case "rejected":
      return { label: translate("leave.rejected"), variant: "danger" };
    case "cancelled":
      return { label: translate("leave.cancelled"), variant: "cancelled" };
    case "terminated":
      return { label: translate("leave.terminated"), variant: "blocked" };
    case "completed":
      return { label: translate("attendance.completed"), variant: "completed" };
    default:
      return { label: status ? humanizeEnumKey(status) : "—", variant: "default" };
  }
}

export function getTimeGreeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return translate("dashboard.goodMorning");
  if (h < 17) return translate("dashboard.goodAfternoon");
  return translate("dashboard.goodEvening");
}

export function formatTodayDate(date = new Date()): string {
  return date.toLocaleDateString(getActiveLocale(), {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
