"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui/Badge";
import type { PayrollHealthResponse } from "@/lib/api/payroll.api";
import type { PayrollPeriodStatus } from "@/lib/api/payrollPeriod.api";
import { periodStatusBadge, payrollReadinessLabel } from "@/lib/payroll/payrollPeriodStatus";
import { payrollHealthWarnings, translate } from "@/lib/i18n";
import { Archive, CheckCircle2, Lock, RotateCcw, Send } from "lucide-react";

const STATUS_STYLES = {
  ready: {
    dot: "🟢",
    border: "var(--ds-color-success-border)",
    bg: "var(--surface-muted)",
  },
  needs_review: {
    dot: "🟡",
    border: "var(--ds-color-warning-border)",
    bg: "var(--surface-muted)",
  },
  action_required: {
    dot: "🔴",
    border: "var(--ds-color-danger-border)",
    bg: "var(--surface-muted)",
  },
} as const;

type PayrollHealthPanelProps = {
  health: PayrollHealthResponse | null;
  periodLabel: string;
  periodStatus?: PayrollPeriodStatus | null;
  wasPreviouslyReopened?: boolean;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSubmitForReview?: () => void;
  onApprove?: () => void;
  onLock?: () => void;
  onClose?: () => void;
  onReopen?: () => void;
  workflowLoading?: "submit" | "approve" | "lock" | "close" | "reopen" | null;
};

function CountRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-theme-muted">{label}</span>
      <span className="font-medium tabular-nums text-theme">{value}</span>
    </div>
  );
}

function healthReadinessBadge(status: PayrollHealthResponse["readiness"]["status"], label: string) {
  if (status === "ready") return <Badge variant="success">{label}</Badge>;
  if (status === "needs_review") return <Badge variant="warning">{label}</Badge>;
  return <Badge variant="danger">{label}</Badge>;
}

export function PayrollHealthPanel({
  health,
  periodLabel,
  periodStatus,
  wasPreviouslyReopened,
  loading,
  error,
  onRetry,
  onSubmitForReview,
  onApprove,
  onLock,
  onClose,
  onReopen,
  workflowLoading,
}: PayrollHealthPanelProps) {
  if (loading && !health) {
    return (
      <div
        className="rounded-lg border px-4 py-6 text-sm text-theme-muted"
        style={{ borderColor: "var(--border-soft)" }}
      >
        {translate("payroll.loadingPayrollHealth")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border px-4 py-4 text-sm" style={{ borderColor: "var(--border-soft)" }}>
        <p className="text-[var(--ds-color-danger-text)]">{error}</p>
        {onRetry ? (
          <Button type="button" variant="link" className="mt-2" onClick={onRetry}>
            {translate("common.retry")}
          </Button>
        ) : null}
      </div>
    );
  }

  if (!health) return null;

  const style = STATUS_STYLES[health.readiness.status];
  const { counts } = health;
  const status = (periodStatus ?? "draft").toLowerCase();
  const canSubmit = status === "draft";
  const canApprove = status === "review";
  const canLock = status === "approved";
  const canClose = status === "locked";
  const canReopen = status === "closed";
  const isLocked = status === "locked";
  const isClosed = status === "closed";

  return (
    <div className="space-y-4">
      <div
        className="rounded-lg border px-4 py-4"
        style={{ borderColor: "var(--border-soft)", background: "var(--surface-muted)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-theme-muted">
          {translate("payroll.currentPayrollPeriod")}
        </p>
        <p className="mt-2 text-lg font-semibold text-theme">{periodLabel}</p>
        <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-theme-muted">{translate("attendance.status")}</span>
            {periodStatusBadge(periodStatus ?? "draft")}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-theme-muted">{translate("payroll.health")}</span>
            {healthReadinessBadge(
              health.readiness.status,
              payrollReadinessLabel(health.readiness.status, health.readiness.label)
            )}
          </div>
        </div>
      </div>

      <div
        className="rounded-lg border-l-4 px-4 py-4"
        style={{ borderLeftColor: style.border, background: style.bg }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-theme-muted">{translate("payroll.payrollHealth")}</p>
        <p className="mt-2 text-sm text-theme-muted">{translate("payroll.overallReadiness")}</p>
        <p className="mt-1 text-lg font-semibold text-theme">
          {style.dot} {payrollReadinessLabel(health.readiness.status, health.readiness.label)}
        </p>
        {isLocked ? (
          <p className="mt-3 text-sm font-semibold text-theme">{translate("payroll.payrollLocked")}</p>
        ) : null}
        {isClosed ? (
          <p className="mt-3 text-sm font-semibold text-theme">{translate("payroll.payrollClosed")}</p>
        ) : null}
        {wasPreviouslyReopened ? (
          <p className="mt-3 text-sm text-theme-muted">
            {translate("payroll.reopenedPreviously")}
          </p>
        ) : null}
      </div>

      <div
        className="grid gap-6 rounded-lg border p-4 lg:grid-cols-2"
        style={{ borderColor: "var(--border-soft)" }}
      >
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-theme-muted">{translate("payroll.recordStatus")}</p>
          <CountRow label={translate("payroll.draftPayrollRecords")} value={counts.draftRecords} />
          <CountRow label={translate("payroll.approvedPayrollRecords")} value={counts.approvedRecords} />
          <CountRow label={translate("payroll.lockedPayrollRecords")} value={counts.lockedRecords} />
          <CountRow label={translate("payroll.recordsRequiringAttention")} value={counts.recordsRequiringAttention} />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-theme-muted">{translate("payroll.operational")}</p>
          <CountRow label={translate("payroll.pendingManualOtDraft")} value={counts.pendingManualOt} />
          <CountRow label={translate("payroll.pendingRemoteAttendance")} value={counts.pendingRemoteAttendance} />
          <CountRow label={translate("payroll.leaveChangesThisMonth")} value={counts.leaveChangesInMonth} />
          <CountRow label={translate("payroll.syncErrorsMonth")} value={counts.syncFailuresInMonth} />
        </div>
      </div>

      <div className="rounded-lg border px-4 py-3" style={{ borderColor: "var(--border-soft)" }}>
        <p className="text-xs font-semibold uppercase tracking-wide text-theme-muted">{translate("payroll.warnings")}</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-theme">
          {payrollHealthWarnings(counts).map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
        {counts.pendingRemoteAttendance > 0 ? (
          <p className="mt-3 text-xs">
            <Link
              href="/attendance/remote-review"
              className="text-sm font-medium text-[var(--ds-color-primary)] underline-offset-4 hover:underline focus-visible:outline-none ds-focus-ring rounded"
            >
              {translate("payroll.reviewRemoteAttendance")}
            </Link>
          </p>
        ) : null}
        {counts.pendingManualOt > 0 ? (
          <p className="mt-1 text-xs">
            <Link
              href="/payroll/manual-overtime"
              className="text-sm font-medium text-[var(--ds-color-primary)] underline-offset-4 hover:underline focus-visible:outline-none ds-focus-ring rounded"
            >
              {translate("payroll.viewManualOvertime")}
            </Link>
          </p>
        ) : null}
      </div>

      <div className="rounded-lg border border-dashed px-4 py-3" style={{ borderColor: "var(--border-soft)" }}>
        <p className="text-xs font-semibold uppercase tracking-wide text-theme-muted">{translate("payroll.quickActionsSentence")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!canSubmit || workflowLoading !== null || !onSubmitForReview}
            loading={workflowLoading === "submit"}
            onClick={onSubmitForReview}
            leftIcon={<Send className="h-3.5 w-3.5" aria-hidden />}
          >
            {translate("payroll.submitForReview")}
          </Button>
          <Button
            type="button"
            variant="success"
            size="sm"
            disabled={!canApprove || workflowLoading !== null || !onApprove}
            loading={workflowLoading === "approve"}
            onClick={onApprove}
            leftIcon={<CheckCircle2 className="h-3.5 w-3.5" aria-hidden />}
          >
            {translate("attendance.approve")}
          </Button>
          <Button
            type="button"
            variant="warning"
            size="sm"
            disabled={!canLock || workflowLoading !== null || !onLock}
            loading={workflowLoading === "lock"}
            onClick={onLock}
            leftIcon={<Lock className="h-3.5 w-3.5" aria-hidden />}
          >
            {translate("payroll.lockPayroll")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!canClose || workflowLoading !== null || !onClose}
            loading={workflowLoading === "close"}
            onClick={onClose}
            leftIcon={<Archive className="h-3.5 w-3.5" aria-hidden />}
          >
            {translate("payroll.closePayroll")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canReopen || workflowLoading !== null || !onReopen}
            loading={workflowLoading === "reopen"}
            onClick={onReopen}
            leftIcon={<RotateCcw className="h-3.5 w-3.5" aria-hidden />}
          >
            {translate("payroll.reopenPayroll")}
          </Button>
        </div>
      </div>
    </div>
  );
}
