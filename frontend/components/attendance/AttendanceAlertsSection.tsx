"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/design-system/cn";
import { translate } from "@/lib/i18n";

export interface AttendanceAlertItem {
  id: string;
  title: string;
  count: number;
  description: string;
  href: string;
  attention: boolean;
}

interface AttendanceAlertsSectionProps {
  canViewCompany: boolean;
  pendingRemoteCount: number;
  flaggedEmployeesCount: number;
  absentToday: number;
  lateToday: number;
}

function AlertCard({ item }: { item: AttendanceAlertItem }) {
  const router = useRouter();
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between",
        item.attention && "border-l-[3px]"
      )}
      style={{
        borderColor: item.attention ? "var(--ds-color-warning-border)" : "var(--ds-color-border)",
        borderLeftColor: item.attention ? "var(--ds-color-warning)" : undefined,
        background: item.attention ? "var(--ds-color-warning-subtle)" : "var(--ds-color-surface)",
        boxShadow: "var(--ds-shadow-card)",
      }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold" style={{ color: "var(--ds-color-text-primary)" }}>
            {item.title}
          </h3>
          <Badge variant={item.attention ? "warning" : "neutral"}>{item.count}</Badge>
        </div>
        <p className="mt-1 text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
          {item.description}
        </p>
      </div>
      <Button
        type="button"
        variant={item.attention ? "primary" : "outline"}
        size="sm"
        className="shrink-0"
        onClick={() => router.push(item.href)}
      >
        {translate("employees.view")}
      </Button>
    </div>
  );
}

export function AttendanceAlertsSection({
  canViewCompany,
  pendingRemoteCount,
  flaggedEmployeesCount,
  absentToday,
  lateToday,
}: AttendanceAlertsSectionProps) {
  const alerts = useMemo(() => {
    if (!canViewCompany) return [];

    const items: AttendanceAlertItem[] = [
      {
        id: "remote-pending",
        title: translate("attendance.pendingRemoteReviews"),
        count: pendingRemoteCount,
        description:
          pendingRemoteCount === 0
            ? translate("attendance.noRemoteAwaiting")
            : translate("attendance.remoteSessionsNeedReview", { count: pendingRemoteCount }),
        href: "/attendance/remote-review",
        attention: pendingRemoteCount > 0,
      },
      {
        id: "attendance-flags",
        title: translate("attendance.attendanceFlags"),
        count: flaggedEmployeesCount,
        description:
          flaggedEmployeesCount === 0
            ? translate("attendance.noHighRiskMonth")
            : translate("attendance.flaggedHighRisk", { count: flaggedEmployeesCount }),
        href: "/attendance/flags",
        attention: flaggedEmployeesCount > 0,
      },
      {
        id: "absent-today",
        title: translate("attendance.absentEmployees"),
        count: absentToday,
        description:
          absentToday === 0
            ? translate("attendance.everyoneAccounted")
            : translate("attendance.markedAbsentToday", { count: absentToday }),
        href: "/attendance/absence",
        attention: absentToday > 0,
      },
      {
        id: "late-today",
        title: translate("attendance.lateArrivals"),
        count: lateToday,
        description:
          lateToday === 0
            ? translate("attendance.noLateToday")
            : translate("attendance.lateArrivalsToday", { count: lateToday }),
        href: "/attendance/lateness",
        attention: lateToday > 0,
      },
    ];

    return items;
  }, [canViewCompany, pendingRemoteCount, flaggedEmployeesCount, absentToday, lateToday]);

  if (!canViewCompany) return null;

  return (
    <Card padding={false}>
      <CardHeader title={translate("attendance.attendanceAlerts")} />
      <CardBody>
        {alerts.length === 0 ? (
          <EmptyState title={translate("attendance.noAlerts")} description={translate("attendance.alertsWillAppear")} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2" role="list" aria-label={translate("attendance.attendanceAlertsList")}>
            {alerts.map((item) => (
              <AlertCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
