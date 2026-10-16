import type { CurrentlyOnLeaveRow, LeaveRequest } from "@/lib/api/leave.api";
import type { LeaveBalanceRecord } from "@/lib/api/leaveBalances.api";
import { normalizeLeaveStatus } from "@/lib/dashboard/formatters";
import { translate } from "@/lib/i18n";

export interface LeaveStatItem {
  title: string;
  value: string | number;
  subtitle?: string;
}

export interface LeaveApprovalStatusItem {
  id: string;
  label: string;
  value: string;
  attention?: boolean;
}

function countByStatus(requests: LeaveRequest[], status: string): number {
  return requests.filter((r) => normalizeLeaveStatus(r.status) === status).length;
}

function daysAgo(iso: string | null | undefined, withinDays: number): boolean {
  if (!iso) return false;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  const diff = Date.now() - date.getTime();
  return diff >= 0 && diff <= withinDays * 86_400_000;
}

export function computeBalanceUsageLabel(balances: LeaveBalanceRecord[]): string {
  if (balances.length === 0) return "—";
  const used = balances.reduce((sum, b) => sum + b.used_days, 0);
  const allocated = balances.reduce((sum, b) => sum + b.allocated_days, 0);
  if (allocated <= 0) return translate("leave.daysUsed", { values: { used } });
  return translate("leave.daysOfAllocated", { values: { used, allocated } });
}

export function countReturningThisWeek(rows: CurrentlyOnLeaveRow[]): number {
  return rows.filter((r) => r.days_remaining > 0 && r.days_remaining <= 7).length;
}

export function buildLeaveSnapshotStats(opts: {
  isManager: boolean;
  myLeave: LeaveRequest[];
  companyLeave: LeaveRequest[];
  currentlyOnLeave: CurrentlyOnLeaveRow[];
  balances: LeaveBalanceRecord[];
}): LeaveStatItem[] {
  const { isManager, myLeave, companyLeave, currentlyOnLeave, balances } = opts;
  const requests = isManager ? companyLeave : myLeave;

  return [
    {
      title: translate("leave.pendingRequests"),
      value: countByStatus(requests, "pending"),
      subtitle: isManager ? translate("leave.awaitingReview") : translate("leave.yourPendingRequests"),
    },
    {
      title: translate("leave.approvedRequests"),
      value: countByStatus(requests, "approved"),
      subtitle: translate("leave.approvedInView"),
    },
    {
      title: translate("leave.employeesOnLeave"),
      value: isManager ? currentlyOnLeave.length : myLeave.filter((r) => normalizeLeaveStatus(r.status) === "approved").length,
      subtitle: isManager ? translate("leave.currentlyAway") : translate("leave.yourApprovedLeave"),
    },
    {
      title: translate("leave.returningThisWeek"),
      value: isManager ? countReturningThisWeek(currentlyOnLeave) : 0,
      subtitle: isManager ? translate("leave.endingWithin7Days") : translate("leave.managerViewOnly"),
    },
    {
      title: translate("leave.rejectedRequests"),
      value: countByStatus(requests, "rejected"),
      subtitle: translate("leave.inCurrentView"),
    },
    {
      title: translate("leave.leaveBalanceUsage"),
      value: computeBalanceUsageLabel(balances),
      subtitle: translate("leave.yourAllocatedLeave"),
    },
  ];
}

export function buildLeaveApprovalStatus(requests: LeaveRequest[]): LeaveApprovalStatusItem[] {
  const pending = countByStatus(requests, "pending");
  const recentlyApproved = requests.filter(
    (r) => normalizeLeaveStatus(r.status) === "approved" && daysAgo(r.reviewed_at, 7)
  ).length;
  const rejected = countByStatus(requests, "rejected");
  const cancelled = countByStatus(requests, "cancelled");

  return [
    {
      id: "pending",
      label: translate("leave.pendingApprovals"),
      value: pending === 0 ? translate("leave.noRequestsAwaitingReview") : translate("leave.requestsNeedAction", { count: pending }),
      attention: pending > 0,
    },
    {
      id: "approved",
      label: translate("leave.recentlyApproved"),
      value:
        recentlyApproved === 0
          ? translate("leave.noApprovalsLast7Days")
          : translate("leave.approvedLast7Days", { values: { count: recentlyApproved } }),
    },
    {
      id: "rejected",
      label: translate("leave.rejected"),
      value: rejected === 0 ? translate("leave.noRejectedInView") : translate("leave.rejectedRequestCount", { count: rejected }),
      attention: rejected > 0,
    },
    {
      id: "cancelled",
      label: translate("leave.cancelled"),
      value: cancelled === 0 ? translate("leave.noCancelledInView") : translate("leave.cancelledRequestCount", { count: cancelled }),
    },
  ];
}

export function employeeLeaveName(row: {
  employee_name?: string | null;
  employee_email?: string | null;
  user_id: string;
}): string {
  return row.employee_name ?? row.employee_email ?? `${row.user_id.slice(0, 8)}…`;
}
