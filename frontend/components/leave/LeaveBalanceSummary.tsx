"use client";

import { Badge } from "@/components/ui/Badge";
import type { LeaveBalanceRecord } from "@/lib/api/leaveBalances.api";
import { compensationLabel, leaveTypeLabel } from "@/lib/leave/leaveTypes";
import { translate } from "@/lib/i18n";

type Props = {
  balances: LeaveBalanceRecord[];
  loading?: boolean;
  error?: string | null;
};

export function LeaveBalanceSummary({ balances, loading, error }: Props) {
  if (loading) {
    return (
      <p className="text-sm text-theme-muted">{translate("leave.loadingLeaveBalances")}</p>
    );
  }
  if (error) {
    return (
      <p className="text-sm" style={{ color: "var(--state-error-text)" }}>
        {error}
      </p>
    );
  }
  if (balances.length === 0) {
    return (
      <p className="text-sm text-theme-muted">
        {translate("leave.noBalancesContactHrLeave")}
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {balances.map((b) => (
        <div
          key={b.id}
          className="rounded-lg border p-3"
          style={{ borderColor: "var(--border-soft)", background: "var(--surface-muted)" }}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-theme">{leaveTypeLabel(b.leave_type, b.leave_type_label)}</p>
            <Badge variant={b.leave_compensation_type === "unpaid" ? "default" : "success"}>
              {compensationLabel(b.leave_compensation_type)}
            </Badge>
          </div>
          <dl className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <dt className="text-theme-muted">{translate("leave.allocated")}</dt>
              <dd className="mt-0.5 text-base font-semibold text-theme">{b.allocated_days}</dd>
            </div>
            <div>
              <dt className="text-theme-muted">{translate("leave.used")}</dt>
              <dd className="mt-0.5 text-base font-semibold text-theme">{b.used_days}</dd>
            </div>
            <div>
              <dt className="text-theme-muted">{translate("leave.remaining")}</dt>
              <dd className="mt-0.5 text-base font-semibold text-theme">{b.remaining_days}</dd>
            </div>
          </dl>
        </div>
      ))}
    </div>
  );
}
