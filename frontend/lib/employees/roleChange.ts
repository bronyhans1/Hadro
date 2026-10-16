import { normalizeRolesForApp } from "@/lib/auth/roles";
import type { AssignableCompanyRole } from "@/lib/api/users.api";
import { translate } from "@/lib/i18n";

export const ASSIGNABLE_COMPANY_ROLES: readonly AssignableCompanyRole[] = [
  "employee",
  "manager",
  "HR",
  "admin",
];

/** Highest company role currently shown for the employee. */
export function primaryCompanyRole(roles: string[] | undefined): AssignableCompanyRole {
  const normalized = normalizeRolesForApp(roles);
  if (normalized.includes("admin")) return "admin";
  if (normalized.includes("HR")) return "HR";
  if (normalized.includes("manager")) return "manager";
  return "employee";
}

export function roleImpactMessageKey(role: AssignableCompanyRole): string {
  switch (role) {
    case "employee":
      return "employees.roleImpactEmployee";
    case "manager":
      return "employees.roleImpactManager";
    case "HR":
      return "employees.roleImpactHr";
    case "admin":
      return "employees.roleImpactAdmin";
  }
}

export function roleChangeErrorMessage(code: string | undefined): string {
  switch (code) {
    case "SELF_ROLE_CHANGE":
      return translate("employees.cannotChangeOwnRole");
    case "LAST_ACTIVE_ADMIN":
      return translate("employees.lastAdminProtected");
    case "INVALID_ROLE":
      return translate("employees.invalidRole");
    case "ROLE_NOT_IN_CATALOG":
      return translate("employees.roleNotAvailable");
    case "ROLE_UNCHANGED":
      return translate("employees.selectDifferentRole");
    default:
      return translate("employees.failedUpdateRole");
  }
}
