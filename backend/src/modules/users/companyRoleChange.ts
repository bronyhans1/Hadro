import { CANONICAL_COMPANY_ROLES, normalizeRoles, PLATFORM_ADMIN } from "../../config/roles";
import type { UserAccountStatus } from "./users.repository";

/**
 * Company roles a company admin may assign with PATCH /api/users/:id/role.
 * Legacy aliases and PLATFORM_ADMIN are rejected as requested values.
 */
export const ASSIGNABLE_COMPANY_ROLES = ["employee", "manager", "HR", "admin"] as const;
export type AssignableCompanyRole = (typeof ASSIGNABLE_COMPANY_ROLES)[number];

const ASSIGNABLE = new Set<string>(ASSIGNABLE_COMPANY_ROLES);
const COMPANY_ROLE_SET = new Set<string>(CANONICAL_COMPANY_ROLES);
const ROLE_PRIORITY: AssignableCompanyRole[] = ["admin", "HR", "manager", "employee"];

export type RoleChangeCode =
  | "INVALID_ROLE"
  | "SELF_ROLE_CHANGE"
  | "LAST_ACTIVE_ADMIN"
  | "ROLE_NOT_IN_CATALOG"
  | "ROLE_UNCHANGED"
  | "NOT_FOUND"
  | "PERSISTENCE_FAILED";

export interface RoleAssignment {
  roleId: string;
  name: string;
}

export interface ReplacementPlan {
  previousRole: AssignableCompanyRole | null;
  previousRoles: AssignableCompanyRole[];
  /** Company-role rows that must not remain after the change. */
  deleteRoleIds: string[];
  /** True when no row already points at the destination role id. */
  needsInsert: boolean;
  unchanged: boolean;
  demotesActiveAdmin: boolean;
}

export interface CompanyRoleChangeStore {
  findTarget(
    id: string,
    companyId: string
  ): Promise<{ id: string; status: UserAccountStatus } | null>;
  listAssignments(userId: string): Promise<RoleAssignment[]>;
  /** Null when the canonical `admin` role row is missing. */
  countActiveAdmins(companyId: string): Promise<number | null>;
  findRoleId(name: string): Promise<string | null>;
  insertRole(userId: string, roleId: string): Promise<void>;
  /**
   * Point one existing company-role row at the new role id.
   * Returns false when that row is no longer present.
   */
  replaceRoleId(userId: string, fromRoleId: string, toRoleId: string): Promise<boolean>;
  deleteRoleIds(userId: string, roleIds: string[]): Promise<void>;
}

export function parseAssignableCompanyRole(raw: unknown): AssignableCompanyRole | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!ASSIGNABLE.has(trimmed)) return null;
  return trimmed as AssignableCompanyRole;
}

export function roleChangeErrorMessage(code: RoleChangeCode): string {
  switch (code) {
    case "INVALID_ROLE":
      return "role must be one of: employee, manager, HR, admin";
    case "SELF_ROLE_CHANGE":
      return "You cannot change your own role.";
    case "LAST_ACTIVE_ADMIN":
      return "This company must keep at least one active administrator.";
    case "NOT_FOUND":
      return "User not found";
    case "ROLE_NOT_IN_CATALOG":
      return "Role is not available.";
    case "ROLE_UNCHANGED":
      return "Select a different role.";
    case "PERSISTENCE_FAILED":
      return "Failed to update role.";
  }
}

export function roleChangeHttpStatus(code: RoleChangeCode): number {
  switch (code) {
    case "NOT_FOUND":
      return 404;
    case "SELF_ROLE_CHANGE":
      return 403;
    case "LAST_ACTIVE_ADMIN":
      return 409;
    case "ROLE_NOT_IN_CATALOG":
    case "PERSISTENCE_FAILED":
      return 500;
    default:
      return 400;
  }
}

/** Canonical company role or platform role for a single stored name. Unknown names are null. */
export function classifiedRoleName(
  name: string
): AssignableCompanyRole | typeof PLATFORM_ADMIN | null {
  const normalized = normalizeRoles([name]);
  if (normalized.length !== 1) return null;
  const role = normalized[0];
  if (role === PLATFORM_ADMIN) return PLATFORM_ADMIN;
  if (COMPANY_ROLE_SET.has(role)) return role as AssignableCompanyRole;
  return null;
}

export function planCompanyRoleReplacement(input: {
  assignments: RoleAssignment[];
  nextRole: AssignableCompanyRole;
  nextRoleId: string;
  targetStatus: UserAccountStatus;
  activeAdminCount: number;
  isSelf: boolean;
}): { ok: true; plan: ReplacementPlan } | { ok: false; code: RoleChangeCode } {
  if (input.isSelf) return { ok: false, code: "SELF_ROLE_CHANGE" };

  const companyRows = input.assignments.flatMap((row) => {
    const kind = classifiedRoleName(row.name);
    if (!kind || kind === PLATFORM_ADMIN) return [];
    return [{ ...row, canonical: kind }];
  });
  const previousRoles = ROLE_PRIORITY.filter((role) =>
    companyRows.some((row) => row.canonical === role)
  );
  const demotesActiveAdmin =
    input.targetStatus === "active" &&
    previousRoles.includes("admin") &&
    input.nextRole !== "admin";
  if (demotesActiveAdmin && input.activeAdminCount <= 1) {
    return { ok: false, code: "LAST_ACTIVE_ADMIN" };
  }

  const deleteRoleIds = [
    ...new Set(companyRows.filter((row) => row.roleId !== input.nextRoleId).map((row) => row.roleId)),
  ];
  const needsInsert = !input.assignments.some((row) => row.roleId === input.nextRoleId);
  const unchanged = !needsInsert && deleteRoleIds.length === 0;

  return {
    ok: true,
    plan: {
      previousRole: previousRoles[0] ?? null,
      previousRoles,
      deleteRoleIds,
      needsInsert,
      unchanged,
      demotesActiveAdmin,
    },
  };
}

/**
 * Role names context middleware would see after a successful replacement.
 * Platform and unrecognized rows stay. Other company roles do not.
 */
export function roleNamesAfterReplacement(
  assignments: RoleAssignment[],
  nextRole: AssignableCompanyRole,
  nextRoleId: string
): string[] {
  const kept = assignments.filter((row) => {
    const kind = classifiedRoleName(row.name);
    if (kind && kind !== PLATFORM_ADMIN) return row.roleId === nextRoleId;
    return true;
  });
  const names = kept.map((row) => row.name);
  if (!kept.some((row) => row.roleId === nextRoleId)) names.push(nextRole);
  return normalizeRoles(names);
}

function stillHasPlatformRole(before: RoleAssignment[], after: RoleAssignment[]): boolean {
  const hadPlatform = before.some((row) => classifiedRoleName(row.name) === PLATFORM_ADMIN);
  if (!hadPlatform) return true;
  return after.some((row) => classifiedRoleName(row.name) === PLATFORM_ADMIN);
}

function companyRolesAreOnly(
  assignments: RoleAssignment[],
  nextRole: AssignableCompanyRole
): boolean {
  const company = assignments.flatMap((row) => {
    const kind = classifiedRoleName(row.name);
    return kind && kind !== PLATFORM_ADMIN ? [kind] : [];
  });
  return company.length > 0 && company.every((role) => role === nextRole);
}

/**
 * Replace company role rows without dropping PLATFORM_ADMIN.
 *
 * Supabase client calls are not a multi-statement transaction. The write order
 * attaches the new role before deleting any other company role, so a failed
 * write does not leave the user with zero company roles. Two administrators
 * can still demote each other between the active-admin count and the write;
 * the count is repeated immediately before the write, and that remaining race
 * is not closed without a database lock.
 */
export async function executeCompanyRoleChange(
  store: CompanyRoleChangeStore,
  input: {
    actorUserId: string;
    companyId: string;
    targetUserId: string;
    nextRole: AssignableCompanyRole;
  }
): Promise<
  | {
      ok: true;
      unchanged: boolean;
      previousRole: AssignableCompanyRole | null;
      nextRole: AssignableCompanyRole;
    }
  | { ok: false; code: RoleChangeCode }
> {
  if (input.actorUserId === input.targetUserId) {
    return { ok: false, code: "SELF_ROLE_CHANGE" };
  }

  const target = await store.findTarget(input.targetUserId, input.companyId);
  if (!target) return { ok: false, code: "NOT_FOUND" };

  const assignments = await store.listAssignments(input.targetUserId);
  const activeAdminCount = await store.countActiveAdmins(input.companyId);
  if (activeAdminCount == null) return { ok: false, code: "ROLE_NOT_IN_CATALOG" };

  const nextRoleId = await store.findRoleId(input.nextRole);
  if (!nextRoleId) return { ok: false, code: "ROLE_NOT_IN_CATALOG" };

  const planned = planCompanyRoleReplacement({
    assignments,
    nextRole: input.nextRole,
    nextRoleId,
    targetStatus: target.status,
    activeAdminCount,
    isSelf: false,
  });
  if (!planned.ok) return planned;
  if (planned.plan.unchanged) {
    return {
      ok: true,
      unchanged: true,
      previousRole: planned.plan.previousRole,
      nextRole: input.nextRole,
    };
  }

  if (planned.plan.demotesActiveAdmin) {
    const again = await store.countActiveAdmins(input.companyId);
    if (again == null) return { ok: false, code: "ROLE_NOT_IN_CATALOG" };
    if (again <= 1) return { ok: false, code: "LAST_ACTIVE_ADMIN" };
  }

  try {
    if (!planned.plan.needsInsert) {
      await store.deleteRoleIds(input.targetUserId, planned.plan.deleteRoleIds);
    } else if (planned.plan.deleteRoleIds.length > 0) {
      const [fromRoleId, ...rest] = planned.plan.deleteRoleIds;
      const updated = await store.replaceRoleId(input.targetUserId, fromRoleId, nextRoleId);
      if (!updated) return { ok: false, code: "PERSISTENCE_FAILED" };
      if (rest.length > 0) await store.deleteRoleIds(input.targetUserId, rest);
    } else {
      await store.insertRole(input.targetUserId, nextRoleId);
    }
  } catch {
    return { ok: false, code: "PERSISTENCE_FAILED" };
  }

  const after = await store.listAssignments(input.targetUserId);
  if (!companyRolesAreOnly(after, input.nextRole) || !stillHasPlatformRole(assignments, after)) {
    return { ok: false, code: "PERSISTENCE_FAILED" };
  }

  return {
    ok: true,
    unchanged: false,
    previousRole: planned.plan.previousRole,
    nextRole: input.nextRole,
  };
}
