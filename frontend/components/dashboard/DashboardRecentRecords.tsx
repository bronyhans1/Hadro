"use client";

import Link from "next/link";
import type { SessionHistoryItem } from "@/lib/api/attendance.api";
import type { LeaveRequest } from "@/lib/api/leave.api";
import { SessionTypeBadge } from "@/components/attendance/SessionTypeBadge";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { formatDurationMinutes, formatLeaveStatus } from "@/lib/dashboard/formatters";
import { formatBusinessDateTime } from "@/lib/utils/businessDateTime";
import { leaveTypeLabel } from "@/lib/leave/leaveTypes";
import { translate } from "@/lib/i18n";

interface DashboardRecentRecordsProps {
  canViewCompanyOps: boolean;
  branchScoped: boolean;
  attendanceRows: SessionHistoryItem[];
  leaveRows: LeaveRequest[];
  businessTimeZone: string;
  loading?: boolean;
}

function sessionStatusVariant(status: string): "success" | "warning" | "neutral" | "present" {
  const s = status?.toUpperCase();
  if (s === "COMPLETED") return "success";
  if (s === "ACTIVE") return "present";
  if (s === "CANCELLED") return "neutral";
  return "neutral";
}

export function DashboardRecentRecords({
  canViewCompanyOps,
  branchScoped,
  attendanceRows,
  leaveRows,
  businessTimeZone,
  loading,
}: DashboardRecentRecordsProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card padding={false}>
        <CardHeader title={canViewCompanyOps ? translate("dashboard.recentAttendance") : translate("dashboard.myRecentAttendance")} />
        <CardBody className="!p-0">
          <DataTable
            loading={loading}
            emptyMessage={translate("dashboard.noRecentSessions")}
            keyExtractor={(row) => row.id}
            data={attendanceRows}
            stickyHeader
            staggerRows
            columns={[
              ...(canViewCompanyOps
                ? [
                    {
                      key: "employee",
                      header: translate("attendance.employee"),
                      render: (row: SessionHistoryItem) => (
                        <span className="font-medium">{row.employee_name ?? `${row.user_id.slice(0, 8)}…`}</span>
                      ),
                    },
                  ]
                : []),
              {
                key: "check_in",
                header: translate("attendance.clockIn"),
                render: (row) => (
                  <span className="text-xs tabular-nums">
                    {formatBusinessDateTime(row.check_in, businessTimeZone)}
                  </span>
                ),
              },
              {
                key: "duration",
                header: translate("attendance.duration"),
                render: (row) => formatDurationMinutes(row.duration_minutes),
              },
              {
                key: "type",
                header: translate("attendance.type"),
                render: (row) => (
                  <SessionTypeBadge
                    attendanceMode={row.attendance_mode}
                    remoteApprovalStatus={row.remote_approval_status}
                  />
                ),
              },
              {
                key: "status",
                header: translate("attendance.status"),
                render: (row) => (
                  <Badge variant={sessionStatusVariant(row.status)}>
                    {row.status?.toLowerCase() === "active"
                      ? translate("attendance.active")
                      : row.status?.toLowerCase() === "completed"
                        ? translate("attendance.completed")
                        : row.status?.toLowerCase() === "cancelled"
                          ? translate("attendance.cancelled")
                          : row.status}
                  </Badge>
                ),
              },
            ]}
          />
        </CardBody>
        <CardFooter>
          <Link href="/attendance/history" className="text-sm font-medium" style={{ color: "var(--ds-color-primary)" }}>
            {translate("dashboard.viewFullHistory")}
          </Link>
        </CardFooter>
      </Card>

      <Card padding={false}>
        <CardHeader
          title={
            canViewCompanyOps
              ? branchScoped
                ? translate("dashboard.recentLeaveBranch")
                : translate("dashboard.recentLeave")
              : translate("dashboard.myRecentLeave")
          }
        />
        <CardBody className="!p-0">
          <DataTable
            loading={loading}
            emptyMessage={translate("dashboard.noLeaveRequestsYet")}
            keyExtractor={(row) => row.id}
            data={leaveRows}
            stickyHeader
            staggerRows
            columns={[
              {
                key: "type",
                header: translate("attendance.type"),
                render: (row) => <span className="font-medium">{leaveTypeLabel(row.leave_type)}</span>,
              },
              {
                key: "dates",
                header: translate("dashboard.dates"),
                render: (row) => (
                  <span className="text-xs">
                    {row.start_date} → {row.end_date}
                  </span>
                ),
              },
              ...(canViewCompanyOps
                ? [
                    {
                      key: "employee",
                      header: translate("attendance.employee"),
                      render: (row: LeaveRequest) => row.employee_name ?? row.user_id,
                    },
                  ]
                : []),
              {
                key: "status",
                header: translate("attendance.status"),
                render: (row) => {
                  const s = formatLeaveStatus(row.status);
                  return <Badge variant={s.variant}>{s.label}</Badge>;
                },
              },
            ]}
          />
        </CardBody>
        <CardFooter>
          <Link href="/leave" className="text-sm font-medium" style={{ color: "var(--ds-color-primary)" }}>
            {translate("dashboard.openLeave")}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
