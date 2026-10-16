import type { CurrentlyOnLeaveRow, LeaveRequest } from "@/lib/api/leave.api";
import { normalizeLeaveStatus } from "@/lib/dashboard/formatters";
import { isApprovedLeaveActive } from "@/lib/leave/leaveLifecycle";
import type { LeaveStatItem } from "@/lib/leave/leaveOverviewUtils";
import { translate } from "@/lib/i18n";

export interface LeaveOperationalItem {
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

export function buildLeaveRequestsSnapshot(
  requests: LeaveRequest[],
  activeLeaveCount: number
): LeaveStatItem[] {
  return [
    {
      title: translate("leave.pending"),
      value: countByStatus(requests, "pending"),
      subtitle: translate("leave.awaitingDecision"),
    },
    {
      title: translate("leave.approved"),
      value: countByStatus(requests, "approved"),
      subtitle: translate("leave.inCurrentView"),
    },
    {
      title: translate("leave.rejected"),
      value: countByStatus(requests, "rejected"),
      subtitle: translate("leave.inCurrentView"),
    },
    {
      title: translate("leave.cancelled"),
      value: countByStatus(requests, "cancelled"),
      subtitle: translate("leave.inCurrentView"),
    },
    {
      title: translate("leave.terminated"),
      value: countByStatus(requests, "terminated"),
      subtitle: translate("leave.inCurrentView"),
    },
    {
      title: translate("leave.activeLeave"),
      value: activeLeaveCount,
      subtitle: translate("leave.currentlyActive"),
    },
  ];
}

export function countActiveLeave(requests: LeaveRequest[], currentlyOnLeaveCount: number): number {
  if (currentlyOnLeaveCount > 0) return currentlyOnLeaveCount;
  return requests.filter((r) => isApprovedLeaveActive(r)).length;
}

export function buildLeaveOperationalPanel(
  requests: LeaveRequest[],
  currentlyOnLeave: CurrentlyOnLeaveRow[]
): LeaveOperationalItem[] {
  const pending = countByStatus(requests, "pending");
  const recentlyApproved = requests.filter(
    (r) => normalizeLeaveStatus(r.status) === "approved" && daysAgo(r.reviewed_at, 7)
  ).length;
  const recentlyRejected = requests.filter(
    (r) => normalizeLeaveStatus(r.status) === "rejected" && daysAgo(r.reviewed_at, 7)
  ).length;

  return [
    {
      id: "pending",
      label: translate("leave.pendingApprovals"),
      value:
        pending === 0
          ? translate("leave.noRequestsAwaitingReview")
          : translate("leave.requestsNeedAction", { count: pending }),
      attention: pending > 0,
    },
    {
      id: "active",
      label: translate("leave.activeLeaveLabel"),
      value:
        currentlyOnLeave.length === 0
          ? translate("leave.noEmployeesCurrentlyOnLeave")
          : translate("leave.employeesOnLeaveToday", { count: currentlyOnLeave.length }),
      attention: currentlyOnLeave.length > 0,
    },
    {
      id: "recent-approved",
      label: translate("leave.recentlyApproved"),
      value:
        recentlyApproved === 0
          ? translate("leave.noApprovalsLast7Days")
          : translate("leave.approvedLast7Days", { values: { count: recentlyApproved } }),
    },
    {
      id: "recent-rejected",
      label: translate("leave.recentlyRejected"),
      value:
        recentlyRejected === 0
          ? translate("leave.noRejectionsLast7Days")
          : translate("leave.rejectedLast7Days", { values: { count: recentlyRejected } }),
      attention: recentlyRejected > 0,
    },
  ];
}

export function hasLeaveRequestFilters(statusFilter: string): boolean {
  return Boolean(statusFilter);
}
