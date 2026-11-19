"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import {
  attendanceDesktopTableClass,
  attendanceMobileCardsClass,
} from "@/lib/attendance/attendanceMobileLayout";
import { cn } from "@/lib/design-system/cn";
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
  const primaryColumn = columns[0];
  const detailColumns = columns.slice(1);

  return (
    <>
      <div className={cn(attendanceDesktopTableClass())}>
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
      </div>

      <section className={cn(attendanceMobileCardsClass())} aria-label={title}>
        <h2 className="ds-h3 text-sm" style={{ color: "var(--ds-color-text-primary)" }}>
          {title}
        </h2>
        {loading && rows.length === 0 ? (
          <DataTable
            columns={[{ key: "loading", header: translate("common.loading") }]}
            data={[]}
            loading
            keyExtractor={() => "loading"}
          />
        ) : rows.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => (
              <li key={keyExtractor(row)} className="min-w-0">
                <Card padding={false} className="overflow-hidden">
                  <CardBody className="space-y-3">
                    {primaryColumn ? (
                      <div className="min-w-0">
                        {primaryColumn.render ? (
                          primaryColumn.render(row)
                        ) : (
                          <p className="font-semibold" style={{ color: "var(--ds-color-text-primary)" }}>
                            {primaryColumn.header}
                          </p>
                        )}
                      </div>
                    ) : null}
                    {detailColumns.length > 0 ? (
                      <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
                        {detailColumns.map((col) => (
                          <div key={col.key} className="min-w-0">
                            <dt className="text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
                              {col.header}
                            </dt>
                            <dd
                              className="mt-0.5 break-words text-sm"
                              style={{ color: "var(--ds-color-text-primary)" }}
                            >
                              {col.render ? col.render(row) : null}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        )}
        {refreshing ? (
          <LoadingState message={translate("attendance.refreshing")} className="py-2" />
        ) : null}
      </section>
    </>
  );
}
