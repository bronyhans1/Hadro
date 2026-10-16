"use client";

import React from "react";
import type { TodayOverview } from "@/lib/api/attendance.api";
import { isRemoteSession } from "@/lib/attendance/sessionTypeDisplay";
import { formatMinutes } from "@/lib/dashboard/formatters";
import { StatCard } from "@/components/ui/StatCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { MotionStagger } from "@/components/ui/Motion";
import { useMemo } from "react";
import { translate } from "@/lib/i18n";

function StatIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      {children}
    </svg>
  );
}

interface AttendanceSnapshotGridProps {
  overview: TodayOverview | null;
  activeCount: number | null;
  activeSessions: Array<{ attendance_mode?: string | null }>;
  loading?: boolean;
}

export function AttendanceSnapshotGrid({
  overview,
  activeCount,
  activeSessions,
  loading,
}: AttendanceSnapshotGridProps) {
  const remoteCount = useMemo(
    () => activeSessions.filter((s) => isRemoteSession(s.attendance_mode)).length,
    [activeSessions]
  );

  if (loading && !overview) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy aria-label={translate("attendance.loadingSnapshot")}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border p-4"
            style={{ borderColor: "var(--ds-color-border)", background: "var(--ds-color-surface)" }}
          >
            <Skeleton className="mb-2 h-3 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        ))}
      </div>
    );
  }

  const workingNow = activeCount ?? overview?.active ?? 0;

  return (
    <MotionStagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <StatCard
        title={translate("attendance.presentToday")}
        value={overview?.present ?? 0}
        subtitle={translate("attendance.employeesClockedIn")}
        tone="success"
        icon={
          <StatIcon>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </StatIcon>
        }
      />
      <StatCard
        title={translate("attendance.currentlyWorking")}
        value={workingNow}
        subtitle={translate("attendance.activeSessions")}
        tone="working"
        icon={
          <StatIcon>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </StatIcon>
        }
      />
      <StatCard
        title={translate("attendance.completedToday")}
        value={overview?.completed ?? 0}
        subtitle={translate("attendance.sessionsCompleted")}
        tone="completed"
        icon={
          <StatIcon>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </StatIcon>
        }
      />
      <StatCard
        title={translate("attendance.lateToday")}
        value={overview?.late_today ?? 0}
        subtitle={translate("attendance.lateArrivals")}
        tone="warning"
        icon={
          <StatIcon>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </StatIcon>
        }
      />
      <StatCard
        title={translate("attendance.absentToday")}
        value={overview?.absent_today ?? 0}
        subtitle={translate("attendance.absentEmployees")}
        tone="danger"
        icon={
          <StatIcon>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </StatIcon>
        }
      />
      <StatCard
        title={translate("attendance.remoteSessions")}
        value={remoteCount}
        subtitle={translate("attendance.remoteClockIns")}
        tone="remote"
        icon={
          <StatIcon>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </StatIcon>
        }
      />
      <StatCard
        title={translate("attendance.totalWorkedTime")}
        value={overview ? formatMinutes(overview.total_minutes_today) : "—"}
        subtitle={translate("attendance.formattedHoursMinutes")}
        tone="completed"
        icon={
          <StatIcon>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </StatIcon>
        }
      />
    </MotionStagger>
  );
}
