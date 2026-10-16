"use client";

import type { ReactNode } from "react";
import type { PayrollPeriod } from "@/lib/api/payrollPeriod.api";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { periodStatusBadge, payrollReadinessLabel } from "@/lib/payroll/payrollPeriodStatus";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { PayrollWorkflowActions } from "./PayrollWorkflowActions";
import { getActiveLocale, translate } from "@/lib/i18n";
import type { PayrollPeriodCardSummary } from "./PayrollPeriodInfoCard";

function formatGeneratedAt(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(getActiveLocale());
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 text-sm">
      <span style={{ color: "var(--ds-color-text-muted)" }}>{label}</span>
      <span className="text-right font-medium" style={{ color: "var(--ds-color-text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

type WorkflowAction =
  | "submit"
  | "approve"
  | "lock"
  | "unlock"
  | "close"
  | "reopen"
  | "regenerate";

interface PayrollCurrentPeriodCardProps {
  period: PayrollPeriod | null;
  periodLabel: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  summary: PayrollPeriodCardSummary;
  currencyCode: "GHS" | "USD";
  healthStatus?: string | null;
  workflowLoading?: WorkflowAction | null;
  isPayrollAdmin?: boolean;
  onSubmitForReview?: () => void;
  onApprove?: () => void;
  onLock?: () => void;
  onUnlock?: () => void;
  onClose?: () => void;
  onReopen?: () => void;
  onRegenerate?: () => void;
}

export function PayrollCurrentPeriodCard({
  period,
  periodLabel,
  loading,
  error,
  onRetry,
  summary,
  currencyCode,
  healthStatus,
  workflowLoading = null,
  isPayrollAdmin = false,
  onSubmitForReview,
  onApprove,
  onLock,
  onUnlock,
  onClose,
  onReopen,
  onRegenerate,
}: PayrollCurrentPeriodCardProps) {
  if (loading && !period) {
    return <LoadingState message={translate("payroll.loadingPayrollPeriod")} className="min-h-[160px]" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  const displayLabel = period?.period_label ?? periodLabel;
  const notes = period?.notes?.trim() ? period.notes.trim() : translate("payroll.none");
  const wasPreviouslyReopened = Boolean(period?.reopened_at);

  return (
    <Card padding={false}>
      <CardBody className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="ds-caption uppercase tracking-wide">{translate("payroll.currentPayrollPeriod")}</p>
            <p className="ds-h2 mt-1 text-xl font-semibold">{displayLabel}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {periodStatusBadge(period?.status ?? "draft")}
            {wasPreviouslyReopened ? <Badge variant="warning">{translate("payroll.previouslyReopened")}</Badge> : null}
            {healthStatus ? (
              <Badge variant="info">{payrollReadinessLabel(healthStatus, healthStatus)}</Badge>
            ) : null}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <InfoRow label={translate("payroll.businessTimezoneSentence")} value={period?.business_timezone ?? "—"} />
            <InfoRow label={translate("payroll.generated")} value={formatGeneratedAt(period?.generated_at)} />
            <InfoRow
              label={translate("payroll.generatedBySentence")}
              value={period?.generated_by_name ?? (period?.generated_by ? "—" : translate("payroll.system"))}
            />
          </div>
          <div className="space-y-2">
            <InfoRow label={translate("payroll.employeesThisMonth")} value={String(summary.employeesIncluded)} />
            <InfoRow label={translate("payroll.payrollRecordsSentence")} value={String(summary.payrollRecordCount)} />
            <InfoRow
              label={translate("payroll.grossPayrollSentence")}
              value={formatCurrency(summary.grossPayroll, currencyCode)}
            />
          </div>
          <div className="space-y-2">
            <InfoRow label={translate("payroll.created")} value={formatGeneratedAt(period?.created_at)} />
            <InfoRow label={translate("payroll.updated")} value={formatGeneratedAt(period?.updated_at)} />
            <InfoRow label={translate("payroll.notes")} value={notes} />
          </div>
        </div>

        {(period?.submitted_for_review_at ||
          period?.approved_at ||
          period?.locked_at ||
          period?.closed_at ||
          period?.reopened_at) ? (
          <div
            className="grid gap-4 border-t pt-4 sm:grid-cols-2"
            style={{ borderColor: "var(--ds-color-border)" }}
          >
            {period?.submitted_for_review_at ? (
              <InfoRow
                label={translate("payroll.submittedForReview")}
                value={formatGeneratedAt(period.submitted_for_review_at)}
              />
            ) : null}
            {period?.submitted_by_name ? (
              <InfoRow label={translate("payroll.submittedBySentence")} value={period.submitted_by_name} />
            ) : null}
            {period?.approved_at ? (
              <InfoRow label={translate("payroll.approved")} value={formatGeneratedAt(period.approved_at)} />
            ) : null}
            {period?.approved_by_name ? (
              <InfoRow label={translate("payroll.approvedBySentence")} value={period.approved_by_name} />
            ) : null}
            {period?.locked_at ? (
              <InfoRow label={translate("payroll.lockedLabel")} value={formatGeneratedAt(period.locked_at)} />
            ) : null}
            {period?.locked_by_name ? (
              <InfoRow label={translate("payroll.lockedBySentence")} value={period.locked_by_name} />
            ) : null}
            {period?.closed_at ? (
              <InfoRow label={translate("payroll.archivedLabel")} value={formatGeneratedAt(period.closed_at)} />
            ) : null}
            {period?.closed_by_name ? (
              <InfoRow label={translate("payroll.archivedByLabel")} value={period.closed_by_name} />
            ) : null}
            {period?.reopened_at ? (
              <InfoRow label={translate("payroll.reopened")} value={formatGeneratedAt(period.reopened_at)} />
            ) : null}
            {period?.reopened_by_name ? (
              <InfoRow label={translate("payroll.reopenedBySentence")} value={period.reopened_by_name} />
            ) : null}
            {period?.reopen_reason ? (
              <InfoRow
                label={translate("payroll.reopenReasonSentence")}
                value={period.reopen_reason_label ?? period.reopen_reason}
              />
            ) : null}
          </div>
        ) : null}

        <div className="border-t pt-4" style={{ borderColor: "var(--ds-color-border)" }}>
          <p className="ds-caption mb-3 uppercase tracking-wide">{translate("payroll.periodActions")}</p>
          <PayrollWorkflowActions
            periodStatus={period?.status}
            workflowLoading={workflowLoading}
            isPayrollAdmin={isPayrollAdmin}
            onSubmitForReview={onSubmitForReview}
            onApprove={onApprove}
            onLock={onLock}
            onUnlock={onUnlock}
            onClose={onClose}
            onReopen={onReopen}
            onRegenerate={onRegenerate}
          />
        </div>
      </CardBody>
    </Card>
  );
}
