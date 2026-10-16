"use client";

import { CheckCircle2, Clock3, FileClock, Laptop, Users, Wrench } from "lucide-react";
import type { HistorySummaryMetrics } from "@/lib/attendance/attendanceHistoryUtils";
import { StatCard } from "@/components/ui/StatCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { MotionStagger } from "@/components/ui/Motion";
import { translate } from "@/lib/i18n";

interface AttendanceHistorySummaryProps {
  metrics: HistorySummaryMetrics;
  loading?: boolean;
}

export function AttendanceHistorySummary({ metrics, loading }: AttendanceHistorySummaryProps) {
  if (loading) {
    return (
      <div
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        aria-busy
        aria-label={translate("attendance.loadingSummary")}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border p-4"
            style={{ borderColor: "var(--ds-color-border)", background: "var(--ds-color-surface)" }}
          >
            <Skeleton className="mb-2 h-3 w-20" />
            <Skeleton className="h-7 w-12" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <MotionStagger
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      aria-label={translate("attendance.summaryForResults")}
    >
      <StatCard title={translate("attendance.sessions")} value={metrics.sessions} subtitle={translate("attendance.matchingFilters")} icon={<FileClock />} tone="working" />
      <StatCard title={translate("navigation.employees")} value={metrics.employees} subtitle={translate("attendance.onThisPage")} icon={<Users />} tone="success" />
      <StatCard title={translate("attendance.remote")} value={metrics.remote} subtitle={translate("attendance.onThisPage")} icon={<Laptop />} tone="remote" />
      <StatCard title={translate("attendance.manual")} value={metrics.manual} subtitle={translate("attendance.onThisPage")} icon={<Wrench />} tone="warning" />
      <StatCard title={translate("attendance.completed")} value={metrics.completed} subtitle={translate("attendance.onThisPage")} icon={<CheckCircle2 />} tone="completed" />
      <StatCard title={translate("attendance.averageDuration")} value={metrics.averageDuration} subtitle={translate("attendance.onThisPage")} icon={<Clock3 />} tone="neutral" />
    </MotionStagger>
  );
}
