"use client";

import type { LeaveRequest } from "@/lib/api/leave.api";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatLeaveStatus } from "@/lib/dashboard/formatters";
import {
  leaveDesktopTableClass,
  leaveMobileCardsClass,
} from "@/lib/leave/leaveMobileLayout";
import { leaveTypeLabel } from "@/lib/leave/leaveTypes";
import { cn } from "@/lib/design-system/cn";
import { formatBusinessDateTime } from "@/lib/utils/businessDateTime";
import { translate } from "@/lib/i18n";

interface LeaveBalanceHistoryTableProps {
  rows: LeaveRequest[];
  businessTz: string;
  error?: string | null;
  loading?: boolean;
  onRetry?: () => void;
}

function requestedOn(row: LeaveRequest, businessTz: string): string {
  const iso = row.reviewed_at ?? row.cancelled_at ?? row.terminated_at ?? row.completed_at;
  return iso ? formatBusinessDateTime(iso, businessTz) : "—";
}

export function LeaveBalanceHistoryTable({
  rows,
  businessTz,
  error,
  loading,
  onRetry,
}: LeaveBalanceHistoryTableProps) {
  const columns = [
    {
      key: "leave_type",
      header: translate("leave.leaveTypeTitle"),
      render: (r: LeaveRequest) => <Badge variant="default">{leaveTypeLabel(r.leave_type)}</Badge>,
    },
    { key: "start_date", header: translate("leave.startDateTitle"), render: (r: LeaveRequest) => r.start_date },
    { key: "end_date", header: translate("leave.endDateTitle"), render: (r: LeaveRequest) => r.end_date },
    {
      key: "duration",
      header: translate("leave.duration"),
      render: (r: LeaveRequest) => translate("leave.durationDays", { values: { count: r.total_days } }),
    },
    {
      key: "status",
      header: translate("attendance.status"),
      render: (r: LeaveRequest) => {
        const formatted = formatLeaveStatus(r.status);
        return <Badge variant={formatted.variant}>{formatted.label}</Badge>;
      },
    },
    {
      key: "requested",
      header: translate("leave.requestedOn"),
      render: (r: LeaveRequest) => (
        <span className="whitespace-nowrap text-xs tabular-nums">{requestedOn(r, businessTz)}</span>
      ),
    },
  ];

  if (error) {
    return (
      <Card padding={false}>
        <CardHeader title={translate("leave.historySummary")} />
        <CardBody>
          <ErrorState message={error} onRetry={onRetry} />
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <div className={cn(leaveDesktopTableClass())}>
        <Card padding={false}>
          <CardHeader title={translate("leave.historySummary")} />
          <CardBody className="!p-0">
            {loading && rows.length === 0 ? (
              <DataTable loading columns={columns} data={[]} keyExtractor={(r) => r.id} stickyHeader />
            ) : rows.length === 0 ? (
              <EmptyState
                title={translate("leave.noLeaveHistory")}
                description={translate("leave.historyWillAppear")}
                className="m-4 border-0"
              />
            ) : (
              <DataTable
                columns={columns}
                data={rows}
                keyExtractor={(r) => r.id}
                stickyHeader
                emptyMessage={translate("leave.noLeaveHistoryMessage")}
              />
            )}
          </CardBody>
        </Card>
      </div>

      <section
        className={cn(leaveMobileCardsClass())}
        aria-label={translate("leave.historySummary")}
      >
        <h2 className="ds-h3 text-sm" style={{ color: "var(--ds-color-text-primary)" }}>
          {translate("leave.historySummary")}
        </h2>
        {loading && rows.length === 0 ? (
          <DataTable
            columns={[{ key: "loading", header: translate("common.loading") }]}
            data={[]}
            loading
            keyExtractor={() => "loading"}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title={translate("leave.noLeaveHistory")}
            description={translate("leave.historyWillAppear")}
          />
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => {
              const formatted = formatLeaveStatus(row.status);
              return (
                <li key={row.id} className="min-w-0">
                  <Card padding={false} className="overflow-hidden">
                    <CardBody className="space-y-3">
                      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                        <Badge variant="default">{leaveTypeLabel(row.leave_type)}</Badge>
                        <Badge variant={formatted.variant}>{formatted.label}</Badge>
                      </div>
                      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                        <div className="min-w-0">
                          <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("leave.startDateTitle")}</dt>
                          <dd className="mt-0.5" style={{ color: "var(--ds-color-text-primary)" }}>
                            {row.start_date}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("leave.endDateTitle")}</dt>
                          <dd className="mt-0.5" style={{ color: "var(--ds-color-text-primary)" }}>
                            {row.end_date}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("leave.duration")}</dt>
                          <dd className="mt-0.5" style={{ color: "var(--ds-color-text-primary)" }}>
                            {translate("leave.durationDays", { values: { count: row.total_days } })}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("leave.requestedOn")}</dt>
                          <dd className="mt-0.5 break-words tabular-nums" style={{ color: "var(--ds-color-text-primary)" }}>
                            {requestedOn(row, businessTz)}
                          </dd>
                        </div>
                      </dl>
                    </CardBody>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
