"use client";

import type { CurrentlyOnLeaveRow } from "@/lib/api/leave.api";
import { employeeLeaveName } from "@/lib/leave/leaveOverviewUtils";
import { leaveTypeLabel } from "@/lib/leave/leaveTypes";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { translate } from "@/lib/i18n";

interface LeaveWorkforceSectionProps {
  rows: CurrentlyOnLeaveRow[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

function WorkforceAvatar({ name }: { name: string }) {
  const initial = (name[0] ?? "?").toUpperCase();
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
      style={{ background: "var(--ds-color-primary-muted)", color: "var(--ds-color-primary)" }}
      aria-hidden
    >
      {initial}
    </div>
  );
}

export function LeaveWorkforceSection({
  rows,
  loading,
  error,
  onRetry,
}: LeaveWorkforceSectionProps) {
  return (
    <Card padding={false}>
      <CardHeader title={translate("leave.workforceLeaveStatus")} />
      <CardBody>
        <p className="mb-4 text-sm" style={{ color: "var(--ds-color-text-muted)" }}>
          Employees with approved leave covering today.
        </p>

        {loading ? (
          <LoadingState message={translate("leave.loadingEmployeesOnLeave")} className="min-h-[120px]" />
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : rows.length === 0 ? (
          <EmptyState
            title={translate("leave.noOneOnLeave")}
            description={translate("leave.noEmployeesOnApprovedLeave")}
          />
        ) : (
          <ul className="space-y-2" role="list" aria-label={translate("leave.employeesOnLeaveAria")}>
            {rows.map((row) => {
              const name = employeeLeaveName(row);
              return (
                <li
                  key={row.id}
                  className="flex items-center gap-3 rounded-lg border px-3 py-3 transition-colors hover:bg-[var(--ds-color-surface-muted)]"
                  style={{ borderColor: "var(--ds-color-border)" }}
                >
                  <WorkforceAvatar name={name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: "var(--ds-color-text-primary)" }}>
                      {name}
                    </p>
                    <p className="truncate text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
                      {row.department ?? translate("attendance.noDepartment")} · {row.start_date} → {row.end_date}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant="warning">{leaveTypeLabel(row.leave_type)}</Badge>
                    <span className="text-xs tabular-nums" style={{ color: "var(--ds-color-text-muted)" }}>
                      {translate("leave.daysLeft", { count: row.days_remaining })}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
