"use client";

import type { InsightStatItem } from "@/lib/attendance/attendanceInsightsUtils";
import { StatGrid } from "@/components/ui/StatGrid";
import { translate } from "@/lib/i18n";

interface AttendanceInsightSummaryGridProps {
  stats: InsightStatItem[];
  loading?: boolean;
  ariaLabel?: string;
}

export function AttendanceInsightSummaryGrid({
  stats,
  loading,
  ariaLabel = translate("attendance.reportSummary"),
}: AttendanceInsightSummaryGridProps) {
  return (
    <StatGrid
      ariaLabel={ariaLabel}
      loading={loading}
      loadingCount={5}
      className="xl:grid-cols-5"
      items={stats.map((stat) => ({
        key: stat.title,
        title: stat.title,
        value: stat.value,
        subtitle: stat.subtitle,
      }))}
    />
  );
}
