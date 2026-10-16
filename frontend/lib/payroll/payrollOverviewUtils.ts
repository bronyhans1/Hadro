import type { PayrollHealthResponse, PayrollRecord } from "@/lib/api/payroll.api";
import type { PayrollPeriod, PayrollPeriodStatus } from "@/lib/api/payrollPeriod.api";
import { getActiveLocale, translate } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { PayrollDashboardSummary } from "./payrollDashboardAggregates";
import { formatPeriodStatusLabel, payrollReadinessLabel } from "./payrollPeriodStatus";
import { isManualOvertimeEarningRecord } from "./payrollRecordCategories";

export type PayrollStatItem = {
  title: string;
  value: string;
  subtitle?: string;
};

export type PayrollInsightItem = {
  id: string;
  label: string;
  value: string;
  tone?: "default" | "warning" | "success" | "danger" | "info";
};

export type PayrollActivityItem = {
  id: string;
  title: string;
  description: string;
  meta?: string;
};

function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(getActiveLocale());
}

export function buildPayrollSnapshotStats(opts: {
  periodLabel: string;
  periodStatus: PayrollPeriodStatus | null | undefined;
  summary: PayrollDashboardSummary;
  health: PayrollHealthResponse | null;
  currencyCode: "GHS" | "USD";
  recordCount: number;
}): PayrollStatItem[] {
  const { periodLabel, periodStatus, summary, health, currencyCode, recordCount } = opts;
  const rawStatus = (periodStatus ?? "draft").toLowerCase();
  const status =
    rawStatus === "review" ? "processing" : rawStatus === "closed" ? "archived" : rawStatus;
  const totalRecords =
    (health?.counts.draftRecords ?? 0) +
    (health?.counts.approvedRecords ?? 0) +
    (health?.counts.lockedRecords ?? 0);
  const processed =
    totalRecords > 0
      ? health?.counts.lockedRecords ?? 0
      : recordCount > 0
        ? summary.employeesIncluded
        : 0;
  const progressDenom = totalRecords > 0 ? totalRecords : recordCount;
  const progressPct =
    progressDenom > 0 ? Math.round((processed / progressDenom) * 100) : 0;

  const stats: PayrollStatItem[] = [
    {
      title: translate("payroll.currentPayrollPeriod"),
      value: periodLabel,
      subtitle: formatPeriodStatusLabel(status),
    },
    {
      title: translate("payroll.employeesProcessed"),
      value: String(summary.employeesIncluded),
      subtitle: recordCount > 0 ? translate("payroll.payrollRecordCount", { values: { count: recordCount } }) : undefined,
    },
    {
      title: translate("payroll.payrollValue"),
      value: formatCurrency(summary.grossPayroll, currencyCode),
      subtitle: translate("payroll.grossPayrollSentence"),
    },
  ];

  if (health) {
    const pending =
      health.counts.draftRecords + health.counts.recordsRequiringAttention;
    stats.push({
      title: translate("payroll.pendingApprovals"),
      value: String(pending),
      subtitle: pending > 0 ? translate("payroll.draftOrNeedsAttention") : translate("payroll.nonePending"),
    });
  }

  stats.push({
    title: status === "locked" || status === "archived" ? translate("payroll.protectedPeriod") : translate("payroll.periodStatus"),
    value: status === "locked" || status === "archived" ? translate("attendance.yes") : formatPeriodStatusLabel(status),
    subtitle:
      status === "locked"
        ? translate("payroll.payrollIsLocked")
        : status === "archived"
          ? translate("payroll.periodArchived")
          : status === "approved"
            ? translate("payroll.approvedReopenRequired")
            : undefined,
  });

  if (progressDenom > 0) {
    stats.push({
      title: translate("payroll.processingProgress"),
      value: `${progressPct}%`,
      subtitle:
        totalRecords > 0
          ? translate("payroll.recordsLockedOf", {
              values: { locked: health?.counts.lockedRecords ?? 0, total: totalRecords },
            })
          : translate("payroll.employeesIncluded", { values: { count: summary.employeesIncluded } }),
    });
  }

  return stats;
}

export function buildPayrollOperationalInsights(opts: {
  period: PayrollPeriod | null;
  periodStatus: PayrollPeriodStatus | null | undefined;
  health: PayrollHealthResponse | null;
  timelineEventCount?: number;
}): PayrollInsightItem[] {
  const { period, periodStatus, health, timelineEventCount } = opts;
  const rawStatus = (periodStatus ?? period?.status ?? "draft").toLowerCase();
  const status =
    rawStatus === "review" ? "processing" : rawStatus === "closed" ? "archived" : rawStatus;
  const items: PayrollInsightItem[] = [
    {
      id: "period-status",
      label: translate("payroll.currentPeriodStatus"),
      value: formatPeriodStatusLabel(status),
      tone: status === "draft" ? "warning" : status === "processing" ? "info" : "default",
    },
  ];

  if (health) {
    const pending =
      health.counts.draftRecords + health.counts.recordsRequiringAttention;
    items.push({
      id: "pending-approvals",
      label: translate("payroll.pendingApprovalsSentence"),
      value: String(pending),
      tone: pending > 0 ? "warning" : "success",
    });
    items.push({
      id: "health-readiness",
      label: translate("payroll.payrollHealthSentence"),
      value: payrollReadinessLabel(health.readiness.status, health.readiness.label),
      tone:
        health.readiness.status === "ready"
          ? "success"
          : health.readiness.status === "needs_review"
            ? "warning"
            : "danger",
    });
  }

  items.push({
    id: "locked-period",
    label: translate("payroll.protectedPeriodSentence"),
    value: status === "locked" || status === "archived" || status === "approved" ? translate("attendance.yes") : translate("attendance.no"),
    tone: "default",
  });

  if (period?.reopened_at) {
    items.push({
      id: "reopened",
      label: translate("payroll.recentlyReopened"),
      value: formatTimestamp(period.reopened_at),
      tone: "warning",
    });
  }

  if (timelineEventCount !== undefined && timelineEventCount > 0) {
    items.push({
      id: "timeline",
      label: translate("payroll.timelineActivity"),
      value: translate("payroll.timelineEvents", { count: timelineEventCount }),
      tone: "info",
    });
  }

  if (health && health.counts.pendingManualOt > 0) {
    items.push({
      id: "manual-ot",
      label: translate("payroll.pendingManualOt"),
      value: String(health.counts.pendingManualOt),
      tone: "warning",
    });
  }

  return items;
}

export function buildPayrollRecentActivity(
  records: PayrollRecord[],
  period: PayrollPeriod | null
): PayrollActivityItem[] {
  const items: PayrollActivityItem[] = [];

  if (period) {
    const lifecycle: Array<{
      id: string;
      at: string | null;
      title: string;
      description: string;
    }> = [
      {
        id: "reopened",
        at: period.reopened_at,
        title: translate("payroll.payrollPeriodReopened"),
        description: period.reopened_by_name
          ? translate("payroll.reopenedBy", { values: { name: period.reopened_by_name } })
          : translate("payroll.periodWasReopened"),
      },
      {
        id: "closed",
        at: period.closed_at,
        title: translate("payroll.payrollPeriodArchived"),
        description: period.closed_by_name
          ? translate("payroll.archivedBy", { values: { name: period.closed_by_name } })
          : translate("payroll.periodWasArchived"),
      },
      {
        id: "locked",
        at: period.locked_at,
        title: translate("payroll.payrollPeriodLocked"),
        description: period.locked_by_name
          ? translate("payroll.lockedByName", { values: { name: period.locked_by_name } })
          : translate("payroll.periodWasLocked"),
      },
      {
        id: "approved",
        at: period.approved_at,
        title: translate("payroll.payrollPeriodApproved"),
        description: period.approved_by_name
          ? translate("payroll.approvedByName", { values: { name: period.approved_by_name } })
          : translate("payroll.periodWasApproved"),
      },
      {
        id: "submitted",
        at: period.submitted_for_review_at,
        title: translate("payroll.submittedForProcessing"),
        description: period.submitted_by_name
          ? translate("payroll.submittedByName", { values: { name: period.submitted_by_name } })
          : translate("payroll.periodSubmittedForProcessing"),
      },
      {
        id: "generated",
        at: period.generated_at,
        title: translate("payroll.payrollGenerated"),
        description: period.generated_by_name
          ? translate("payroll.generatedByName", { values: { name: period.generated_by_name } })
          : translate("payroll.payrollPeriodGenerated"),
      },
    ];

    for (const event of lifecycle) {
      if (!event.at) continue;
      items.push({
        id: `period-${event.id}`,
        title: event.title,
        description: event.description,
        meta: formatTimestamp(event.at),
      });
    }
  }

  const sortedRecords = [...records].sort((a, b) =>
    b.payroll_date.localeCompare(a.payroll_date)
  );

  for (const record of sortedRecords.slice(0, 8)) {
    const name = record.employee_name?.trim() || translate("attendance.employee");
    const typeLabel = isManualOvertimeEarningRecord(record)
      ? translate("payroll.manualOvertimeSentence")
      : record.record_type === "leave_hourly"
        ? translate("payroll.paidLeaveSentence")
        : translate("payroll.payrollRecord");
    items.push({
      id: `record-${record.id}`,
      title: translate("payroll.activityTitle", { values: { name, type: typeLabel } }),
      description: translate("payroll.payrollDateLine", { values: { date: record.payroll_date } }),
      meta: record.status ? translate("payroll.statusRaw", { values: { status: record.status } }) : undefined,
    });
  }

  return items
    .sort((a, b) => (b.meta ?? "").localeCompare(a.meta ?? ""))
    .slice(0, 12);
}
