"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Select } from "@/components/ui/FormControls";
import { Label } from "@/components/ui/Label";
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

interface LeaveRecentActivityProps<T> {
  title: string;
  description?: string;
  columns: Column<T>[];
  rows: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  statusFilter?: {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    label?: string;
  };
}

export function LeaveRecentActivity<T>({
  title,
  description,
  columns,
  rows,
  keyExtractor,
  loading,
  error,
  onRetry,
  emptyTitle = translate("leave.noLeaveActivity"),
  emptyDescription = translate("leave.requestsWillAppear"),
  statusFilter,
}: LeaveRecentActivityProps<T>) {
  const { primary, details, actions } = splitLeaveTableColumns(columns);

  const filterBlock = statusFilter ? (
    <div className="w-full min-w-0 max-w-full sm:max-w-xs">
      <Label htmlFor="leave-status-filter">{statusFilter.label ?? translate("attendance.status")}</Label>
      <Select
        id="leave-status-filter"
        value={statusFilter.value}
        onChange={(e) => statusFilter.onChange(e.target.value)}
        className="mt-1 w-full"
      >
        {statusFilter.options.map((opt) => (
          <option key={opt.value || "all"} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </div>
  ) : null;

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
          {filterBlock}
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
          <CardBody className="space-y-4">
            {descriptionBlock}
            {filterBlock}
            {loading && rows.length === 0 ? (
              <DataTable loading columns={columns} data={[]} keyExtractor={keyExtractor} stickyHeader />
            ) : rows.length === 0 ? (
              <EmptyState title={emptyTitle} description={emptyDescription} />
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
        {filterBlock}
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
