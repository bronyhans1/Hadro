"use client";

import type { RemoteSessionRow } from "@/lib/api/remoteAttendance.api";
import { employeeDisplayName } from "@/lib/attendance/remoteReviewUtils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { SessionTypeBadge } from "@/components/attendance/SessionTypeBadge";
import { translate } from "@/lib/i18n";

interface RemoteReviewTableProps {
  rows: RemoteSessionRow[];
  loading?: boolean;
  actionLoading: string | null;
  formatWhen: (iso: string | null) => string;
  onApprove: (row: RemoteSessionRow) => void;
  onReject: (row: RemoteSessionRow) => void;
}

function AvatarCell({ name }: { name: string }) {
  const initial = (name[0] ?? "?").toUpperCase();
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold"
      style={{ background: "var(--ds-color-primary-muted)", color: "var(--ds-color-primary)" }}
      aria-hidden
    >
      {initial}
    </div>
  );
}

function RemoteReviewActions({
  row,
  busy,
  onApprove,
  onReject,
}: {
  row: RemoteSessionRow;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const employee = employeeDisplayName(row);
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant="success"
        disabled={busy}
        onClick={onApprove}
        aria-label={translate("attendance.approveRemoteFor", { values: { employee } })}
      >
        {translate("attendance.approve")}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="danger"
        disabled={busy}
        onClick={onReject}
        aria-label={translate("attendance.rejectRemoteFor", { values: { employee } })}
      >
        {translate("attendance.reject")}
      </Button>
    </div>
  );
}

export function RemoteReviewTable({
  rows,
  loading,
  actionLoading,
  formatWhen,
  onApprove,
  onReject,
}: RemoteReviewTableProps) {
  return (
    <Card padding={false}>
      <CardHeader title={translate("attendance.pendingReviews")} />
      <CardBody className="space-y-4">
        <p className="text-sm" style={{ color: "var(--ds-color-text-muted)" }}>
          {translate("attendance.reviewRemoteIntro")}
        </p>

        {rows.length === 0 && !loading ? (
          <EmptyState
            title={translate("attendance.noPendingReviews")}
            description={translate("attendance.noRemoteWaiting")}
          />
        ) : (
          <DataTable
            loading={loading && rows.length === 0}
            emptyMessage={translate("attendance.noRemoteRequests")}
            keyExtractor={(row) => row.id}
            data={rows}
            stickyHeader
            columns={[
              {
                key: "avatar",
                header: "",
                render: (row) => <AvatarCell name={employeeDisplayName(row)} />,
              },
              {
                key: "employee",
                header: translate("attendance.employee"),
                render: (row) => (
                  <div className="min-w-[140px]">
                    <span className="font-medium">{employeeDisplayName(row)}</span>
                    {row.employee_email ? (
                      <span
                        className="mt-0.5 block text-xs"
                        style={{ color: "var(--ds-color-text-muted)" }}
                      >
                        {row.employee_email}
                      </span>
                    ) : null}
                  </div>
                ),
              },
              {
                key: "department",
                header: translate("attendance.department"),
                render: (row) => row.department_name ?? "—",
              },
              {
                key: "branch",
                header: translate("attendance.branch"),
                render: (row) => row.branch_name ?? "—",
              },
              {
                key: "check_in",
                header: translate("attendance.clockInTime"),
                render: (row) => (
                  <span className="whitespace-nowrap text-xs tabular-nums">{formatWhen(row.check_in)}</span>
                ),
              },
              {
                key: "submitted",
                header: translate("attendance.submitted"),
                render: (row) => (
                  <span className="whitespace-nowrap text-xs tabular-nums">
                    {row.attendance_date ?? formatWhen(row.check_in)}
                  </span>
                ),
              },
              {
                key: "status",
                header: translate("attendance.status"),
                render: (row) => (
                  <SessionTypeBadge
                    attendanceMode={row.attendance_mode ?? "remote"}
                    remoteApprovalStatus={row.remote_approval_status ?? "pending"}
                  />
                ),
              },
              {
                key: "actions",
                header: translate("attendance.actions"),
                render: (row) => {
                  const busy = Boolean(actionLoading?.endsWith(row.id));
                  return (
                    <RemoteReviewActions
                      row={row}
                      busy={busy}
                      onApprove={() => onApprove(row)}
                      onReject={() => onReject(row)}
                    />
                  );
                },
              },
            ]}
          />
        )}
      </CardBody>
    </Card>
  );
}
