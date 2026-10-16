"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import * as leaveApi from "@/lib/api/leave.api";
import type { CurrentlyOnLeaveRow } from "@/lib/api/leave.api";
import { leaveTypeLabel } from "@/lib/leave/leaveTypes";
import { isApiError } from "@/lib/types/api";
import { safeApi } from "@/lib/api/safeApi";
import { toUserFacingApiError } from "@/lib/api/userFacingError";
import { translate } from "@/lib/i18n";

function employeeLabel(row: CurrentlyOnLeaveRow): string {
  return row.employee_name ?? row.employee_email ?? `${row.user_id.slice(0, 8)}…`;
}

export function CurrentlyOnLeavePanel() {
  const [rows, setRows] = useState<CurrentlyOnLeaveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const res = await safeApi(leaveApi.getCurrentlyOnLeave());
      if (isApiError(res)) {
        setError(res.error ?? translate("leave.failedLoad"));
        setRows([]);
        return;
      }
      setRows(res.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : translate("leave.failedLoad"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) {
    return <LoadingState message={translate("leave.loadingEmployeesOnLeave")} className="min-h-[120px]" />;
  }
  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }
  if (rows.length === 0) {
    return (
      <EmptyState message={translate("leave.noEmployeesOnApprovedLeave")} />
    );
  }

  const columns = [
    {
      key: "employee",
      header: translate("attendance.employee"),
      render: (r: CurrentlyOnLeaveRow) => (
        <span className="text-theme" title={r.employee_email ?? undefined}>
          {employeeLabel(r)}
        </span>
      ),
    },
    {
      key: "department",
      header: translate("attendance.department"),
      render: (r: CurrentlyOnLeaveRow) => r.department ?? "—",
    },
    {
      key: "leave_type",
      header: translate("leave.leaveType"),
      render: (r: CurrentlyOnLeaveRow) => leaveTypeLabel(r.leave_type),
    },
    { key: "start_date", header: translate("leave.start"), render: (r: CurrentlyOnLeaveRow) => r.start_date },
    { key: "end_date", header: translate("leave.end"), render: (r: CurrentlyOnLeaveRow) => r.end_date },
    {
      key: "days_remaining",
      header: translate("leave.daysRemaining"),
      render: (r: CurrentlyOnLeaveRow) => (
        <span>
          {r.days_remaining}
          {r.days_remaining === 1 ? (
            <span className="ml-1 text-theme-muted">{translate("leave.expiresToday")}</span>
          ) : r.days_remaining <= 3 ? (
            <span className="ml-1 text-theme-muted">
              {translate("leave.expiresInDays", { values: { count: r.days_remaining } })}
            </span>
          ) : null}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      keyExtractor={(r) => r.id}
      emptyMessage={translate("leave.noEmployeesOnLeave")}
    />
  );
}
