"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { translate } from "@/lib/i18n";

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface AttendanceInsightResultsProps<T> {
  title: string;
  columns: Column<T>[];
  rows: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  refreshing?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function AttendanceInsightResults<T>({
  title,
  columns,
  rows,
  keyExtractor,
  loading,
  refreshing,
  emptyTitle = translate("attendance.noDataInPeriod"),
  emptyDescription = translate("attendance.tryAdjustDateRange"),
}: AttendanceInsightResultsProps<T>) {
  return (
    <Card padding={false}>
      <CardHeader title={title} />
      <CardBody className="!p-0">
        {loading && rows.length === 0 ? (
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
        {refreshing ? (
          <LoadingState message={translate("attendance.refreshing")} className="border-t py-4" />
        ) : null}
      </CardBody>
    </Card>
  );
}
