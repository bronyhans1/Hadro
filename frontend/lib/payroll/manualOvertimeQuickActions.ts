import { canAccessAdminFeatures } from "@/lib/auth/roles";
import type { AppRole } from "@/lib/types/auth";
import { translate } from "@/lib/i18n";

export interface ManualOvertimeQuickAction {
  id: string;
  label: string;
  description: string;
  href: string;
}

export function getManualOvertimeQuickActions(roles: AppRole[] | undefined): ManualOvertimeQuickAction[] {
  const isAdmin = canAccessAdminFeatures(roles);
  const actions: ManualOvertimeQuickAction[] = [
    {
      id: "payroll-overview",
      label: translate("payroll.overviewTitle"),
      description: translate("payroll.manualOtOverviewDescription"),
      href: "/payroll",
    },
    {
      id: "attendance-history",
      label: translate("payroll.attendanceHistory"),
      description: translate("payroll.attendanceHistoryDescription"),
      href: "/attendance/history",
    },
    {
      id: "reports",
      label: translate("payroll.reports"),
      description: translate("payroll.reportsDescription"),
      href: "/reports",
    },
  ];

  if (isAdmin) {
    actions.push({
      id: "payroll-settings",
      label: translate("payroll.payrollSettings"),
      description: translate("payroll.payrollSettingsDescription"),
      href: "/settings",
    });
  }

  return actions;
}
