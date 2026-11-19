"use client";

import React from "react";
import type { PayrollRecord } from "@/lib/api/payroll.api";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import {
  filterPayrollMobileDetailColumns,
  payrollDesktopTableClass,
  payrollMobileCardsClass,
  splitPayrollTableColumns,
} from "@/lib/payroll/payrollMobileLayout";
import { cn } from "@/lib/design-system/cn";
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
  const { primary, details, actions } = splitPayrollTableColumns(columns);
  const mobileDetails = filterPayrollMobileDetailColumns(details);

  const totalsLine = (
    <p className="text-sm" style={{ color: "var(--ds-color-text-muted)" }}>
      {translate("payroll.totalHoursPayable", {
        values: {
          hours: Math.round(totalHours * 100) / 100,
          amount: formatCurrency(totalGross, currencyCode),
        },
      })}
      {totalLate > 0 ? translate("payroll.includesLateDeductions") : null}
    </p>
  );

  const subtitle = (
    <p className="mt-1 text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
      {helpText ?? translate("payroll.yourRecordsForPeriod", { values: { period: periodLabel } })}
    </p>
  );

  if (loading) {
    return (
      <Card padding={false}>
        <CardHeader>
          <h3 className="ds-h3 text-sm">{translate("payroll.myPayrollRecords")}</h3>
          {subtitle}
        </CardHeader>
        <CardBody>
          <LoadingState message={translate("payroll.loadingYourPayrollRecords")} className="min-h-[160px]" />
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card padding={false}>
        <CardHeader>
          <h3 className="ds-h3 text-sm">{translate("payroll.myPayrollRecords")}</h3>
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
            <h3 className="ds-h3 text-sm">{translate("payroll.myPayrollRecords")}</h3>
            {subtitle}
          </CardHeader>
          <CardBody className="space-y-3" aria-live="polite">
            {records.length === 0 ? (
              <EmptyState message={translate("payroll.noRecordsForPeriod", { values: { period: periodLabel } })} />
            ) : (
              <>
                {totalsLine}
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
      </div>

      <section
        className={cn(payrollMobileCardsClass())}
        aria-label={translate("payroll.myPayrollRecords")}
        aria-live="polite"
      >
        <div>
          <h2 className="ds-h3 text-sm" style={{ color: "var(--ds-color-text-primary)" }}>
            {translate("payroll.myPayrollRecords")}
          </h2>
          {subtitle}
        </div>
        {records.length === 0 ? (
          <EmptyState message={translate("payroll.noRecordsForPeriod", { values: { period: periodLabel } })} />
        ) : (
          <>
            {totalsLine}
            <ul className="space-y-3">
              {records.map((row) => (
                <li key={row.id} className="min-w-0">
                  <Card padding={false} className="overflow-hidden">
                    <CardBody className="space-y-3">
                      {primary ? (
                        <div className="min-w-0">
                          {primary.render ? primary.render(row) : (
                            <p className="font-semibold" style={{ color: "var(--ds-color-text-primary)" }}>
                              {primary.header}
                            </p>
                          )}
                        </div>
                      ) : null}
                      {mobileDetails.length > 0 ? (
                        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                          {mobileDetails.map((column) => (
                            <div key={column.key} className="min-w-0">
                              <dt style={{ color: "var(--ds-color-text-muted)" }}>{column.header}</dt>
                              <dd
                                className="mt-0.5 break-words text-sm tabular-nums"
                                style={{ color: "var(--ds-color-text-primary)" }}
                              >
                                {column.render ? column.render(row) : null}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      ) : null}
                      {actions?.render ? (
                        <div className="pt-1 [&>button]:w-full">
                          {actions.render(row)}
                        </div>
                      ) : null}
                    </CardBody>
                  </Card>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );
}
