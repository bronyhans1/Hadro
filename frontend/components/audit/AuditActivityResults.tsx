"use client";

import React from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  auditDesktopTableClass,
  auditMobileCardsClass,
  splitAuditTableColumns,
} from "@/lib/audit/auditMobileLayout";
import { cn } from "@/lib/design-system/cn";
import { translate } from "@/lib/i18n";

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface AuditActivityResultsProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyExtractor: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyMessage?: string;
  isEmpty?: boolean;
  filteredEmpty?: boolean;
}

export function AuditActivityResults<T>({
  columns,
  rows,
  keyExtractor,
  emptyTitle,
  emptyDescription,
  emptyMessage,
  isEmpty,
  filteredEmpty,
}: AuditActivityResultsProps<T>) {
  if (isEmpty) {
    return (
      <EmptyState
        title={emptyTitle ?? translate("audit.noActivityYet")}
        description={emptyDescription ?? translate("audit.activityWillAppear")}
      />
    );
  }

  if (filteredEmpty || rows.length === 0) {
    return <EmptyState message={translate("audit.noEventsMatchFilters")} />;
  }

  const { primary, details } = splitAuditTableColumns(columns);

  return (
    <>
      <div className={cn(auditDesktopTableClass())}>
        <DataTable
          columns={columns}
          data={rows}
          keyExtractor={keyExtractor}
          emptyMessage={emptyMessage ?? translate("common.noData")}
        />
      </div>

      <section
        className={cn(auditMobileCardsClass())}
        aria-label={translate("audit.activityLog")}
      >
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={keyExtractor(row)} className="min-w-0">
              <Card padding={false} className="overflow-hidden">
                <CardBody className="space-y-3">
                  {primary ? (
                    <div className="min-w-0 break-words text-sm font-semibold" style={{ color: "var(--ds-color-text-primary)" }}>
                      {primary.render ? primary.render(row) : primary.header}
                    </div>
                  ) : null}
                  {details.length > 0 ? (
                    <dl className="grid grid-cols-1 gap-y-2 text-xs sm:grid-cols-2 sm:gap-x-3">
                      {details.map((column) => (
                        <div
                          key={column.key}
                          className={cn("min-w-0", column.key === "metadata" || column.key === "entity_type" ? "sm:col-span-2" : "")}
                        >
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
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
