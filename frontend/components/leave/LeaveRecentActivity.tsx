"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Select } from "@/components/ui/FormControls";
import { Label } from "@/components/ui/Label";
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
  return (
    <Card padding={false}>
      <CardHeader title={title} />
      <CardBody className="space-y-4">
        {description ? (
          <p className="text-sm" style={{ color: "var(--ds-color-text-muted)" }}>
            {description}
          </p>
        ) : null}

        {statusFilter ? (
          <div className="max-w-xs">
            <Label htmlFor="leave-status-filter">{statusFilter.label ?? translate("attendance.status")}</Label>
            <Select
              id="leave-status-filter"
              value={statusFilter.value}
              onChange={(e) => statusFilter.onChange(e.target.value)}
              className="mt-1"
            >
              {statusFilter.options.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        {error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : loading && rows.length === 0 ? (
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
  );
}
