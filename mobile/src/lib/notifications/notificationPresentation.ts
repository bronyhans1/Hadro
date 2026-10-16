import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";
import type { ThemePalette } from "@/store/theme";
import type { NotificationRow } from "@/lib/api/notifications.api";
import { getActiveLocale, translate } from "@/lib/i18n";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export const NOTIFICATION_UNREAD_BADGE_COLOR = "#EF4444";

export type NotificationTone = "primary" | "success" | "warning" | "danger" | "neutral";

export interface NotificationVisual {
  icon: IoniconName;
  tone: NotificationTone;
}

export function getNotificationVisual(type: string): NotificationVisual {
  switch (type) {
    case "forgot_clock_out":
      return { icon: "time-outline", tone: "warning" };
    case "leave_submitted":
      return { icon: "paper-plane-outline", tone: "neutral" };
    case "leave_pending_review":
      return { icon: "calendar-outline", tone: "warning" };
    case "leave_approved":
      return { icon: "checkmark-circle-outline", tone: "success" };
    case "leave_rejected":
      return { icon: "close-circle-outline", tone: "danger" };
    case "payroll_sync_failure":
      return { icon: "alert-circle-outline", tone: "danger" };
    case "payroll_export_ready":
    case "payroll_generated":
      return { icon: "wallet-outline", tone: "success" };
    default:
      return { icon: "notifications-outline", tone: "primary" };
  }
}

export function toneColors(
  tone: NotificationTone,
  colors: ThemePalette
): { bg: string; fg: string } {
  switch (tone) {
    case "success":
      return { bg: colors.toneSuccessBg, fg: colors.toneSuccessText };
    case "warning":
      return { bg: colors.toneWarningBg, fg: colors.toneWarningText };
    case "danger":
      return { bg: colors.toneDangerBg, fg: colors.toneDangerText };
    case "neutral":
      return { bg: colors.toneNeutralBg, fg: colors.toneNeutralText };
    default:
      return { bg: `${colors.primary}18`, fg: colors.primary };
  }
}

export function formatNotificationWhen(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    if (diffMins < 1) return translate("notifications.justNow");
    if (diffMins < 60) return translate("notifications.minutesAgo", { values: { count: diffMins } });
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return translate("notifications.hoursAgo", { values: { count: diffHours } });
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return translate("notifications.daysAgo", { values: { count: diffDays } });
    return d.toLocaleString(getActiveLocale(), {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function matchesNotificationSearch(row: NotificationRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    row.title.toLowerCase().includes(q) ||
    row.body.toLowerCase().includes(q) ||
    row.type.toLowerCase().includes(q)
  );
}
