import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";
import type { ThemePalette } from "@/store/theme";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export function leaveTypeIcon(type: string): IoniconName {
  switch (type.trim().toLowerCase()) {
    case "annual":
      return "sunny-outline";
    case "sick":
      return "medkit-outline";
    case "unpaid":
      return "wallet-outline";
    case "maternity":
      return "heart-outline";
    default:
      return "document-text-outline";
  }
}

export function leaveTypeAccent(type: string, colors: ThemePalette): { bg: string; fg: string } {
  switch (type.trim().toLowerCase()) {
    case "annual":
      return { bg: `${colors.primary}18`, fg: colors.primary };
    case "sick":
      return { bg: colors.toneWarningBg, fg: colors.toneWarningText };
    case "maternity":
      return { bg: colors.toneSuccessBg, fg: colors.toneSuccessText };
    case "unpaid":
      return { bg: colors.toneNeutralBg, fg: colors.toneNeutralText };
    default:
      return { bg: colors.toneNeutralBg, fg: colors.toneNeutralText };
  }
}
