import type { ThemePalette } from "@/store/theme";
import { translate } from "@/lib/i18n";

/** Leave request row badges — light + dark safe. */
export function leaveStatusBadge(colors: ThemePalette, status: string) {
  const s = status?.toUpperCase() ?? "";
  if (s === "APPROVED") {
    return {
      bg: colors.toneSuccessBg,
      text: colors.toneSuccessText,
      label: translate("leave.approved"),
    };
  }
  if (s === "REJECTED") {
    return {
      bg: colors.toneDangerBg,
      text: colors.toneDangerText,
      label: translate("leave.rejected"),
    };
  }
  if (s === "CANCELLED") {
    return {
      bg: colors.toneNeutralBg,
      text: colors.toneNeutralText,
      label: translate("leave.cancelled"),
    };
  }
  if (s === "TERMINATED") {
    return {
      bg: colors.toneNeutralBg,
      text: colors.toneNeutralText,
      label: translate("leave.terminated"),
    };
  }
  if (s === "COMPLETED") {
    return {
      bg: colors.toneNeutralBg,
      text: colors.toneNeutralText,
      label: translate("attendance.completed"),
    };
  }
  return {
    bg: colors.toneWarningBg,
    text: colors.toneWarningText,
    label: translate("leave.pending"),
  };
}

/** Attendance session list status chip. */
export function sessionStatusBadge(colors: ThemePalette, status: string) {
  const s = (status ?? "").toUpperCase();
  if (s === "ACTIVE") {
    return { label: translate("attendance.active"), color: colors.warning, bg: colors.toneWarningBg };
  }
  if (s === "COMPLETED") {
    return { label: translate("attendance.completed"), color: colors.success, bg: colors.toneSuccessBg };
  }
  if (s === "CANCELLED") {
    return { label: translate("leave.cancelled"), color: colors.toneNeutralText, bg: colors.toneNeutralBg };
  }
  return { label: status, color: colors.muted, bg: colors.toneNeutralBg };
}
