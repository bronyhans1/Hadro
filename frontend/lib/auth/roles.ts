import type { AppRole } from "@/lib/types/auth";

const CANONICAL_APP_ROLES: AppRole[] = ["admin", "manager", "HR", "employee", "PLATFORM_ADMIN"];
const CANONICAL_SET = new Set<string>(CANONICAL_APP_ROLES);

/** Legacy role name -> canonical AppRole (lowercase keys). */
const LEGACY_TO_CANONICAL: Record<string, AppRole> = {
  super_admin: "PLATFORM_ADMIN",
  employee: "employee",
  hr: "HR",
  admin: "admin",
  manager: "manager",
};

/**
 * Normalizes raw role strings from API to canonical AppRole[].
 * Supports legacy values (e.g. SUPER_ADMIN) during migration.
 */
export function normalizeRolesForApp(raw: string[] | undefined): AppRole[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const seen = new Set<string>();
  const out: AppRole[] = [];
  for (const r of raw) {
    if (typeof r !== "string" || !r.trim()) continue;
    const key = r.trim().toLowerCase();
    const canonical: AppRole | null =
      LEGACY_TO_CANONICAL[key] ?? (CANONICAL_SET.has(r.trim()) ? (r.trim() as AppRole) : null);
    if (canonical && !seen.has(canonical)) {
      seen.add(canonical);
      out.push(canonical);
    }
  }
  return out;
}

/** Roles that can access manager/HR-level features (company dashboard, employees, reports, etc.). */
export const MANAGER_HR_ROLES: AppRole[] = ["admin", "manager", "HR", "PLATFORM_ADMIN"];

/** Roles that can access admin-only features. */
export const ADMIN_ROLES: AppRole[] = ["admin", "PLATFORM_ADMIN"];

/** Roles that see admin/manager sidebar items (Departments, Shifts) and can manage org structure. */
export const ADMIN_MANAGER_ROLES: AppRole[] = ["admin", "manager", "PLATFORM_ADMIN"];

/**
 * Company audit / activity log viewers.
 * Matches backend GET /api/audit/company — admin, manager, HR.
 */
export const AUDIT_VIEW_ROLES: AppRole[] = ["admin", "manager", "HR", "PLATFORM_ADMIN"];

/**
 * Company activity timeline (dashboard Recent Activity feed).
 * Matches backend GET /api/timeline — admin, HR only.
 */
export const TIMELINE_VIEW_ROLES: AppRole[] = ["admin", "HR", "PLATFORM_ADMIN"];

/** Roles that can update company policy (backend PATCH /api/company-policy). Tenant only — not platform payroll/control. */
export const COMPANY_POLICY_EDIT_ROLES: AppRole[] = ["admin", "manager", "HR"];

/** Company-wide payroll reports, exports, and listing (tenant admin/HR). */
export function canAccessCompanyPayroll(roles: AppRole[] | undefined): boolean {
  return hasRole(roles, ["admin", "HR"]);
}

/**
 * Payroll Administrator actions: lock, unlock, archive, reopen, regenerate.
 * Maps to company `admin` (no separate payroll_admin role yet).
 */
export function canAdministerPayrollPeriod(roles: AppRole[] | undefined): boolean {
  return hasRole(roles, ["admin"]);
}

/** Working schedule + holidays UI gates; matches backend payroll schedule editors. */
export function canEditPayrollSchedulePolicy(roles: AppRole[] | undefined): boolean {
  return hasRole(roles, ["admin", "HR"]);
}

export function hasRole(userRoles: AppRole[] | undefined, allowed: AppRole[]): boolean {
  if (!userRoles?.length) return false;
  return userRoles.some((r) => allowed.includes(r));
}

export function canAccessManagerFeatures(roles: AppRole[] | undefined): boolean {
  return hasRole(roles, MANAGER_HR_ROLES);
}

export function canAccessAdminFeatures(roles: AppRole[] | undefined): boolean {
  return hasRole(roles, ADMIN_ROLES);
}

/** Employee directory (People → Employees). */
export function canAccessEmployeeDirectory(roles: AppRole[] | undefined): boolean {
  return hasRole(roles, MANAGER_HR_ROLES);
}

/** Organization shifts administration UI. */
export function canAccessShiftAdministration(roles: AppRole[] | undefined): boolean {
  return hasRole(roles, ADMIN_MANAGER_ROLES);
}

export function canAccessAuditLogs(roles: AppRole[] | undefined): boolean {
  return hasRole(roles, AUDIT_VIEW_ROLES);
}

export function canAccessCompanyTimeline(roles: AppRole[] | undefined): boolean {
  return hasRole(roles, TIMELINE_VIEW_ROLES);
}

/**
 * Manager or HR without `admin`: backend limits lists/actions to their `users.branch_id`.
 * (Company `admin` and `PLATFORM_ADMIN` are not branch-scoped this way.)
 */
export function isBranchScopedCompanyUser(roles: AppRole[] | undefined): boolean {
  if (!roles?.length) return false;
  if (hasRole(roles, ["admin"])) return false;
  return roles.some((r) => r === "manager" || r === "HR");
}

export function canUpdateCompanyPolicy(roles: AppRole[] | undefined): boolean {
  return hasRole(roles, COMPANY_POLICY_EDIT_ROLES);
}

export function isPlatformAdmin(roles: AppRole[] | undefined): boolean {
  return hasRole(roles, ["PLATFORM_ADMIN"]);
}

/**
 * Default post-login landing route based on canonical roles.
 * - PLATFORM_ADMIN -> platform console
 * - company roles -> normal app dashboard
 */
export function getDefaultHomeRoute(roles: AppRole[] | undefined): string {
  return isPlatformAdmin(roles) ? "/platform/dashboard" : "/dashboard";
}
