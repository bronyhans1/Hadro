import type { ManualOvertimeEntry, ManualOvertimeEntryStatus } from "@/lib/api/manualOvertime.api";
import type { LeaveStatItem } from "@/lib/leave/leaveOverviewUtils";
import { getActiveLocale, translate } from "@/lib/i18n";

export interface ManualOvertimeOperationalItem {
  id: string;
  label: string;
  value: string;
  attention?: boolean;
}

export interface ManualOvertimeActivityItem {
  id: string;
  title: string;
  description: string;
  meta?: string;
}

function countByStatus(entries: ManualOvertimeEntry[], status: ManualOvertimeEntryStatus): number {
  return entries.filter((e) => e.status === status).length;
}

function isToday(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function daysAgo(iso: string | null | undefined, withinDays: number): boolean {
  if (!iso) return false;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  const diff = Date.now() - date.getTime();
  return diff >= 0 && diff <= withinDays * 86_400_000;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(getActiveLocale());
}

export function buildManualOvertimeSnapshot(entries: ManualOvertimeEntry[]): LeaveStatItem[] {
  const draft = countByStatus(entries, "draft");
  const approved = countByStatus(entries, "approved");
  const rejected = countByStatus(entries, "rejected");
  const totalHours = entries.reduce((sum, e) => sum + (e.hours ?? 0), 0);
  const employeeCount = new Set(entries.map((e) => e.user_id)).size;

  return [
    {
      title: translate("payroll.pendingRequests"),
      value: draft,
      subtitle: translate("payroll.draftEntries"),
    },
    {
      title: translate("payroll.approvedEntries"),
      value: approved,
      subtitle: translate("payroll.inCurrentView"),
    },
    {
      title: translate("payroll.rejectedEntries"),
      value: rejected,
      subtitle: translate("payroll.inCurrentView"),
    },
    {
      title: translate("payroll.totalHours"),
      value: totalHours.toFixed(2),
      subtitle: translate("payroll.sumForFilteredPeriod"),
    },
    {
      title: translate("employees.title"),
      value: employeeCount,
      subtitle: translate("payroll.withOvertimeEntries"),
    },
    {
      title: translate("payroll.awaitingReview"),
      value: draft,
      subtitle: draft > 0 ? translate("payroll.draftAwaitingPayroll") : translate("payroll.noneAwaiting"),
    },
  ];
}

export function buildManualOvertimeOperationalPanel(
  entries: ManualOvertimeEntry[]
): ManualOvertimeOperationalItem[] {
  const draft = countByStatus(entries, "draft");
  const recentlyApproved = entries.filter(
    (e) => e.status === "approved" && daysAgo(e.approved_at, 7)
  ).length;
  const rejectedToday = entries.filter(
    (e) => e.status === "rejected" && isToday(e.created_at)
  ).length;
  const draftWithPayroll = entries.filter((e) => e.status === "draft" && e.payroll_record_id).length;

  return [
    {
      id: "pending",
      label: translate("payroll.pendingApprovalsSentence"),
      value:
        draft === 0
          ? translate("payroll.noDraftAwaiting")
          : translate("payroll.draftEntriesInView", { count: draft }),
      attention: draft > 0,
    },
    {
      id: "recent-approved",
      label: translate("payroll.recentlyApproved"),
      value:
        recentlyApproved === 0
          ? translate("payroll.noApprovalsLast7Days")
          : translate("payroll.approvedLast7Days", { values: { count: recentlyApproved } }),
    },
    {
      id: "rejected-today",
      label: translate("payroll.rejectedToday"),
      value:
        rejectedToday === 0
          ? translate("payroll.noRejectionsToday")
          : translate("payroll.rejectedTodayCount", { values: { count: rejectedToday } }),
      attention: rejectedToday > 0,
    },
    {
      id: "draft-payroll",
      label: translate("payroll.draftPayrollImpact"),
      value:
        draftWithPayroll === 0
          ? translate("payroll.noDraftLinked")
          : translate("payroll.draftEntriesWithRecords", { count: draftWithPayroll }),
      attention: draftWithPayroll > 0,
    },
    {
      id: "awaiting-review",
      label: translate("payroll.awaitingReviewSentence"),
      value:
        draft === 0
          ? translate("payroll.allEntriesProcessed")
          : translate("payroll.awaitingReviewCount", { values: { count: draft } }),
      attention: draft > 0,
    },
  ];
}

export function buildManualOvertimeRecentActivity(
  entries: ManualOvertimeEntry[]
): ManualOvertimeActivityItem[] {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return sorted.slice(0, 10).map((entry) => {
    const name = entry.employee_name?.trim() || translate("attendance.employee");
    const statusLabel =
      entry.status === "approved"
        ? translate("leave.approved")
        : entry.status === "rejected"
          ? translate("leave.rejected")
          : entry.status === "cancelled"
            ? translate("leave.cancelled")
            : translate("payroll.draft");

    return {
      id: entry.id,
      title: `${name} — ${entry.hours.toFixed(2)}h`,
      description: `${statusLabel} · ${entry.earnings_date}${entry.reason_code ? ` · [${entry.reason_code}]` : ""}`,
      meta: formatTimestamp(entry.created_at),
    };
  });
}

export function hasManualOvertimeFilters(opts: {
  employeeFilter: string;
  statusFilter: string;
}): boolean {
  return Boolean(opts.employeeFilter || opts.statusFilter);
}
