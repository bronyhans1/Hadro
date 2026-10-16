"use client";

import React from "react";
import { m, useReducedMotion } from "motion/react";
import { cn } from "@/lib/design-system/cn";
import { motionVariants, staggerContainer, staggerItem, tableReveal } from "@/lib/motion";
import { rowClickShouldOpen } from "@/lib/ui/rowActivation";
import { EmptyState } from "./EmptyState";
import { SkeletonTable } from "./Skeleton";
import { translate } from "@/lib/i18n";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: "start" | "center" | "end";
  headerClassName?: string;
  cellClassName?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
  ariaLabel?: string;
  className?: string;
  loading?: boolean;
  stickyHeader?: boolean;
  staggerRows?: boolean;
  selectedKeys?: Set<string>;
  onRowClick?: (row: T) => void;
  rowAriaLabel?: (row: T) => string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = translate("common.noData"),
  emptyDescription,
  emptyIcon,
  emptyAction,
  ariaLabel = translate("common.dataTable"),
  className = "",
  loading = false,
  stickyHeader = false,
  staggerRows = false,
  selectedKeys,
  onRowClick,
  rowAriaLabel,
}: DataTableProps<T>) {
  const reduced = useReducedMotion();

  if (loading) {
    return <SkeletonTable rows={5} cols={columns.length} className={className} />;
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyMessage}
        description={emptyDescription}
        icon={emptyIcon}
        action={emptyAction}
        className={className}
      />
    );
  }

  return (
    <m.div
      className={cn("overflow-x-auto rounded-xl border", className)}
      variants={motionVariants(reduced, tableReveal)}
      initial="hidden"
      animate="visible"
      style={{
        borderColor: "var(--ds-color-border)",
        boxShadow: "var(--ds-shadow-card)",
        background: "var(--ds-color-surface)",
      }}
    >
      <table
        className="min-w-full text-left text-sm"
        style={{ color: "var(--ds-color-text-primary)" }}
        aria-label={ariaLabel}
      >
        <thead
          className={cn(stickyHeader && "sticky top-0 z-10")}
          style={{ background: "var(--ds-color-surface-muted)" }}
        >
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  "border-b px-4 py-3.5 text-xs font-semibold uppercase tracking-wide",
                  (col.align === "end" || col.key === "actions") && "text-right",
                  col.align === "center" && "text-center",
                  col.headerClassName
                )}
                style={{
                  borderColor: "var(--ds-color-border)",
                  color: "var(--ds-color-text-muted)",
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <m.tbody
          variants={!reduced && staggerRows && data.length <= 20 ? staggerContainer : undefined}
          initial={!reduced && staggerRows && data.length <= 20 ? "hidden" : false}
          animate="visible"
        >
          {data.map((row) => {
            const key = keyExtractor(row);
            const selected = selectedKeys?.has(key);
            return (
              <m.tr
                key={key}
                variants={!reduced && staggerRows && data.length <= 20 ? staggerItem : undefined}
                className={cn(
                  "transition-colors",
                  onRowClick &&
                    "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ds-ring-focus)]",
                  selected && "bg-[var(--ds-color-primary-muted)]"
                )}
                style={{
                  borderBottom: "1px solid var(--ds-color-border)",
                  transitionDuration: "var(--ds-duration-fast)",
                }}
                tabIndex={onRowClick ? 0 : undefined}
                aria-label={onRowClick ? rowAriaLabel?.(row) : undefined}
                aria-selected={selected || undefined}
                onClick={
                  onRowClick
                    ? (event) => {
                        if (!rowClickShouldOpen(event.target)) return;
                        onRowClick(row);
                      }
                    : undefined
                }
                onKeyDown={
                  onRowClick
                    ? (event) => {
                        if (event.target !== event.currentTarget) return;
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                onMouseEnter={(e) => {
                  if (!selected) e.currentTarget.style.background = "var(--ds-color-nav-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = selected
                    ? "var(--ds-color-primary-muted)"
                    : "transparent";
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3.5 align-middle",
                      (col.align === "end" || col.key === "actions") && "text-right",
                      col.align === "center" && "text-center",
                      col.cellClassName
                    )}
                  >
                    {col.render
                      ? col.render(row)
                      : ((row as Record<string, unknown>)[col.key] as React.ReactNode)}
                  </td>
                ))}
              </m.tr>
            );
          })}
        </m.tbody>
      </table>
    </m.div>
  );
}
