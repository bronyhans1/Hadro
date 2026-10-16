"use client";

import React from "react";
import type { PayrollRecord } from "@/lib/api/payroll.api";
import type { EmployeePayrollRollup } from "@/lib/payroll/payrollDashboardAggregates";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { CompanyPayrollSummaryTable } from "./CompanyPayrollSummaryTable";
import { translate } from "@/lib/i18n";

interface PayrollCompanySummarySectionProps {
  periodLabel: string;
  rollups: EmployeePayrollRollup[];
  currencyCode: "GHS" | "USD";
  expandedEmployeeId: string | null;
  onToggleExpand: (userId: string) => void;
  recordColumns: Array<{
    key: string;
    header: string;
    render?: (r: PayrollRecord) => React.ReactNode;
  }>;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  shadowOvertimeNote?: string | null;
}

export function PayrollCompanySummarySection({
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
}: PayrollCompanySummarySectionProps) {
  return (
    <div id="payroll-company-summary">
      <Card className="!p-0 overflow-hidden" padding={false}>
        {loading && rollups.length === 0 ? (
          <LoadingState message={translate("payroll.loadingCompanyPayroll")} className="min-h-[120px]" />
        ) : error ? (
          <div className="p-4">
            <ErrorState message={error} onRetry={onRetry} />
          </div>
        ) : (
          <CompanyPayrollSummaryTable
            rollups={rollups}
            currencyCode={currencyCode}
            expandedUserId={expandedEmployeeId}
            onToggleExpand={onToggleExpand}
            recordColumns={recordColumns}
          />
        )}
      </Card>
      {shadowOvertimeNote ? (
        <p className="mt-2 text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
          {shadowOvertimeNote}
        </p>
      ) : null}
      <p className="mt-2 text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
        {translate("payroll.oneRowPerEmployee", { values: { period: periodLabel } })}
      </p>
    </div>
  );
}
