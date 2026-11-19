"use client";

import React from "react";
import type { ManualOvertimeEntry } from "@/lib/api/manualOvertime.api";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import {
  payrollDesktopTableClass,
  payrollMobileCardsClass,
  splitPayrollTableColumns,
} from "@/lib/payroll/payrollMobileLayout";
import { cn } from "@/lib/design-system/cn";
import { translate } from "@/lib/i18n";

interface ManualOvertimeTableProps {
  columns: Array<{
    key: string;
    header: string;
    render?: (row: ManualOvertimeEntry) => React.ReactNode;
  }>;
  rows: ManualOvertimeEntry[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  hasFilters?: boolean;
  onAddEntry?: () => void;
}

export function ManualOvertimeTable({
  columns,
  rows,
  loading,
  error,
  onRetry,
  hasFilters,
  onAddEntry,
}: ManualOvertimeTableProps) {
  const { primary, details, actions } = splitPayrollTableColumns(columns);

  const headerActions = onAddEntry ? (
    <Button
      type="button"
      variant="primary"
      size="sm"
      className="w-full sm:w-auto"
      onClick={onAddEntry}
    >
      {translate("payroll.addManualOt")}
    </Button>
  ) : null;

  if (loading) {
    return (
      <Card padding={false}>
        <CardHeader>
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <h3 className="ds-h3 text-sm">{translate("payroll.manualOvertimeEntries")}</h3>
            {headerActions}
          </div>
        </CardHeader>
        <CardBody>
          <LoadingState message={translate("payroll.loadingManualOvertime")} className="min-h-[160px]" />
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card padding={false}>
        <CardHeader>
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <h3 className="ds-h3 text-sm">{translate("payroll.manualOvertimeEntries")}</h3>
            {headerActions}
          </div>
        </CardHeader>
        <CardBody>
          <ErrorState message={error} onRetry={onRetry} />
        </CardBody>
      </Card>
    );
  }

  const emptyMessage = hasFilters
    ? translate("payroll.noManualOtMatch")
    : translate("payroll.noManualOtPeriod");

  return (
    <>
      <div className={cn(payrollDesktopTableClass())}>
        <Card padding={false}>
          <CardHeader>
            <div className="flex w-full flex-wrap items-center justify-between gap-3">
              <h3 className="ds-h3 text-sm">{translate("payroll.manualOvertimeEntries")}</h3>
              {headerActions}
            </div>
          </CardHeader>
          <CardBody className="space-y-4" aria-live="polite">
            {rows.length === 0 ? (
              <EmptyState message={emptyMessage} />
            ) : (
              <DataTable
                columns={columns}
                data={rows}
                keyExtractor={(row) => row.id}
                stickyHeader
                emptyMessage={translate("payroll.noManualOtEntries")}
              />
            )}
          </CardBody>
        </Card>
      </div>

      <section
        className={cn(payrollMobileCardsClass())}
        aria-label={translate("payroll.manualOvertimeEntries")}
        aria-live="polite"
      >
        <div className="flex flex-col gap-3">
          <h2 className="ds-h3 text-sm" style={{ color: "var(--ds-color-text-primary)" }}>
            {translate("payroll.manualOvertimeEntries")}
          </h2>
          {headerActions}
        </div>
        {rows.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => (
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
                    {details.length > 0 ? (
                      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                        {details.map((column) => (
                          <div key={column.key} className="min-w-0">
                            <dt style={{ color: "var(--ds-color-text-muted)" }}>{column.header}</dt>
                            <dd
                              className="mt-0.5 break-words text-sm"
                              style={{ color: "var(--ds-color-text-primary)" }}
                            >
                              {column.render ? column.render(row) : null}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                    {actions?.render ? (
                      <div className="pt-1 [&>span]:flex [&>span]:w-full [&>span]:flex-wrap [&>span]:gap-2 [&>span>button]:min-w-0 [&>span>button]:flex-1 [&>button]:w-full">
                        {actions.render(row)}
                      </div>
                    ) : null}
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
