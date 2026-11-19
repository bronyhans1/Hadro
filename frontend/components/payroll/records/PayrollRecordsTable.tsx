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
import { Button } from "@/components/ui/Button";
import { PayrollRecordsEmployeeCell } from "./PayrollRecordsEmployeeCell";
import { employeeRateTypeLabel } from "@/lib/payroll/payrollDashboardAggregates";
import {
  filterPayrollMobileDetailColumns,
  payrollDesktopTableClass,
  payrollMobileCardsClass,
  splitPayrollTableColumns,
} from "@/lib/payroll/payrollMobileLayout";
import { cn } from "@/lib/design-system/cn";
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

function NestedRecordCards({
  records,
  recordColumns,
}: {
  records: PayrollRecord[];
  recordColumns: Column<PayrollRecord>[];
}) {
  const { primary, details, actions } = splitPayrollTableColumns(recordColumns);
  const mobileDetails = filterPayrollMobileDetailColumns(details);

  if (records.length === 0) {
    return <p className="text-sm" style={{ color: "var(--ds-color-text-muted)" }}>{translate("payroll.noRecords")}</p>;
  }

  return (
    <ul className="space-y-2">
      {records.map((row) => (
        <li key={row.id} className="min-w-0 rounded-lg border p-3" style={{ borderColor: "var(--ds-color-border)" }}>
          {primary ? (
            <div className="min-w-0">
              {primary.render ? primary.render(row) : (
                <p className="font-semibold text-sm" style={{ color: "var(--ds-color-text-primary)" }}>
                  {primary.header}
                </p>
              )}
            </div>
          ) : null}
          {mobileDetails.length > 0 ? (
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              {mobileDetails.map((column) => (
                <div key={column.key} className="min-w-0">
                  <dt style={{ color: "var(--ds-color-text-muted)" }}>{column.header}</dt>
                  <dd className="mt-0.5 break-words tabular-nums" style={{ color: "var(--ds-color-text-primary)" }}>
                    {column.render ? column.render(row) : null}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
          {actions?.render ? (
            <div className="mt-2 [&>button]:w-full">{actions.render(row)}</div>
          ) : null}
        </li>
      ))}
    </ul>
  );
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
  const subtitle = (
    <p className="mt-1 text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
      {translate("payroll.oneRowPerEmployee", { values: { period: periodLabel } })}
    </p>
  );

  if (loading) {
    return (
      <Card padding={false}>
        <CardHeader>
          <h3 className="ds-h3 text-sm">{translate("navigation.payrollRecords")}</h3>
          {subtitle}
        </CardHeader>
        <CardBody>
          <LoadingState message={translate("payroll.loadingPayrollRecords")} className="min-h-[160px]" />
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card padding={false}>
        <CardHeader>
          <h3 className="ds-h3 text-sm">{translate("navigation.payrollRecords")}</h3>
          {subtitle}
        </CardHeader>
        <CardBody>
          <ErrorState message={error} onRetry={onRetry} />
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <div className={cn(payrollDesktopTableClass())}>
        <Card padding={false}>
          <CardHeader>
            <h3 className="ds-h3 text-sm">{translate("navigation.payrollRecords")}</h3>
            {subtitle}
          </CardHeader>
          <CardBody className="space-y-3" aria-live="polite">
            {rollups.length === 0 ? (
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
      </div>

      <section
        className={cn(payrollMobileCardsClass())}
        aria-label={translate("navigation.payrollRecords")}
        aria-live="polite"
      >
        <div>
          <h2 className="ds-h3 text-sm" style={{ color: "var(--ds-color-text-primary)" }}>
            {translate("navigation.payrollRecords")}
          </h2>
          {subtitle}
        </div>
        {rollups.length === 0 ? (
          <EmptyState message={translate("payroll.noRecordsForPeriod", { values: { period: periodLabel } })} />
        ) : (
          <ul className="space-y-3">
            {rollups.map((row) => {
              const expanded = expandedEmployeeId === row.userId;
              return (
                <li key={row.userId} className="min-w-0">
                  <Card padding={false} className="overflow-hidden">
                    <CardBody className="space-y-3">
                      <PayrollRecordsEmployeeCell row={row} />
                      <p className="text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
                        {employeeRateTypeLabel(row.rateType)}
                        {row.statusSummary ? ` · ${row.statusSummary}` : ""}
                      </p>
                      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                        <div className="min-w-0">
                          <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("navigation.attendance")}</dt>
                          <dd className="mt-0.5 tabular-nums" style={{ color: "var(--ds-color-text-primary)" }}>
                            {formatCurrency(row.attendanceEarnings, currencyCode)}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("payroll.paidLeaveSentence")}</dt>
                          <dd className="mt-0.5 tabular-nums" style={{ color: "var(--ds-color-text-primary)" }}>
                            {formatCurrency(row.paidLeave, currencyCode)}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("payroll.manualOtColumn")}</dt>
                          <dd className="mt-0.5 tabular-nums" style={{ color: "var(--ds-color-text-primary)" }}>
                            {formatCurrency(row.manualOt, currencyCode)}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("payroll.gross")}</dt>
                          <dd className="mt-0.5 font-semibold tabular-nums" style={{ color: "var(--ds-color-text-primary)" }}>
                            {formatCurrency(row.grossPayroll, currencyCode)}
                          </dd>
                        </div>
                      </dl>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        aria-expanded={expanded}
                        onClick={() => onToggleExpand(row.userId)}
                      >
                        {expanded
                          ? translate("payroll.collapse")
                          : `${translate("payroll.expand")} (${row.records.length})`}
                      </Button>
                      {expanded ? (
                        <div className="space-y-2 border-t pt-3" style={{ borderColor: "var(--ds-color-border)" }}>
                          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--ds-color-text-muted)" }}>
                            {translate("payroll.payrollRecordsSentence")} ({row.records.length})
                          </p>
                          <NestedRecordCards records={row.records} recordColumns={recordColumns} />
                        </div>
                      ) : null}
                    </CardBody>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
        {shadowOvertimeNote ? (
          <p className="text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
            {shadowOvertimeNote}
          </p>
        ) : null}
      </section>
    </>
  );
}
