"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  leaveDesktopTableClass,
  leaveMobileCardsClass,
  splitLeaveTableColumns,
} from "@/lib/leave/leaveMobileLayout";
import { cn } from "@/lib/design-system/cn";
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

  const { primary, details, actions } = splitLeaveTableColumns(columns);

  const descriptionBlock = description ? (
    <p className="text-sm" style={{ color: "var(--ds-color-text-muted)" }}>
      {description}
    </p>
  ) : null;

  if (error) {
    return (
      <Card padding={false}>
        <CardHeader title={title} />
        <CardBody className="space-y-4">
          {descriptionBlock}
          <ErrorState message={error} onRetry={onRetry} />
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <div className={cn(leaveDesktopTableClass())}>
        <Card padding={false}>
          <CardHeader title={title} />
          <CardBody className="!p-0">
            {description ? (
              <p className="px-4 pb-4 pt-2 text-sm" style={{ color: "var(--ds-color-text-muted)" }}>
                {description}
              </p>
            ) : null}

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
          </CardBody>
        </Card>
      </div>

      <section className={cn(leaveMobileCardsClass())} aria-label={title}>
        <h2 className="ds-h3 text-sm" style={{ color: "var(--ds-color-text-primary)" }}>
          {title}
        </h2>
        {descriptionBlock}
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
