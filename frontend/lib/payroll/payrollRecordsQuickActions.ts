import { canAccessAdminFeatures, canAccessCompanyPayroll } from "@/lib/auth/roles";
import type { AppRole } from "@/lib/types/auth";
import { translate } from "@/lib/i18n";

export interface PayrollRecordsQuickAction {
  id: string;
  label: string;
  description: string;
  href: string;
}

export function getPayrollRecordsQuickActions(opts: {
  roles: AppRole[] | undefined;
  payrollEnabled: boolean;
}): PayrollRecordsQuickAction[] {
  const { roles, payrollEnabled } = opts;
  if (!payrollEnabled) return [];

  const canCompany = canAccessCompanyPayroll(roles);
  const isAdmin = canAccessAdminFeatures(roles);
  const actions: PayrollRecordsQuickAction[] = [
    {
      id: "payroll-overview",
      label: translate("payroll.overviewTitle"),
      description: translate("payroll.recordsOverviewDescription"),
      href: "/payroll",
    },
  ];

  if (canCompany) {
    actions.push({
      id: "manual-overtime",
      label: translate("navigation.manualOvertime"),
      description: translate("payroll.manualOtActionDescription"),
      href: "/payroll/manual-overtime",
    });
    actions.push({
      id: "exports",
      label: translate("payroll.exports"),
      description: translate("payroll.exportsFromOverview"),
      href: "/payroll#payroll-exports",
    });
    actions.push({
      id: "reports",
      label: translate("payroll.reports"),
      description: translate("payroll.reportsDescription"),
      href: "/reports",
    });
  } else {
    actions.push({
      id: "earnings",
      label: translate("payroll.earnings"),
      description: translate("payroll.earningsActionDescription"),
      href: "/payroll#payroll-earnings",
    });
  }

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
