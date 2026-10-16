"use client";

import React from "react";
import type { PayrollRecord } from "@/lib/api/payroll.api";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { translate } from "@/lib/i18n";

interface PayrollRecordsMyTableProps {
  periodLabel: string;
  records: PayrollRecord[];
  columns: Array<{
    key: string;
    header: string;
    render?: (row: PayrollRecord) => React.ReactNode;
  }>;
  currencyCode: "GHS" | "USD";
  totalHours: number;
  totalGross: number;
  totalLate: number;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  helpText?: string;
}

export function PayrollRecordsMyTable({
  periodLabel,
  records,
  columns,
  currencyCode,
  totalHours,
  totalGross,
  totalLate,
  loading,
  error,
  onRetry,
  helpText,
}: PayrollRecordsMyTableProps) {
  return (
    <Card padding={false}>
      <CardHeader>
        <h3 className="ds-h3 text-sm">{translate("payroll.myPayrollRecords")}</h3>
        <p className="mt-1 text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
          {helpText ?? translate("payroll.yourRecordsForPeriod", { values: { period: periodLabel } })}
        </p>
      </CardHeader>
      <CardBody className="space-y-3" aria-live="polite">
        {loading ? (
          <LoadingState message={translate("payroll.loadingYourPayrollRecords")} className="min-h-[160px]" />
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : records.length === 0 ? (
          <EmptyState message={translate("payroll.noRecordsForPeriod", { values: { period: periodLabel } })} />
        ) : (
          <>
            <p className="text-sm text-theme-muted">
              {translate("payroll.totalHoursPayable", {
                values: {
                  hours: Math.round(totalHours * 100) / 100,
                  amount: formatCurrency(totalGross, currencyCode),
                },
              })}
              {totalLate > 0 ? translate("payroll.includesLateDeductions") : null}
            </p>
            <DataTable
              columns={columns}
              data={records}
              keyExtractor={(r) => r.id}
              stickyHeader
              emptyMessage={translate("payroll.noRecords")}
            />
          </>
        )}
      </CardBody>
    </Card>
  );
}
