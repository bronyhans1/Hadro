"use client";

import Link from "next/link";
import type { SessionHistoryItem } from "@/lib/api/attendance.api";
import { SessionTypeBadge } from "@/components/attendance/SessionTypeBadge";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { AvatarPhoto } from "@/components/ui/AvatarPhoto";
import { formatDurationMinutes } from "@/lib/dashboard/formatters";
import { formatBusinessDateOnly, formatBusinessDateTime } from "@/lib/utils/businessDateTime";
import { translate } from "@/lib/i18n";

interface AttendanceRecentSessionsProps {
  canViewCompany: boolean;
  rows: SessionHistoryItem[];
  businessTimeZone: string;
  loading?: boolean;
  employeePhotos?: ReadonlyMap<string, { name: string; photoUrl?: string | null }>;
}

function sessionStatusVariant(status: string): "success" | "warning" | "neutral" | "present" {
  const s = status?.toUpperCase();
  if (s === "COMPLETED") return "success";
  if (s === "ACTIVE") return "present";
  if (s === "CANCELLED") return "neutral";
  return "neutral";
}

function reasonLabel(code: string | null | undefined): string {
  if (!code) return "";
  if (code === "phone_unavailable") return translate("attendance.reasonPhoneUnavailable");
  if (code === "device_battery_dead") return translate("attendance.reasonDeviceBatteryDead");
  if (code === "app_or_network_issue") return translate("attendance.reasonAppOrNetwork");
  if (code === "missed_scan") return translate("attendance.reasonMissedScan");
  if (code === "supervisor_override") return translate("attendance.reasonSupervisorOverride");
  if (code === "other") return translate("attendance.reasonOther");
  return code.replace(/_/g, " ");
}

function manualColumnLabel(r: SessionHistoryItem): "Manual" | "Partial" | null {
  const inM = !!r.manual_check_in;
  const outM = !!r.manual_check_out;
  if (inM && outM) return "Manual";
  if (inM || outM) return "Partial";
  return null;
}

function RowAvatar({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
  const initial = (name[0] ?? "?").toUpperCase();
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold"
        style={{ background: "var(--ds-color-primary-muted)", color: "var(--ds-color-primary)" }}
        aria-hidden
      >
        {photoUrl ? (
          <AvatarPhoto src={photoUrl} alt="" size={32} className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </div>
      <span className="font-medium">{name}</span>
    </div>
  );
}

export function AttendanceRecentSessions({
  canViewCompany,
  rows,
  businessTimeZone,
  loading,
  employeePhotos,
}: AttendanceRecentSessionsProps) {
  return (
    <Card padding={false}>
      <CardHeader title={canViewCompany ? translate("dashboard.recentAttendance") : translate("dashboard.myRecentAttendance")} />
      <CardBody className="!p-0">
        <DataTable
          loading={loading}
          emptyMessage={translate("attendance.noRecentSessions")}
          keyExtractor={(row) => row.id}
          data={rows}
          stickyHeader
          columns={[
            ...(canViewCompany
              ? [
                  {
                    key: "employee",
                    header: translate("attendance.employee"),
                    render: (row: SessionHistoryItem) => {
                      const meta = employeePhotos?.get(row.user_id);
                      const name = row.employee_name ?? meta?.name ?? `${row.user_id.slice(0, 8)}…`;
                      return <RowAvatar name={name} photoUrl={meta?.photoUrl} />;
                    },
                  },
                ]
              : []),
            {
              key: "day",
              header: translate("attendance.day"),
              render: (row) => (
                <span className="whitespace-nowrap text-xs">
                  {row.attendance_date
                    ? row.attendance_date.slice(0, 10)
                    : formatBusinessDateOnly(row.check_in, businessTimeZone)}
                  {row.overnight_session ? (
                    <Badge variant="warning" className="ml-1">
                      {translate("attendance.overnight")}
                    </Badge>
                  ) : null}
                </span>
              ),
            },
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
              key: "check_out",
              header: translate("attendance.clockOut"),
              render: (row) => (
                <span className="text-xs tabular-nums">
                  {formatBusinessDateTime(row.check_out, businessTimeZone)}
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
              header: translate("attendance.session"),
              render: (row) => (
                <SessionTypeBadge
                  attendanceMode={row.attendance_mode}
                  remoteApprovalStatus={row.remote_approval_status}
                />
              ),
            },
            {
              key: "manual",
              header: translate("attendance.manual"),
              render: (row) => {
                const label = manualColumnLabel(row);
                if (!label) return <span style={{ color: "var(--ds-color-text-muted)" }}>—</span>;
                if (label === "Manual") return <Badge variant="warning">{translate("attendance.manual")}</Badge>;
                const tip = reasonLabel(row.manual_check_in_reason) || reasonLabel(row.manual_check_out_reason);
                return (
                  <span title={tip || undefined}>
                    <Badge variant="default">{translate("attendance.partial")}</Badge>
                  </span>
                );
              },
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
  );
}
