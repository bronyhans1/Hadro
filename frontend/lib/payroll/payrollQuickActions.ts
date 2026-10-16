import { canAccessAdminFeatures, canAccessCompanyPayroll } from "@/lib/auth/roles";
import type { AppRole } from "@/lib/types/auth";
import { translate } from "@/lib/i18n";

export interface PayrollQuickAction {
  id: string;
  label: string;
  description: string;
  href: string;
}

export function getPayrollQuickActions(opts: {
  roles: AppRole[] | undefined;
  payrollEnabled: boolean;
}): PayrollQuickAction[] {
  const { roles, payrollEnabled } = opts;
  if (!payrollEnabled) return [];

  const canCompany = canAccessCompanyPayroll(roles);
  const isAdmin = canAccessAdminFeatures(roles);
  const actions: PayrollQuickAction[] = [];

  if (canCompany) {
    actions.push({
      id: "exports",
      label: translate("payroll.exports"),
      description: translate("payroll.exportsDescription"),
      href: "#payroll-exports",
    });
    actions.push({
      id: "reports",
      label: translate("payroll.reports"),
      description: translate("payroll.reportsDescription"),
      href: "/reports",
    });
  }

  if (isAdmin) {
    actions.push({
      id: "settings",
      label: translate("payroll.payrollSettings"),
      description: translate("payroll.payrollSettingsDescription"),
      href: "/settings",
    });
  }

  return actions;
}
