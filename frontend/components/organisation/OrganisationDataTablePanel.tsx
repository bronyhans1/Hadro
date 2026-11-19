"use client";

import React from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  organisationDesktopTableClass,
  organisationMobileCardsClass,
  splitOrganisationTableColumns,
} from "@/lib/organisation/organisationMobileLayout";
import { cn } from "@/lib/design-system/cn";

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface OrganisationDataTablePanelProps<T> {
  title: string;
  columns: Column<T>[];
  rows: T[];
  keyExtractor: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyMessage?: string;
  /** When true, render EmptyState instead of the dual table/cards. */
  isEmpty?: boolean;
}

export function OrganisationDataTablePanel<T>({
  title,
  columns,
  rows,
  keyExtractor,
  emptyTitle,
  emptyDescription,
  emptyMessage,
  isEmpty,
}: OrganisationDataTablePanelProps<T>) {
  const { primary, details, actions } = splitOrganisationTableColumns(columns);
  const showEmpty = isEmpty ?? rows.length === 0;

  if (showEmpty) {
    return (
      <Card title={title}>
        <EmptyState
          title={emptyTitle}
          message={emptyMessage}
          description={emptyDescription}
        />
      </Card>
    );
  }

  return (
    <>
      <div className={cn(organisationDesktopTableClass())}>
        <Card title={title}>
          <DataTable
            columns={columns}
            data={rows}
            keyExtractor={keyExtractor}
            emptyMessage={emptyMessage}
            stickyHeader
          />
        </Card>
      </div>

      <section className={cn(organisationMobileCardsClass())} aria-label={title}>
        <h2 className="ds-h3 text-sm" style={{ color: "var(--ds-color-text-primary)" }}>
          {title}
        </h2>
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={keyExtractor(row)} className="min-w-0">
              <Card padding={false} className="overflow-hidden">
                <CardBody className="space-y-3">
                  {primary ? (
                    <div className="min-w-0">
                      {primary.render ? (
                        primary.render(row)
                      ) : (
                        <p className="font-semibold" style={{ color: "var(--ds-color-text-primary)" }}>
                          {primary.header}
                        </p>
                      )}
                    </div>
                  ) : null}
                  {details.length > 0 ? (
                    <dl className="grid grid-cols-1 gap-y-2 text-xs sm:grid-cols-2 sm:gap-x-3">
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
                    <div className="flex flex-wrap gap-2 pt-1 [&>div]:flex [&>div]:w-full [&>div]:justify-start [&>div]:gap-2">
                      {actions.render(row)}
                    </div>
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
