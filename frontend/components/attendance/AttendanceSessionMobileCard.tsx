"use client";

import type { SessionHistoryItem } from "@/lib/api/attendance.api";
import { SessionTypeBadge } from "@/components/attendance/SessionTypeBadge";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { AvatarPhoto } from "@/components/ui/AvatarPhoto";
import {
  manualColumnLabel,
  manualSummary,
  sessionStatusVariant,
} from "@/lib/attendance/attendanceHistoryUtils";
import { formatDurationMinutes } from "@/lib/dashboard/formatters";
import { formatBusinessDateOnly, formatBusinessDateTime } from "@/lib/utils/businessDateTime";
import { translate } from "@/lib/i18n";

interface AttendanceSessionMobileCardProps {
  row: SessionHistoryItem;
  canViewCompany: boolean;
  businessTimeZone: string;
  employeePhotos?: ReadonlyMap<string, { name: string; photoUrl?: string | null }>;
}

function AvatarCell({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
  const initial = (name[0] ?? "?").toUpperCase();
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold"
      style={{ background: "var(--ds-color-primary-muted)", color: "var(--ds-color-primary)" }}
      aria-hidden
    >
      {photoUrl ? (
        <AvatarPhoto src={photoUrl} alt="" size={40} className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </div>
  );
}

function statusLabel(status: string | null | undefined): string {
  const s = status?.toUpperCase();
  if (s === "ACTIVE") return translate("attendance.active");
  if (s === "COMPLETED") return translate("attendance.completed");
  if (s === "CANCELLED") return translate("leave.cancelled");
  return status ?? "—";
}

function ManualBadge({ row }: { row: SessionHistoryItem }) {
  const label = manualColumnLabel(row);
  if (!label) return null;
  if (label === "Manual") {
    return <Badge variant="warning">{translate("attendance.manual")}</Badge>;
  }
  const tip = manualSummary(row);
  return (
    <span title={tip || undefined}>
      <Badge variant="default">{translate("attendance.partial")}</Badge>
    </span>
  );
}

export function AttendanceSessionMobileCard({
  row,
  canViewCompany,
  businessTimeZone,
  employeePhotos,
}: AttendanceSessionMobileCardProps) {
  const meta = employeePhotos?.get(row.user_id);
  const name = row.employee_name ?? meta?.name ?? "—";
  const day = row.attendance_date
    ? row.attendance_date.slice(0, 10)
    : formatBusinessDateOnly(row.check_in, businessTimeZone);
  const branchLabel = canViewCompany ? translate("attendance.branch") : translate("attendance.office");

  return (
    <Card padding={false} className="overflow-hidden">
      <CardBody className="space-y-3">
        <div className="flex min-w-0 items-start gap-3">
          {canViewCompany ? <AvatarCell name={name} photoUrl={meta?.photoUrl} /> : null}
          <div className="min-w-0 flex-1">
            {canViewCompany ? (
              <>
                <p className="truncate font-semibold" style={{ color: "var(--ds-color-text-primary)" }}>
                  {name}
                </p>
                {row.employee_email ? (
                  <p className="break-all text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
                    {row.employee_email}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="font-semibold" style={{ color: "var(--ds-color-text-primary)" }}>
                {day}
              </p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {canViewCompany ? (
                <span className="text-xs" style={{ color: "var(--ds-color-text-secondary)" }}>
                  {day}
                </span>
              ) : null}
              {row.overnight_session ? (
                <Badge variant="warning">{translate("attendance.overnight")}</Badge>
              ) : null}
              <Badge variant={sessionStatusVariant(row.status)}>{statusLabel(row.status)}</Badge>
              <SessionTypeBadge
                attendanceMode={row.attendance_mode}
                remoteApprovalStatus={row.remote_approval_status}
              />
              <ManualBadge row={row} />
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <div className="min-w-0">
            <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("attendance.clockIn")}</dt>
            <dd className="mt-0.5 break-words tabular-nums" style={{ color: "var(--ds-color-text-primary)" }}>
              {formatBusinessDateTime(row.check_in, businessTimeZone)}
            </dd>
          </div>
          <div className="min-w-0">
            <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("attendance.clockOut")}</dt>
            <dd className="mt-0.5 break-words tabular-nums" style={{ color: "var(--ds-color-text-primary)" }}>
              {formatBusinessDateTime(row.check_out, businessTimeZone)}
            </dd>
          </div>
          <div className="min-w-0">
            <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("attendance.duration")}</dt>
            <dd className="mt-0.5" style={{ color: "var(--ds-color-text-primary)" }}>
              {formatDurationMinutes(row.duration_minutes)}
            </dd>
          </div>
          <div className="min-w-0">
            <dt style={{ color: "var(--ds-color-text-muted)" }}>{branchLabel}</dt>
            <dd className="mt-0.5 truncate" style={{ color: "var(--ds-color-text-primary)" }}>
              {row.branch_name ?? "—"}
            </dd>
          </div>
          {row.department_name ? (
            <div className="min-w-0 col-span-2">
              <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("attendance.department")}</dt>
              <dd className="mt-0.5 truncate" style={{ color: "var(--ds-color-text-primary)" }}>
                {row.department_name}
              </dd>
            </div>
          ) : null}
        </dl>
      </CardBody>
    </Card>
  );
}
