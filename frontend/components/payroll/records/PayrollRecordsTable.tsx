"use client";

import React from "react";
import type { PayrollRecord } from "@/lib/api/payroll.api";
import type { EmployeePayrollRollup } from "@/lib/payroll/payrollDashboardAggregates";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { DataTable } from "@/components/ui/DataTable";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { PayrollRecordsEmployeeCell } from "./PayrollRecordsEmployeeCell";
import { employeeRateTypeLabel } from "@/lib/payroll/payrollDashboardAggregates";
import { translate } from "@/lib/i18n";

type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
};

interface PayrollRecordsTableProps {
  periodLabel: string;
  rollups: EmployeePayrollRollup[];
  currencyCode: "GHS" | "USD";
  expandedEmployeeId: string | null;
  onToggleExpand: (userId: string) => void;
  recordColumns: Column<PayrollRecord>[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  shadowOvertimeNote?: string | null;
}

function RollupRows({
  row,
  currencyCode,
  expanded,
  onToggle,
  recordColumns,
}: {
  row: EmployeePayrollRollup;
  currencyCode: "GHS" | "USD";
  expanded: boolean;
  onToggle: () => void;
  recordColumns: Column<PayrollRecord>[];
}) {
  return (
    <>
      <tr
        className="cursor-pointer border-b transition-colors hover:opacity-90"
        style={{ borderColor: "var(--border-soft)" }}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        tabIndex={0}
        role="button"
        aria-expanded={expanded}
      >
        <td className="px-4 py-3">
          <PayrollRecordsEmployeeCell row={row} />
        </td>
        <td className="px-4 py-3 text-theme-muted">{employeeRateTypeLabel(row.rateType)}</td>
        <td className="px-4 py-3 text-right tabular-nums">
          {formatCurrency(row.attendanceEarnings, currencyCode)}
        </td>
        <td className="px-4 py-3 text-right tabular-nums">
          {formatCurrency(row.paidLeave, currencyCode)}
        </td>
        <td className="px-4 py-3 text-right tabular-nums">
          {formatCurrency(row.manualOt, currencyCode)}
        </td>
        <td className="px-4 py-3 text-right font-medium tabular-nums">
          {formatCurrency(row.grossPayroll, currencyCode)}
        </td>
        <td className="px-4 py-3 text-xs text-theme-muted">{row.statusSummary}</td>
        <td className="px-4 py-3 text-theme-muted" aria-label={expanded ? translate("payroll.collapse") : translate("payroll.expand")}>
          {expanded ? "▾" : "▸"}
        </td>
      </tr>
      {expanded ? (
        <tr style={{ background: "var(--surface-muted)" }}>
          <td colSpan={8} className="px-4 py-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-theme-muted">
              {translate("payroll.payrollRecordsSentence")} ({row.records.length})
            </p>
            <DataTable
              columns={recordColumns}
              data={row.records}
              keyExtractor={(r) => r.id}
              emptyMessage={translate("payroll.noRecords")}
            />
          </td>
        </tr>
      ) : null}
    </>
  );
}

export function PayrollRecordsTable({
  periodLabel,
  rollups,
  currencyCode,
  expandedEmployeeId,
  onToggleExpand,
  recordColumns,
  loading,
  error,
  onRetry,
  shadowOvertimeNote,
}: PayrollRecordsTableProps) {
  return (
    <Card padding={false}>
      <CardHeader>
        <h3 className="ds-h3 text-sm">{translate("navigation.payrollRecords")}</h3>
        <p className="mt-1 text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
          {translate("payroll.oneRowPerEmployee", { values: { period: periodLabel } })}
        </p>
      </CardHeader>
      <CardBody className="space-y-3" aria-live="polite">
        {loading ? (
          <LoadingState message={translate("payroll.loadingPayrollRecords")} className="min-h-[160px]" />
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : rollups.length === 0 ? (
          <EmptyState message={translate("payroll.noRecordsForPeriod", { values: { period: periodLabel } })} />
        ) : (
          <div
            className="overflow-x-auto rounded-xl border"
            style={{
              borderColor: "var(--border-soft)",
              boxShadow: "var(--shadow-soft)",
              background: "var(--surface)",
            }}
          >
            <table className="min-w-full text-left text-sm" style={{ color: "var(--text-primary)" }}>
              <thead className="sticky top-0 z-10" style={{ background: "var(--surface-muted)" }}>
                <tr>
                  {[
                    translate("attendance.employee"),
                    translate("payroll.rateType"),
                    translate("navigation.attendance"),
                    translate("payroll.paidLeaveSentence"),
                    translate("payroll.manualOtColumn"),
                    translate("payroll.gross"),
                    translate("attendance.status"),
                  ].map((label, index) => (
                    <th
                      key={label}
                      className={`border-b px-4 py-3.5 text-xs font-semibold uppercase tracking-wide ${
                        index > 1 && index < 6 ? "text-right" : ""
                      }`}
                      style={{ borderColor: "var(--border-soft)", color: "var(--text-muted)" }}
                    >
                      {label}
                    </th>
                  ))}
                  <th
                    className="border-b px-4 py-3.5 text-xs font-semibold uppercase tracking-wide"
                    style={{ borderColor: "var(--border-soft)", color: "var(--text-muted)" }}
                    aria-label={translate("payroll.expand")}
                  />
                </tr>
              </thead>
              <tbody>
                {rollups.map((row) => (
                  <RollupRows
                    key={row.userId}
                    row={row}
                    currencyCode={currencyCode}
                    expanded={expandedEmployeeId === row.userId}
                    onToggle={() => onToggleExpand(row.userId)}
                    recordColumns={recordColumns}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
        {shadowOvertimeNote ? (
          <p className="text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
            {shadowOvertimeNote}
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}
