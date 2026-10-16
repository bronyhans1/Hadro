"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import type { PayrollHealthResponse } from "@/lib/api/payroll.api";
import type { PayrollPeriodStatus } from "@/lib/api/payrollPeriod.api";
import { payrollReadinessLabel } from "@/lib/payroll/payrollPeriodStatus";
import { payrollHealthWarnings, translate } from "@/lib/i18n";

function CountRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span style={{ color: "var(--ds-color-text-muted)" }}>{label}</span>
      <span className="font-medium tabular-nums" style={{ color: "var(--ds-color-text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

function healthReadinessBadge(status: PayrollHealthResponse["readiness"]["status"], label: string) {
  if (status === "ready") return <Badge variant="success">{label}</Badge>;
  if (status === "needs_review") return <Badge variant="warning">{label}</Badge>;
  return <Badge variant="danger">{label}</Badge>;
}

interface PayrollHealthSectionProps {
  health: PayrollHealthResponse | null;
  periodStatus?: PayrollPeriodStatus | null;
  wasPreviouslyReopened?: boolean;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function PayrollHealthSection({
  health,
  periodStatus,
  wasPreviouslyReopened,
  loading,
  error,
  onRetry,
}: PayrollHealthSectionProps) {
  if (loading && !health) {
    return <LoadingState message={translate("payroll.loadingPayrollHealth")} className="min-h-[120px]" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (!health) return null;

  const status = (periodStatus ?? "draft").toLowerCase();
  const normalized =
    status === "review" ? "processing" : status === "closed" ? "archived" : status;
  const isLocked = normalized === "locked";
  const isArchived = normalized === "archived";
  const { counts } = health;

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card>
        <CardBody className="space-y-2 py-3">
          <p className="ds-caption uppercase tracking-wide">{translate("payroll.overallReadiness")}</p>
          <div className="flex flex-wrap items-center gap-2">
            {healthReadinessBadge(
              health.readiness.status,
              payrollReadinessLabel(health.readiness.status, health.readiness.label)
            )}
            {isLocked ? <Badge variant="default">{translate("payroll.periodLockedBadge")}</Badge> : null}
            {isArchived ? <Badge variant="default">{translate("payroll.periodArchivedBadge")}</Badge> : null}
          </div>
          {wasPreviouslyReopened ? (
            <p className="text-sm leading-snug" style={{ color: "var(--ds-color-text-muted)" }}>
              {translate("payroll.reopenedPreviously")}
            </p>
          ) : null}
          <ul className="list-inside list-disc space-y-0.5 text-sm leading-snug" style={{ color: "var(--ds-color-text-primary)" }}>
            {payrollHealthWarnings({
              draftRecords: counts.draftRecords,
              pendingManualOt: counts.pendingManualOt,
              pendingRemoteAttendance: counts.pendingRemoteAttendance,
              leaveChangesInMonth: counts.leaveChangesInMonth,
              syncFailuresInMonth: counts.syncFailuresInMonth,
            }).map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3 py-3">
          <div className="space-y-1.5">
            <p className="ds-caption uppercase tracking-wide">{translate("payroll.recordStatus")}</p>
            <CountRow label={translate("payroll.draftPayrollRecords")} value={counts.draftRecords} />
            <CountRow label={translate("payroll.approvedPayrollRecords")} value={counts.approvedRecords} />
            <CountRow label={translate("payroll.lockedPayrollRecords")} value={counts.lockedRecords} />
            <CountRow label={translate("payroll.recordsRequiringAttention")} value={counts.recordsRequiringAttention} />
          </div>
          <div className="space-y-1.5 border-t pt-3" style={{ borderColor: "var(--ds-color-border)" }}>
            <p className="ds-caption uppercase tracking-wide">{translate("payroll.operational")}</p>
            <CountRow label={translate("payroll.pendingManualOtDraft")} value={counts.pendingManualOt} />
            <CountRow label={translate("payroll.pendingRemoteAttendance")} value={counts.pendingRemoteAttendance} />
            <CountRow label={translate("payroll.leaveChangesThisMonth")} value={counts.leaveChangesInMonth} />
            <CountRow label={translate("payroll.syncErrorsMonth")} value={counts.syncFailuresInMonth} />
          </div>
          {counts.pendingRemoteAttendance > 0 || counts.pendingManualOt > 0 ? (
            <div className="flex flex-wrap gap-3 border-t pt-3 text-sm" style={{ borderColor: "var(--ds-color-border)" }}>
              {counts.pendingRemoteAttendance > 0 ? (
                <Link
                  href="/attendance/remote-review"
                  className="text-sm font-medium text-[var(--ds-color-primary)] underline-offset-4 hover:underline focus-visible:outline-none ds-focus-ring rounded"
                >
                  {translate("payroll.reviewRemoteAttendance")}
                </Link>
              ) : null}
              {counts.pendingManualOt > 0 ? (
                <Link
                  href="/payroll/manual-overtime"
                  className="text-sm font-medium text-[var(--ds-color-primary)] underline-offset-4 hover:underline focus-visible:outline-none ds-focus-ring rounded"
                >
                  {translate("payroll.viewManualOvertime")}
                </Link>
              ) : null}
            </div>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
