"use client";

import { Badge } from "@/components/ui/Badge";
import { flagLevelVariant } from "@/lib/attendance/attendanceInsightsUtils";
import { translate } from "@/lib/i18n";

function flagLevelLabel(level: string): string {
  if (level === "high") return translate("attendance.highRisk");
  if (level === "medium") return translate("attendance.mediumRiskPhrase");
  if (level === "low") return translate("attendance.lowRisk");
  return level;
}

export function FlagLevelBadge({ level }: { level: string }) {
  return <Badge variant={flagLevelVariant(level)}>{flagLevelLabel(level)}</Badge>;
}
