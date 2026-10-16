"use client";

import { ClockPlus } from "lucide-react";
import type { LeaveStatItem } from "@/lib/leave/leaveOverviewUtils";
import { StatGrid } from "@/components/ui/StatGrid";
import { translate } from "@/lib/i18n";

interface ManualOvertimeSnapshotGridProps {
  stats: LeaveStatItem[];
  loading?: boolean;
}

export function ManualOvertimeSnapshotGrid({ stats, loading }: ManualOvertimeSnapshotGridProps) {
  return (
    <StatGrid
      ariaLabel={translate("payroll.manualOtSnapshotAria")}
      loading={loading}
      items={stats.map((stat) => ({
        key: stat.title,
        title: stat.title,
        value: stat.value,
        subtitle: stat.subtitle,
        icon: <ClockPlus />,
        tone: "warning",
      }))}
    />
  );
}
