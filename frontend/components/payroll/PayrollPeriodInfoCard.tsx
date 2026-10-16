"use client";

import type { ReactNode } from "react";
import type { PayrollPeriod } from "@/lib/api/payrollPeriod.api";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { periodStatusBadge } from "@/lib/payroll/payrollPeriodStatus";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PayrollPeriodTimeline } from "@/components/payroll/PayrollPeriodTimeline";
import { getActiveLocale, translate } from "@/lib/i18n";

function formatGeneratedAt(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(getActiveLocale());
}

export type PayrollPeriodCardSummary = {
  employeesIncluded: number;
  payrollRecordCount: number;
  grossPayroll: number;
};

type PayrollPeriodInfoCardProps = {
  period: PayrollPeriod | null;
  periodLabel: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  summary: PayrollPeriodCardSummary;
  currencyCode: "GHS" | "USD";
};

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 text-sm">
      <span className="text-theme-muted">{label}</span>
      <span className="text-right font-medium text-theme">{value}</span>
    </div>
  );
}

export function PayrollPeriodInfoCard({
  period,
  periodLabel,
  loading,
  error,
  onRetry,
  summary,
  currencyCode,
}: PayrollPeriodInfoCardProps) {
  if (loading && !period) {
    return (
      <div
        className="rounded-lg border px-4 py-6 text-sm text-theme-muted"
        style={{ borderColor: "var(--border-soft)" }}
      >
        Loading payroll period…
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-lg border px-4 py-4 text-sm"
        style={{ borderColor: "var(--border-soft)" }}
      >
        <p className="text-[var(--ds-color-danger-text)]">{error}</p>
        {onRetry ? (
          <Button type="button" variant="link" className="mt-2" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </div>
    );
  }

  const displayLabel = period?.period_label ?? periodLabel;
  const notes = period?.notes?.trim() ? period.notes.trim() : translate("payroll.none");
  const wasPreviouslyReopened = Boolean(period?.reopened_at);

  return (
    <div
      className="rounded-lg border px-4 py-4"
      style={{ borderColor: "var(--border-soft)", background: "var(--surface-muted)" }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-theme-muted">
        Payroll Period
      </p>
      {wasPreviouslyReopened ? (
        <div className="mt-2">
          <Badge variant="warning">{translate("payroll.previouslyReopened")}</Badge>
        </div>
      ) : null}
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <InfoRow label={translate("payroll.payrollMonthYear")} value={displayLabel} />
          <InfoRow
            label={translate("payroll.currentStatus")}
            value={periodStatusBadge(period?.status ?? "draft")}
          />
          <InfoRow label={translate("payroll.businessTimezone")} value={period?.business_timezone ?? "—"} />
        </div>
        <div className="space-y-2">
          <InfoRow label={translate("payroll.generatedDateTime")} value={formatGeneratedAt(period?.generated_at)} />
          <InfoRow
            label={translate("payroll.generatedBy")}
            value={period?.generated_by_name ?? (period?.generated_by ? "—" : translate("payroll.system"))}
          />
          <InfoRow label={translate("payroll.notes")} value={notes} />
        </div>
        <div className="space-y-2">
          <InfoRow label={translate("payroll.employeesThisMonth")} value={String(summary.employeesIncluded)} />
          <InfoRow label={translate("navigation.payrollRecords")} value={String(summary.payrollRecordCount)} />
          <InfoRow
            label={translate("payroll.grossPayroll")}
            value={formatCurrency(summary.grossPayroll, currencyCode)}
          />
        </div>
      </div>
      {(period?.submitted_for_review_at ||
        period?.submitted_by ||
        period?.approved_at ||
        period?.approved_by ||
        period?.locked_at ||
        period?.locked_by ||
        period?.closed_at ||
        period?.closed_by ||
        period?.reopened_at ||
        period?.reopened_by) ? (
        <div className="mt-4 grid gap-4 border-t pt-4 sm:grid-cols-2" style={{ borderColor: "var(--border-soft)" }}>
          {period?.submitted_for_review_at ? (
            <InfoRow
              label={translate("payroll.submittedAt")}
              value={formatGeneratedAt(period.submitted_for_review_at)}
            />
          ) : null}
          {period?.submitted_by ? (
            <InfoRow
              label={translate("payroll.submittedBy")}
              value={period.submitted_by_name ?? "—"}
            />
          ) : null}
          {period?.approved_at ? (
            <InfoRow label={translate("payroll.approvedAt")} value={formatGeneratedAt(period.approved_at)} />
          ) : null}
          {period?.approved_by ? (
            <InfoRow label={translate("payroll.approvedBy")} value={period.approved_by_name ?? "—"} />
          ) : null}
          {period?.locked_at ? (
            <InfoRow label={translate("payroll.lockedAt")} value={formatGeneratedAt(period.locked_at)} />
          ) : null}
          {period?.locked_by ? (
            <InfoRow label={translate("payroll.lockedBy")} value={period.locked_by_name ?? "—"} />
          ) : null}
          {period?.closed_at ? (
            <InfoRow label={translate("payroll.closedAt")} value={formatGeneratedAt(period.closed_at)} />
          ) : null}
          {period?.closed_by ? (
            <InfoRow label={translate("payroll.closedBy")} value={period.closed_by_name ?? "—"} />
          ) : null}
          {period?.reopened_at ? (
            <InfoRow label={translate("payroll.reopenedAt")} value={formatGeneratedAt(period.reopened_at)} />
          ) : null}
          {period?.reopened_by ? (
            <InfoRow label={translate("payroll.reopenedByLabel")} value={period.reopened_by_name ?? "—"} />
          ) : null}
          {period?.reopen_reason ? (
            <InfoRow
              label={translate("payroll.reopenReason")}
              value={period.reopen_reason_label ?? period.reopen_reason}
            />
          ) : null}
        </div>
      ) : null}
      <PayrollPeriodTimeline periodId={period?.id} />
    </div>
  );
}
