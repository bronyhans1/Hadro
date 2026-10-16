import { canAccessManagerFeatures } from "@/lib/auth/roles";
import { translate } from "@/lib/i18n";
import type { AppRole } from "@/lib/types/auth";

export interface LeaveQuickAction {
  id: string;
  label: string;
  description: string;
  href?: string;
}

export function getLeaveQuickActions(opts: {
  roles: AppRole[] | undefined;
  canRequestLeave: boolean;
}): LeaveQuickAction[] {
  const { roles, canRequestLeave } = opts;
  const isManager = canAccessManagerFeatures(roles);
  const actions: LeaveQuickAction[] = [];

  actions.push({
    id: "leave-requests",
    label: translate("navigation.leaveRequests"),
    description: canRequestLeave ? translate("leave.reviewApproveAndRequest") : translate("leave.reviewAndManage"),
    href: "/leave/requests",
  });

  actions.push({
    id: "leave-calendar",
    label: translate("navigation.leaveCalendar"),
    description: translate("leave.viewApprovedSchedule"),
    href: "/leave/calendar",
  });

  actions.push({
    id: "leave-balance",
    label: translate("leave.balanceShort"),
    description: translate("leave.viewBalancesAndAnalytics"),
    href: "/leave/balance",
  });

  if (isManager) {
    actions.push({
      id: "company-holidays",
      label: translate("leave.companyHolidays"),
      description: translate("leave.managePaidHolidays"),
      href: "/settings",
    });
  }

  return actions;
}
