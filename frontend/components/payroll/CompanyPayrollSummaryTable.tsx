"use client";

import { DataTable } from "@/components/ui/DataTable";
import type { PayrollRecord } from "@/lib/api/payroll.api";
import type { EmployeePayrollRollup } from "@/lib/payroll/payrollDashboardAggregates";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { employeeRateTypeLabel } from "@/lib/payroll/payrollDashboardAggregates";
import { translate } from "@/lib/i18n";

type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
};

type CompanyPayrollSummaryTableProps = {
  rollups: EmployeePayrollRollup[];
  currencyCode: "GHS" | "USD";
  expandedUserId: string | null;
  onToggleExpand: (userId: string) => void;
  recordColumns: Column<PayrollRecord>[];
};

export function CompanyPayrollSummaryTable({
  rollups,
  currencyCode,
  expandedUserId,
  onToggleExpand,
  recordColumns,
}: CompanyPayrollSummaryTableProps) {
  if (rollups.length === 0) {
    return (
      <div
        className="rounded-xl border py-10 text-center text-sm"
        style={{
          borderColor: "var(--border-soft)",
          background: "var(--surface-muted)",
          color: "var(--text-muted)",
        }}
      >
        {translate("payroll.noRecordsThisMonth")}
      </div>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-xl border"
      style={{
        borderColor: "var(--border-soft)",
        boxShadow: "var(--shadow-soft)",
        background: "var(--surface)",
      }}
    >
      <table className="min-w-full text-left text-sm" style={{ color: "var(--text-primary)" }}>
        <thead style={{ background: "var(--surface-muted)" }}>
          <tr>
            <th
              className="border-b px-4 py-3.5 text-xs font-semibold uppercase tracking-wide"
              style={{ borderColor: "var(--border-soft)", color: "var(--text-muted)" }}
            >
              {translate("attendance.employee")}
            </th>
            <th
              className="border-b px-4 py-3.5 text-xs font-semibold uppercase tracking-wide"
              style={{ borderColor: "var(--border-soft)", color: "var(--text-muted)" }}
            >
              {translate("payroll.rateType")}
            </th>
            <th
              className="border-b px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide"
              style={{ borderColor: "var(--border-soft)", color: "var(--text-muted)" }}
            >
              {translate("navigation.attendance")}
            </th>
            <th
              className="border-b px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide"
              style={{ borderColor: "var(--border-soft)", color: "var(--text-muted)" }}
            >
              {translate("payroll.paidLeaveSentence")}
            </th>
            <th
              className="border-b px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide"
              style={{ borderColor: "var(--border-soft)", color: "var(--text-muted)" }}
            >
              {translate("payroll.manualOtColumn")}
            </th>
            <th
              className="border-b px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide"
              style={{ borderColor: "var(--border-soft)", color: "var(--text-muted)" }}
            >
              {translate("payroll.gross")}
            </th>
            <th
              className="border-b px-4 py-3.5 text-xs font-semibold uppercase tracking-wide"
              style={{ borderColor: "var(--border-soft)", color: "var(--text-muted)" }}
            >
              {translate("attendance.status")}
            </th>
            <th
              className="border-b px-4 py-3.5 text-xs font-semibold uppercase tracking-wide"
              style={{ borderColor: "var(--border-soft)", color: "var(--text-muted)" }}
              aria-label={translate("payroll.expand")}
            />
          </tr>
        </thead>
        <tbody>
          {rollups.map((row) => {
            const expanded = expandedUserId === row.userId;
            return (
              <EmployeeRollupRows
                key={row.userId}
                row={row}
                currencyCode={currencyCode}
                expanded={expanded}
                onToggle={() => onToggleExpand(row.userId)}
                recordColumns={recordColumns}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EmployeeRollupRows({
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
          <span className="font-medium text-theme">{row.employeeName}</span>
          {row.employeeEmail && row.employeeName !== row.employeeEmail ? (
            <span className="mt-0.5 block text-xs text-theme-muted">{row.employeeEmail}</span>
          ) : null}
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
        <td className="px-4 py-3 text-theme-muted">{expanded ? "▾" : "▸"}</td>
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
