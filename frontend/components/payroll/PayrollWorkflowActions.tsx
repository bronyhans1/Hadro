"use client";

import type { PayrollPeriodStatus } from "@/lib/api/payrollPeriod.api";
import { Button } from "@/components/ui/Button";
import { translate } from "@/lib/i18n";

type WorkflowAction =
  | "submit"
  | "approve"
  | "lock"
  | "unlock"
  | "close"
  | "reopen"
  | "regenerate";

function normalizeStatus(status: PayrollPeriodStatus | null | undefined): string {
  const s = (status ?? "draft").toLowerCase();
  if (s === "review") return "processing";
  if (s === "closed") return "archived";
  return s;
}

interface PayrollWorkflowActionsProps {
  periodStatus: PayrollPeriodStatus | null | undefined;
  workflowLoading: WorkflowAction | null;
  /** When false, hide Payroll Administrator actions (lock/unlock/archive/reopen/regenerate). */
  isPayrollAdmin?: boolean;
  onSubmitForReview?: () => void;
  onApprove?: () => void;
  onLock?: () => void;
  onUnlock?: () => void;
  onClose?: () => void;
  onReopen?: () => void;
  onRegenerate?: () => void;
}

export function PayrollWorkflowActions({
  periodStatus,
  workflowLoading,
  isPayrollAdmin = false,
  onSubmitForReview,
  onApprove,
  onLock,
  onUnlock,
  onClose,
  onReopen,
  onRegenerate,
}: PayrollWorkflowActionsProps) {
  const status = normalizeStatus(periodStatus);
  const canSubmit = status === "draft";
  const canApprove = status === "processing";
  const canLock = status === "approved" && isPayrollAdmin;
  const canUnlock = status === "locked" && isPayrollAdmin;
  const canArchive = status === "locked" && isPayrollAdmin;
  const canReopen =
    (status === "approved" || status === "locked" || status === "archived") && isPayrollAdmin;
  const canRegenerate =
    (status === "draft" || status === "processing") && isPayrollAdmin;
  const busy = workflowLoading !== null;

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={!canSubmit || busy || !onSubmitForReview}
        onClick={onSubmitForReview}
      >
        {workflowLoading === "submit" ? "…" : translate("payroll.submitForProcessing")}
      </Button>
      <Button
        type="button"
        variant="primary"
        size="sm"
        disabled={!canApprove || busy || !onApprove}
        onClick={onApprove}
      >
        {workflowLoading === "approve" ? "…" : translate("attendance.approve")}
      </Button>
      {isPayrollAdmin ? (
        <>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!canLock || busy || !onLock}
            onClick={onLock}
          >
            {workflowLoading === "lock" ? "…" : translate("payroll.lockPayroll")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!canUnlock || busy || !onUnlock}
            onClick={onUnlock}
          >
            {workflowLoading === "unlock" ? "…" : translate("payroll.unlockPayroll")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!canArchive || busy || !onClose}
            onClick={onClose}
          >
            {workflowLoading === "close" ? "…" : translate("payroll.archivePayroll")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!canReopen || busy || !onReopen}
            onClick={onReopen}
          >
            {workflowLoading === "reopen" ? "…" : translate("payroll.reopenPayroll")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!canRegenerate || busy || !onRegenerate}
            onClick={onRegenerate}
          >
            {workflowLoading === "regenerate" ? "…" : translate("payroll.regeneratePayroll")}
          </Button>
        </>
      ) : null}
    </div>
  );
}
