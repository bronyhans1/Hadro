"use client";

import { useMemo } from "react";
import { m, useReducedMotion } from "motion/react";
import {
  CheckCircle2,
  Clock3,
  TimerReset,
  UserMinus,
  Users,
  Wifi,
} from "lucide-react";
import type { TodayOverview } from "@/lib/api/attendance.api";
import { isRemoteSession } from "@/lib/attendance/sessionTypeDisplay";
import { formatMinutes } from "@/lib/dashboard/formatters";
import { StatCard } from "@/components/ui/StatCard";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { staggerContainer } from "@/lib/motion";
import { translate } from "@/lib/i18n";

interface DashboardKpiGridProps {
  overview: TodayOverview | null;
  activeCount: number | null;
  activeSessions: Array<{ attendance_mode?: string | null }>;
  loading?: boolean;
  /** Employee self-view: personal labels, fewer org-style metrics */
  personal?: boolean;
}

export function DashboardKpiGrid({
  overview,
  activeCount,
  activeSessions,
  loading,
  personal = false,
}: DashboardKpiGridProps) {
  const reduced = useReducedMotion();
  const remoteSessionCount = useMemo(
    () => activeSessions.filter((s) => isRemoteSession(s.attendance_mode)).length,
    [activeSessions]
  );

  if (loading && !overview) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy aria-label={translate("dashboard.loadingKpis")}>
        {Array.from({ length: personal ? 4 : 7 }).map((_, i) => (
          <SkeletonCard key={i} className="min-h-[164px]" />
        ))}
      </div>
    );
  }

  const workingNow = activeCount ?? overview?.active ?? 0;
  const cards = personal
    ? ([
        {
          title: translate("attendance.clockedIn"),
          value: workingNow > 0 ? translate("attendance.yes") : translate("attendance.no"),
          subtitle: translate("attendance.activeSessionNow"),
          icon: <Clock3 />,
          tone: "working",
        },
        {
          title: translate("attendance.presentToday"),
          value: (overview?.present ?? 0) > 0 ? translate("attendance.yes") : translate("attendance.no"),
          subtitle: translate("attendance.yourAttendanceToday"),
          icon: <Users />,
          tone: "success",
        },
        {
          title: translate("dashboard.lateToday"),
          value: (overview?.late_today ?? 0) > 0 ? translate("attendance.yes") : translate("attendance.no"),
          subtitle: translate("attendance.lateArrivalFlag"),
          icon: <TimerReset />,
          tone: "warning",
        },
        {
          title: translate("attendance.timeWorked"),
          value: overview ? formatMinutes(overview.total_minutes_today) : "—",
          subtitle: translate("attendance.minutesTrackedToday"),
          icon: <Clock3 />,
          tone: "completed",
        },
      ] as const)
    : ([
        {
          title: translate("attendance.presentToday"),
          value: overview?.present ?? 0,
          subtitle: translate("dashboard.employeesPresent"),
          icon: <Users />,
          tone: "success",
        },
        {
          title: translate("dashboard.currentlyWorking"),
          value: workingNow,
          subtitle: translate("dashboard.clockedInNow"),
          icon: <Clock3 />,
          tone: "working",
        },
        {
          title: translate("dashboard.completedSessions"),
          value: overview?.completed ?? 0,
          subtitle: translate("dashboard.sessionsEndedToday"),
          icon: <CheckCircle2 />,
          tone: "completed",
        },
        {
          title: translate("dashboard.lateToday"),
          value: overview?.late_today ?? 0,
          subtitle: translate("dashboard.lateArrivals"),
          icon: <TimerReset />,
          tone: "warning",
        },
        {
          title: translate("dashboard.absentToday"),
          value: overview?.absent_today ?? 0,
          subtitle: translate("dashboard.markedAbsent"),
          icon: <UserMinus />,
          tone: "danger",
        },
        {
          title: translate("dashboard.remoteSessions"),
          value: remoteSessionCount,
          subtitle: translate("dashboard.activeRemoteClockIns"),
          icon: <Wifi />,
          tone: "remote",
        },
        {
          title: translate("attendance.timeWorked"),
          value: overview ? formatMinutes(overview.total_minutes_today) : "—",
          subtitle: translate("dashboard.totalMinutesToday"),
          icon: <Clock3 />,
          tone: "completed",
        },
      ] as const);

  return (
    <m.div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      variants={reduced ? undefined : staggerContainer}
      initial={reduced ? false : "hidden"}
      animate="visible"
    >
      {cards.map((card) => (
        <StatCard key={card.title} {...card} animateValue />
      ))}
    </m.div>
  );
}
