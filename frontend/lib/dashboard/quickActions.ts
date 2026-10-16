import type { AppRole } from "@/lib/types/auth";
import {
  canAccessAdminFeatures,
  canAccessCompanyPayroll,
  canAccessManagerFeatures,
} from "@/lib/auth/roles";
import { translate } from "@/lib/i18n";

export interface DashboardQuickAction {
  href: string;
  label: string;
  description: string;
}

export function getDashboardQuickActions(opts: {
  roles: AppRole[] | undefined;
  payrollEnabled: boolean;
}): DashboardQuickAction[] {
  const { roles, payrollEnabled } = opts;
  const isManager = canAccessManagerFeatures(roles);
  const isAdmin = canAccessAdminFeatures(roles);
  const canPayroll = canAccessCompanyPayroll(roles);

  const actions: DashboardQuickAction[] = [];

  if (isManager) {
    actions.push({
      href: "/employees",
      label: translate("dashboard.addEmployee"),
      description: translate("dashboard.manageWorkforce"),
    });
  }

  actions.push({
    href: "/attendance",
    label: translate("dashboard.attendanceOverview"),
    description: translate("dashboard.viewTodaysAttendance"),
  });

  actions.push({
    href: "/leave",
    label: isManager ? translate("dashboard.reviewLeave") : translate("leave.requestLeave"),
    description: isManager ? translate("leave.pendingApprovals") : translate("dashboard.submitOrTrackLeave"),
  });

  if (payrollEnabled) {
    actions.push({
      href: "/payroll",
      label: translate("navigation.payroll"),
      description: canPayroll ? translate("dashboard.companyPayrollOverview") : translate("dashboard.yourEarnings"),
    });
  }

  if (isManager && payrollEnabled) {
    actions.push({
      href: "/payroll/manual-overtime",
      label: translate("navigation.manualOvertime"),
      description: translate("dashboard.recordOrReviewOt"),
    });
  }

  if (isManager) {
    actions.push({
      href: "/reports",
      label: translate("payroll.reports"),
      description: translate("reports.exportsAndSummaries"),
    });
  }

  if (isAdmin) {
    actions.push({
      href: "/branches",
      label: translate("navigation.branches"),
      description: translate("branches.organizationSetup"),
    });
  }

  return actions;
}
