"use client";

import React from "react";
import type { ManualOvertimeEntry } from "@/lib/api/manualOvertime.api";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
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
  return (
    <Card padding={false}>
      <CardHeader>
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <h3 className="ds-h3 text-sm">{translate("payroll.manualOvertimeEntries")}</h3>
          {onAddEntry ? (
            <Button type="button" variant="primary" size="sm" onClick={onAddEntry}>
              {translate("payroll.addManualOt")}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardBody className="space-y-4" aria-live="polite">
        {loading ? (
          <LoadingState message={translate("payroll.loadingManualOvertime")} className="min-h-[160px]" />
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : rows.length === 0 ? (
          <EmptyState
            message={
              hasFilters
                ? translate("payroll.noManualOtMatch")
                : translate("payroll.noManualOtPeriod")
            }
          />
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
  );
}
