"use client";

import type { SessionHistoryItem } from "@/lib/api/attendance.api";
import { SessionTypeBadge } from "@/components/attendance/SessionTypeBadge";
import { Badge } from "@/components/ui/Badge";
import { TablePagination } from "@/components/ui/TablePagination";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Tooltip } from "@/components/ui/Tooltip";
import { AvatarPhoto } from "@/components/ui/AvatarPhoto";
import {
  manualColumnLabel,
  manualSummary,
  sessionStatusVariant,
} from "@/lib/attendance/attendanceHistoryUtils";
import { formatDurationMinutes } from "@/lib/dashboard/formatters";
import { formatBusinessDateOnly, formatBusinessDateTime } from "@/lib/utils/businessDateTime";
import { translate } from "@/lib/i18n";

interface AttendanceHistoryTableProps {
  canViewCompany: boolean;
  rows: SessionHistoryItem[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: string | null;
  hasFilters: boolean;
  businessTimeZone: string;
  employeePhotos?: ReadonlyMap<string, { name: string; photoUrl?: string | null }>;
  onRetry: () => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

function AvatarCell({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
  const initial = (name[0] ?? "?").toUpperCase();
  return (
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
  );
}

function ManualBadge({ row }: { row: SessionHistoryItem }) {
  const label = manualColumnLabel(row);
  if (!label) {
    return <span style={{ color: "var(--ds-color-text-muted)" }}>—</span>;
  }
  if (label === "Manual") {
    return <Badge variant="warning">{translate("attendance.manual")}</Badge>;
  }
  const tip = manualSummary(row);
  if (!tip) return <Badge variant="default">{translate("attendance.partial")}</Badge>;
  return (
    <Tooltip content={tip}>
      <span tabIndex={0}>
        <Badge variant="default">{translate("attendance.partial")}</Badge>
      </span>
    </Tooltip>
  );
}

export function AttendanceHistoryTable({
  canViewCompany,
  rows,
  total,
  page,
  limit,
  loading,
  error,
  hasFilters,
  businessTimeZone,
  employeePhotos,
  onRetry,
  onPreviousPage,
  onNextPage,
}: AttendanceHistoryTableProps) {
  if (error) {
    return (
      <Card padding={false}>
        <CardHeader title={translate("attendance.sessionHistory")} />
        <CardBody>
          <ErrorState message={error} onRetry={onRetry} />
        </CardBody>
      </Card>
    );
  }

  const emptyTitle = hasFilters ? translate("attendance.noResultsMatchFilters") : translate("attendance.noAttendanceYet");
  const emptyDescription = hasFilters
    ? translate("attendance.tryAdjustFilters")
    : translate("attendance.sessionsWillAppear");

  return (
    <Card padding={false}>
      <CardHeader title={translate("attendance.sessionHistory")} />
      <CardBody className="!p-0">
        {!loading && rows.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} className="m-4 border-0" />
        ) : (
          <DataTable
            loading={loading && rows.length === 0}
            emptyMessage={emptyDescription}
            keyExtractor={(row) => row.id}
            data={rows}
            stickyHeader
            columns={[
              ...(canViewCompany
                ? [
                    {
                      key: "avatar",
                      header: "",
                      render: (row: SessionHistoryItem) => {
                        const meta = employeePhotos?.get(row.user_id);
                        const name = row.employee_name ?? meta?.name ?? "?";
                        return <AvatarCell name={name} photoUrl={meta?.photoUrl} />;
                      },
                    },
                    {
                      key: "employee",
                      header: translate("attendance.employee"),
                      render: (row: SessionHistoryItem) => {
                        const meta = employeePhotos?.get(row.user_id);
                        const name = row.employee_name ?? meta?.name ?? "—";
                        return (
                          <div className="min-w-[140px]">
                            <span className="font-medium">{name}</span>
                            {row.employee_email ? (
                              <span
                                className="mt-0.5 block text-xs"
                                style={{ color: "var(--ds-color-text-muted)" }}
                              >
                                {row.employee_email}
                              </span>
                            ) : null}
                          </div>
                        );
                      },
                    },
                  ]
                : []),
              {
                key: "day",
                header: translate("attendance.attendanceDayColumn"),
                render: (row) => (
                  <span className="whitespace-nowrap text-xs">
                    {row.attendance_date
                      ? row.attendance_date.slice(0, 10)
                      : formatBusinessDateOnly(row.check_in, businessTimeZone)}
                    {row.overnight_session ? (
                      <Badge variant="warning" className="ml-1">
                        Overnight
                      </Badge>
                    ) : null}
                  </span>
                ),
              },
              {
                key: "check_in",
                header: translate("attendance.clockIn"),
                render: (row) => (
                  <span className="whitespace-nowrap text-xs tabular-nums">
                    {formatBusinessDateTime(row.check_in, businessTimeZone)}
                  </span>
                ),
              },
              {
                key: "check_out",
                header: translate("attendance.clockOut"),
                render: (row) => (
                  <span className="whitespace-nowrap text-xs tabular-nums">
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
                key: "branch",
                header: canViewCompany ? translate("attendance.branch") : translate("attendance.office"),
                render: (row) => row.branch_name ?? "—",
              },
              {
                key: "department",
                header: translate("attendance.department"),
                render: (row) => row.department_name ?? "—",
              },
              {
                key: "type",
                header: translate("attendance.sessionType"),
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
                render: (row) => <ManualBadge row={row} />,
              },
              {
                key: "status",
                header: translate("attendance.status"),
                render: (row) => (
                  <Badge variant={sessionStatusVariant(row.status)}>
                    {row.status?.toUpperCase() === "ACTIVE"
                      ? translate("attendance.active")
                      : row.status?.toUpperCase() === "COMPLETED"
                        ? translate("attendance.completed")
                        : row.status?.toUpperCase() === "CANCELLED"
                          ? translate("leave.cancelled")
                          : row.status}
                  </Badge>
                ),
              },
            ]}
          />
        )}
      </CardBody>

      {rows.length > 0 ? (
        <TablePagination
          className="border-t border-[var(--ds-color-border)] px-4 py-4"
          page={page}
          pageSize={limit}
          total={total}
          currentCount={rows.length}
          loading={loading}
          itemLabel={translate("attendance.sessionNoun", { count: total })}
          onPrevious={onPreviousPage}
          onNext={onNextPage}
        />
      ) : null}
    </Card>
  );
}
