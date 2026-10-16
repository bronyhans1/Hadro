"use client";

import { CalendarHeart } from "lucide-react";
import type { LeaveStatItem } from "@/lib/leave/leaveOverviewUtils";
import { StatGrid } from "@/components/ui/StatGrid";
import { translate } from "@/lib/i18n";

interface LeaveSnapshotGridProps {
  stats: LeaveStatItem[];
  loading?: boolean;
}

export function LeaveSnapshotGrid({ stats, loading }: LeaveSnapshotGridProps) {
  return (
    <StatGrid
      ariaLabel={translate("leave.leaveSnapshotAria")}
      loading={loading}
      items={stats.map((stat) => ({
        key: stat.title,
        title: stat.title,
        value: stat.value,
        subtitle: stat.subtitle,
        icon: <CalendarHeart />,
        tone: "leave",
      }))}
    />
  );
}
