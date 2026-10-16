import type { CurrentlyOnLeaveRow, LeaveRequest } from "@/lib/api/leave.api";
import type { LeaveBalanceRecord } from "@/lib/api/leaveBalances.api";
import { normalizeLeaveStatus } from "@/lib/dashboard/formatters";
import { isCurrentlyOnApprovedLeave, isApprovedLeaveActive, todayYmd } from "@/lib/leave/leaveLifecycle";
import type { LeaveStatItem } from "@/lib/leave/leaveOverviewUtils";
import { leaveTypeLabel } from "@/lib/leave/leaveTypes";
import { translate } from "@/lib/i18n";

export interface LeaveBalanceTypeCard {
  id: string;
  leaveType: string;
  leaveTypeLabel: string;
  allocated: number;
  used: number;
  remaining: number;
  percentUsed: number;
  compensation: "paid" | "unpaid";
  statusLabel: string;
  statusVariant: "success" | "warning" | "default" | "danger";
}

export interface LeaveBalanceAnalyticsItem {
  id: string;
  label: string;
  value: string;
}

export interface LeaveBalanceInsightItem {
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

export function sumBalanceField(
  balances: LeaveBalanceRecord[],
  field: "allocated_days" | "used_days" | "remaining_days"
): number {
  return balances.reduce((sum, b) => sum + b[field], 0);
}

export function buildBalanceSummaryStats(
  balances: LeaveBalanceRecord[],
  myLeave: LeaveRequest[]
): LeaveStatItem[] {
  const today = todayYmd();
  const pending = countByStatus(myLeave, "pending");
  const upcomingApproved = myLeave.filter(
    (r) => normalizeLeaveStatus(r.status) === "approved" && r.start_date > today
  ).length;
  const activeLeave = myLeave.filter((r) => isCurrentlyOnApprovedLeave(r)).length;

  return [
    {
      title: translate("leave.totalLeaveBalance"),
      value: sumBalanceField(balances, "allocated_days"),
      subtitle: translate("leave.totalAllocatedDays"),
    },
    {
      title: translate("leave.remainingLeave"),
      value: sumBalanceField(balances, "remaining_days"),
      subtitle: translate("leave.daysStillAvailable"),
    },
    {
      title: translate("leave.leaveUsed"),
      value: sumBalanceField(balances, "used_days"),
      subtitle: translate("leave.daysConsumed"),
    },
    {
      title: translate("leave.pendingLeave"),
      value: pending,
      subtitle: translate("leave.requestsAwaitingDecision"),
    },
    {
      title: translate("leave.upcomingApprovedLeave"),
      value: upcomingApproved,
      subtitle: translate("leave.approvedNotYetStarted"),
    },
    {
      title: translate("leave.activeLeave"),
      value: activeLeave,
      subtitle: translate("leave.currentlyOnApprovedLeave"),
    },
  ];
}

function balanceStatus(remaining: number, allocated: number): {
  label: string;
  variant: "success" | "warning" | "default" | "danger";
} {
  if (allocated <= 0) return { label: translate("leave.notAllocated"), variant: "default" };
  if (remaining <= 0) return { label: translate("leave.depleted"), variant: "danger" };
  if (remaining / allocated <= 0.25) return { label: translate("leave.lowBalance"), variant: "warning" };
  return { label: translate("leave.available"), variant: "success" };
}

export function buildBalanceTypeCards(balances: LeaveBalanceRecord[]): LeaveBalanceTypeCard[] {
  return balances.map((b) => {
    const allocated = b.allocated_days;
    const used = b.used_days;
    const remaining = b.remaining_days;
    const percentUsed = allocated > 0 ? Math.round((used / allocated) * 100) : 0;
    const status = balanceStatus(remaining, allocated);

    return {
      id: b.id,
      leaveType: b.leave_type,
      leaveTypeLabel: leaveTypeLabel(b.leave_type, b.leave_type_label),
      allocated,
      used,
      remaining,
      percentUsed,
      compensation: b.leave_compensation_type,
      statusLabel: status.label,
      statusVariant: status.variant,
    };
  });
}

export function buildBalanceAnalytics(
  balances: LeaveBalanceRecord[],
  myLeave: LeaveRequest[]
): LeaveBalanceAnalyticsItem[] {
  const today = todayYmd();
  const withAllocation = balances.filter((b) => b.allocated_days > 0);

  let mostUsed = "—";
  let leastUsed = "—";
  if (withAllocation.length > 0) {
    const sorted = [...withAllocation].sort((a, b) => b.used_days - a.used_days);
    mostUsed = translate("leave.typeDaysShort", {
      values: { type: leaveTypeLabel(sorted[0].leave_type, sorted[0].leave_type_label), days: sorted[0].used_days },
    });
    const least = sorted[sorted.length - 1];
    leastUsed = translate("leave.typeDaysShort", {
      values: { type: leaveTypeLabel(least.leave_type, least.leave_type_label), days: least.used_days },
    });
  }

  const upcoming = myLeave.filter(
    (r) => normalizeLeaveStatus(r.status) === "approved" && r.start_date > today
  );
  const active = myLeave.filter((r) => isCurrentlyOnApprovedLeave(r));
  const pending = countByStatus(myLeave, "pending");

  return [
    { id: "most-used", label: translate("leave.mostUsedLeaveType"), value: mostUsed },
    { id: "least-used", label: translate("leave.leastUsedLeaveType"), value: leastUsed },
    {
      id: "upcoming",
      label: translate("leave.upcomingApprovedLeaveLabel"),
      value:
        upcoming.length === 0
          ? translate("leave.noUpcomingApprovedLeave")
          : translate("leave.requestsScheduled", { count: upcoming.length }),
    },
    {
      id: "active",
      label: translate("leave.currentActiveLeave"),
      value:
        active.length === 0
          ? translate("leave.notCurrentlyOnLeave")
          : translate("leave.onLeaveUntil", { values: { date: active[0].end_date } }),
    },
    {
      id: "pending",
      label: translate("leave.pendingRequestsLabel"),
      value: pending === 0 ? translate("leave.noPendingRequests") : translate("leave.pendingRequestCount", { count: pending }),
    },
  ];
}

export function buildBalanceInsights(opts: {
  myLeave: LeaveRequest[];
  companyLeave: LeaveRequest[];
  currentlyOnLeave: CurrentlyOnLeaveRow[];
  isManager: boolean;
}): LeaveBalanceInsightItem[] {
  const { myLeave, companyLeave, currentlyOnLeave, isManager } = opts;
  const today = todayYmd();

  const upcomingMine = myLeave.filter(
    (r) => normalizeLeaveStatus(r.status) === "approved" && r.start_date > today
  );
  const recentlyCompleted = myLeave.filter(
    (r) =>
      (normalizeLeaveStatus(r.status) === "completed" ||
        normalizeLeaveStatus(r.status) === "terminated") &&
      daysAgo(r.completed_at ?? r.terminated_at, 30)
  );
  const pendingMine = countByStatus(myLeave, "pending");
  const activeMine = myLeave.filter((r) => isCurrentlyOnApprovedLeave(r)).length;
  const pendingCompany = isManager ? countByStatus(companyLeave, "pending") : 0;

  const items: LeaveBalanceInsightItem[] = [
    {
      id: "upcoming",
      label: translate("leave.upcomingLeave"),
      value:
        upcomingMine.length === 0
          ? translate("leave.noUpcomingApprovedLeave")
          : translate("leave.upcomingNextStarts", {
              values: {
                count: upcomingMine.length,
                date: upcomingMine.sort((a, b) => a.start_date.localeCompare(b.start_date))[0].start_date,
              },
            }),
    },
    {
      id: "recent-completed",
      label: translate("leave.recentlyCompletedLeave"),
      value:
        recentlyCompleted.length === 0
          ? translate("leave.noLeaveCompleted30Days")
          : translate("leave.completedLast30Days", { values: { count: recentlyCompleted.length } }),
    },
    {
      id: "pending",
      label: isManager ? translate("leave.pendingApprovalsCompany") : translate("leave.pendingRequestsLabel"),
      value:
        isManager && pendingCompany > 0
          ? translate("leave.companyRequestsNeedReview", { count: pendingCompany })
          : pendingMine === 0
            ? translate("leave.noPendingRequests")
            : translate("leave.pendingRequestCount", { count: pendingMine }),
      attention: isManager ? pendingCompany > 0 : pendingMine > 0,
    },
    {
      id: "active",
      label: translate("leave.activeLeaveLabel"),
      value:
        activeMine > 0
          ? translate("leave.youAreCurrentlyOnApprovedLeave")
          : isManager && currentlyOnLeave.length > 0
            ? translate("leave.employeesOnLeaveToday", { count: currentlyOnLeave.length })
            : translate("leave.notCurrentlyOnLeave"),
      attention: activeMine > 0,
    },
  ];

  return items;
}

export function sortLeaveHistory(myLeave: LeaveRequest[]): LeaveRequest[] {
  return [...myLeave].sort((a, b) => {
    const aDate = a.reviewed_at ?? a.cancelled_at ?? a.start_date;
    const bDate = b.reviewed_at ?? b.cancelled_at ?? b.start_date;
    return bDate.localeCompare(aDate);
  });
}

export function countUpcomingApproved(myLeave: LeaveRequest[]): number {
  const today = todayYmd();
  return myLeave.filter(
    (r) => normalizeLeaveStatus(r.status) === "approved" && r.start_date > today
  ).length;
}

export function countActiveApproved(myLeave: LeaveRequest[]): number {
  return myLeave.filter((r) => isApprovedLeaveActive(r)).length;
}
