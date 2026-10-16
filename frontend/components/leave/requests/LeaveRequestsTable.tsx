"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { translate } from "@/lib/i18n";

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface LeaveRequestsTableProps<T> {
  title: string;
  description?: string;
  columns: Column<T>[];
  rows: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  hasFilters?: boolean;
}

export function LeaveRequestsTable<T>({
  title,
  description,
  columns,
  rows,
  keyExtractor,
  loading,
  error,
  onRetry,
  hasFilters,
}: LeaveRequestsTableProps<T>) {
  const emptyTitle = hasFilters ? translate("leave.noRequestsMatchFilters") : translate("leave.noLeaveRequests");
  const emptyDescription = hasFilters
    ? translate("leave.tryAdjustingFilter")
    : translate("leave.requestsAppearOnceSubmitted");

  return (
    <Card padding={false}>
      <CardHeader title={title} />
      <CardBody className="!p-0">
        {description ? (
          <p className="px-4 pb-4 pt-2 text-sm" style={{ color: "var(--ds-color-text-muted)" }}>
            {description}
          </p>
        ) : null}

        {error ? (
          <div className="p-4">
            <ErrorState message={error} onRetry={onRetry} />
          </div>
        ) : loading && rows.length === 0 ? (
          <DataTable loading columns={columns} data={[]} keyExtractor={keyExtractor} stickyHeader />
        ) : rows.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} className="m-4 border-0" />
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            keyExtractor={keyExtractor}
            stickyHeader
            emptyMessage={emptyDescription}
          />
        )}
      </CardBody>
    </Card>
  );
}
