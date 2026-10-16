"use client";

import type { LeaveRequest } from "@/lib/api/leave.api";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatLeaveStatus } from "@/lib/dashboard/formatters";
import { leaveTypeLabel } from "@/lib/leave/leaveTypes";
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

  return (
    <Card padding={false}>
      <CardHeader title={translate("leave.historySummary")} />
      <CardBody className="!p-0">
        {error ? (
          <div className="p-4">
            <ErrorState message={error} onRetry={onRetry} />
          </div>
        ) : loading && rows.length === 0 ? (
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
  );
}
