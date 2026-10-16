"use client";

import type { PayrollPeriodStatus } from "@/lib/api/payrollPeriod.api";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { periodStatusBadge } from "@/lib/payroll/payrollPeriodStatus";
import { getActiveLocale, translate } from "@/lib/i18n";

type PayrollSnapshotBarProps = {
  periodLabel: string;
  periodStatus: PayrollPeriodStatus | null | undefined;
  employeesIncluded: number;
  grossPayroll: number;
  currencyCode: "GHS" | "USD";
  lastLoadedAt: Date | null;
  loading?: boolean;
};

export function PayrollSnapshotBar({
  periodLabel,
  periodStatus,
  employeesIncluded,
  grossPayroll,
  currencyCode,
  lastLoadedAt,
  loading,
}: PayrollSnapshotBarProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border px-4 py-3 text-sm"
      style={{ borderColor: "var(--border-soft)", background: "var(--surface-muted)" }}
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-theme-muted">
        {translate("payroll.payrollSnapshot")}
      </span>
      <span className="font-semibold text-theme">{periodLabel}</span>
      <span className="flex items-center gap-2 text-theme-muted">
        {translate("attendance.status")}
        {periodStatusBadge(periodStatus ?? "draft")}
      </span>
      <span className="text-theme-muted">
        {translate("navigation.employees")}:{" "}
        <span className="font-medium text-theme">
          {loading ? "…" : employeesIncluded}
        </span>
      </span>
      <span className="text-theme-muted">
        {translate("payroll.grossPayroll")}:{" "}
        <span className="font-medium text-theme">
          {loading ? "…" : formatCurrency(grossPayroll, currencyCode)}
        </span>
      </span>
      {lastLoadedAt ? (
        <span className="text-xs text-theme-muted">
          {translate("payroll.lastLoaded", {
            values: { time: lastLoadedAt.toLocaleString(getActiveLocale()) },
          })}
        </span>
      ) : null}
    </div>
  );
}
