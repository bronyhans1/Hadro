"use client";

import { AlertTriangle, FileQuestion, Users, Wifi } from "lucide-react";
import type { RemoteReviewSummaryMetrics } from "@/lib/attendance/remoteReviewUtils";
import { StatCard } from "@/components/ui/StatCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { MotionStagger } from "@/components/ui/Motion";
import { translate } from "@/lib/i18n";

interface RemoteReviewSummaryProps {
  metrics: RemoteReviewSummaryMetrics;
  loading?: boolean;
}

export function RemoteReviewSummary({ metrics, loading }: RemoteReviewSummaryProps) {
  if (loading) {
    return (
      <div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        aria-busy
        aria-label={translate("attendance.loadingReviewSummary")}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border p-4"
            style={{ borderColor: "var(--ds-color-border)", background: "var(--ds-color-surface)" }}
          >
            <Skeleton className="mb-2 h-3 w-24" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <MotionStagger
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      aria-label={translate("attendance.remoteReviewSummary")}
    >
      <StatCard
        title={translate("attendance.pendingReviews")}
        value={metrics.pendingReviews}
        subtitle={translate("attendance.awaitingManagerAction")}
        icon={<Wifi />}
        tone="remote"
      />
      <StatCard
        title={translate("attendance.awaitingAction")}
        value={metrics.awaitingAction}
        subtitle={translate("attendance.sessionsInQueue")}
        icon={<AlertTriangle />}
        tone="warning"
      />
      <StatCard
        title={translate("navigation.employees")}
        value={metrics.employeesPending}
        subtitle={translate("attendance.withPendingRequests")}
        icon={<Users />}
        tone="working"
      />
      <StatCard
        title={translate("attendance.contextGaps")}
        value={metrics.missingContextCount}
        subtitle={translate("attendance.missingBranchOrDepartment")}
        icon={<FileQuestion />}
        tone="danger"
      />
    </MotionStagger>
  );
}
