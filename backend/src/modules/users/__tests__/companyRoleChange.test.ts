import { requireRole } from "../../../middleware/role.middleware";
import type { ContextRequest } from "../../../middleware/context.middleware";
import type { Response } from "express";
import {
  executeCompanyRoleChange,
  parseAssignableCompanyRole,
  planCompanyRoleReplacement,
  roleNamesAfterReplacement,
  type CompanyRoleChangeStore,
  type RoleAssignment,
} from "../companyRoleChange";
import type { UserAccountStatus } from "../users.repository";

const ROLE_IDS = {
  employee: "role-employee",
  manager: "role-manager",
  HR: "role-hr",
  admin: "role-admin",
  PLATFORM_ADMIN: "role-platform",
  hrLegacy: "role-hr-legacy",
} as const;

interface MemoryUser {
  id: string;
  companyId: string;
  status: UserAccountStatus;
}

function createStore(options?: {
  users?: MemoryUser[];
  assignments?: Array<RoleAssignment & { userId: string }>;
  missingRoles?: string[];
  failInsert?: boolean;
  replaceReturnsFalse?: boolean;
}) {
  const users = options?.users ?? [
    { id: "employee-1", companyId: "company-1", status: "active" as const },
    { id: "admin-1", companyId: "company-1", status: "active" as const },
  ];
  let assignments = [...(options?.assignments ?? [])];
  const calls = { insert: 0, replace: 0, delete: [] as string[][] };
  const namesById = new Map<string, string>([
    [ROLE_IDS.employee, "employee"],
    [ROLE_IDS.manager, "manager"],
    [ROLE_IDS.HR, "HR"],
    [ROLE_IDS.admin, "admin"],
    [ROLE_IDS.PLATFORM_ADMIN, "PLATFORM_ADMIN"],
    [ROLE_IDS.hrLegacy, "hr"],
  ]);

  const store: CompanyRoleChangeStore = {
    async findTarget(id, companyId) {
      const user = users.find((row) => row.id === id && row.companyId === companyId);
      return user ? { id: user.id, status: user.status } : null;
    },
    async listAssignments(userId) {
      return assignments
        .filter((row) => row.userId === userId)
        .map(({ roleId, name }) => ({ roleId, name }));
    },
    async countActiveAdmins(companyId) {
      if (options?.missingRoles?.includes("admin")) return null;
      const activeIds = new Set(
        users.filter((user) => user.companyId === companyId && user.status === "active").map((user) => user.id)
      );
      return new Set(
        assignments
          .filter((row) => row.roleId === ROLE_IDS.admin && activeIds.has(row.userId))
          .map((row) => row.userId)
      ).size;
    },
    async findRoleId(name) {
      if (options?.missingRoles?.includes(name)) return null;
      return ROLE_IDS[name as keyof typeof ROLE_IDS] ?? null;
    },
    async insertRole(userId, roleId) {
      calls.insert += 1;
      if (options?.failInsert) throw new Error("insert failed");
      assignments.push({ userId, roleId, name: namesById.get(roleId) ?? roleId });
    },
    async replaceRoleId(userId, fromRoleId, toRoleId) {
      calls.replace += 1;
      if (options?.replaceReturnsFalse) return false;
      const row = assignments.find((item) => item.userId === userId && item.roleId === fromRoleId);
      if (!row) return false;
      row.roleId = toRoleId;
      row.name = namesById.get(toRoleId) ?? toRoleId;
      return true;
    },
    async deleteRoleIds(userId, roleIds) {
      calls.delete.push(roleIds);
      assignments = assignments.filter(
        (row) => row.userId !== userId || !roleIds.includes(row.roleId)
      );
    },
  };

  return {
    store,
    calls,
    read: (userId: string) =>
      assignments.filter((row) => row.userId === userId).map(({ roleId, name }) => ({ roleId, name })),
  };
}

function mockRes(): Response & { statusCode?: number; body?: unknown } {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as unknown as Response & { statusCode?: number; body?: unknown };
}

describe("company role replacement", () => {
  it("changes employee to manager by replacing the role row", async () => {
    const memory = createStore({
      assignments: [{ userId: "employee-1", roleId: ROLE_IDS.employee, name: "employee" }],
    });
    const result = await executeCompanyRoleChange(memory.store, {
      actorUserId: "admin-1",
      companyId: "company-1",
      targetUserId: "employee-1",
      nextRole: "manager",
    });
    expect(result).toEqual({
      ok: true,
      unchanged: false,
      previousRole: "employee",
      nextRole: "manager",
    });
    expect(memory.calls.insert).toBe(0);
    expect(memory.calls.replace).toBe(1);
    expect(memory.read("employee-1")).toEqual([{ roleId: ROLE_IDS.manager, name: "manager" }]);
  });

  it("changes employee to HR", async () => {
    const memory = createStore({
      assignments: [{ userId: "employee-1", roleId: ROLE_IDS.employee, name: "employee" }],
    });
    const result = await executeCompanyRoleChange(memory.store, {
      actorUserId: "admin-1",
      companyId: "company-1",
      targetUserId: "employee-1",
      nextRole: "HR",
    });
    expect(result.ok).toBe(true);
    expect(memory.read("employee-1")).toEqual([{ roleId: ROLE_IDS.HR, name: "HR" }]);
  });

  it("promotes an eligible user to admin and drops the previous company role", async () => {
    const memory = createStore({
      users: [
        { id: "employee-1", companyId: "company-1", status: "active" },
        { id: "admin-1", companyId: "company-1", status: "active" },
      ],
      assignments: [
        { userId: "employee-1", roleId: ROLE_IDS.employee, name: "employee" },
        { userId: "employee-1", roleId: ROLE_IDS.manager, name: "manager" },
        { userId: "admin-1", roleId: ROLE_IDS.admin, name: "admin" },
      ],
    });
    const result = await executeCompanyRoleChange(memory.store, {
      actorUserId: "admin-1",
      companyId: "company-1",
      targetUserId: "employee-1",
      nextRole: "admin",
    });
    expect(result.ok).toBe(true);
    const names = memory.read("employee-1").map((row) => row.name);
    expect(names).toEqual(["admin"]);
    expect(names).not.toContain("employee");
    expect(names).not.toContain("manager");
  });

  it("replaces a legacy hr alias with canonical HR", async () => {
    const memory = createStore({
      assignments: [{ userId: "employee-1", roleId: ROLE_IDS.hrLegacy, name: "hr" }],
    });
    const result = await executeCompanyRoleChange(memory.store, {
      actorUserId: "admin-1",
      companyId: "company-1",
      targetUserId: "employee-1",
      nextRole: "HR",
    });
    expect(result.ok).toBe(true);
    expect(memory.read("employee-1")).toEqual([{ roleId: ROLE_IDS.HR, name: "HR" }]);
  });

  it("preserves an existing platform role", async () => {
    const memory = createStore({
      assignments: [
        { userId: "employee-1", roleId: ROLE_IDS.employee, name: "employee" },
        { userId: "employee-1", roleId: ROLE_IDS.PLATFORM_ADMIN, name: "PLATFORM_ADMIN" },
      ],
    });
    const result = await executeCompanyRoleChange(memory.store, {
      actorUserId: "admin-1",
      companyId: "company-1",
      targetUserId: "employee-1",
      nextRole: "manager",
    });
    expect(result.ok).toBe(true);
    expect(memory.read("employee-1").map((row) => row.name).sort()).toEqual([
      "PLATFORM_ADMIN",
      "manager",
    ]);
  });

  it("rejects a self change before any write", async () => {
    const memory = createStore({
      assignments: [{ userId: "admin-1", roleId: ROLE_IDS.admin, name: "admin" }],
    });
    const result = await executeCompanyRoleChange(memory.store, {
      actorUserId: "admin-1",
      companyId: "company-1",
      targetUserId: "admin-1",
      nextRole: "manager",
    });
    expect(result).toEqual({ ok: false, code: "SELF_ROLE_CHANGE" });
    expect(memory.calls.replace).toBe(0);
    expect(memory.calls.delete).toEqual([]);
  });

  it("returns not found for a user outside the company", async () => {
    const memory = createStore({
      users: [{ id: "other", companyId: "company-2", status: "active" }],
      assignments: [{ userId: "other", roleId: ROLE_IDS.employee, name: "employee" }],
    });
    const result = await executeCompanyRoleChange(memory.store, {
      actorUserId: "admin-1",
      companyId: "company-1",
      targetUserId: "other",
      nextRole: "manager",
    });
    expect(result).toEqual({ ok: false, code: "NOT_FOUND" });
  });

  it("rejects platform and legacy aliases as the requested role", () => {
    expect(parseAssignableCompanyRole("PLATFORM_ADMIN")).toBeNull();
    expect(parseAssignableCompanyRole("super_admin")).toBeNull();
    expect(parseAssignableCompanyRole("hr")).toBeNull();
    expect(parseAssignableCompanyRole("")).toBeNull();
    expect(parseAssignableCompanyRole(null)).toBeNull();
    expect(parseAssignableCompanyRole("employee")).toBe("employee");
  });

  it("fails safely when the destination role is missing from the catalog", async () => {
    const memory = createStore({
      missingRoles: ["manager"],
      assignments: [{ userId: "employee-1", roleId: ROLE_IDS.employee, name: "employee" }],
    });
    const result = await executeCompanyRoleChange(memory.store, {
      actorUserId: "admin-1",
      companyId: "company-1",
      targetUserId: "employee-1",
      nextRole: "manager",
    });
    expect(result).toEqual({ ok: false, code: "ROLE_NOT_IN_CATALOG" });
    expect(memory.read("employee-1")).toEqual([{ roleId: ROLE_IDS.employee, name: "employee" }]);
    expect(memory.calls.replace).toBe(0);
  });

  it("refuses to demote the last active company admin", async () => {
    const memory = createStore({
      users: [{ id: "admin-2", companyId: "company-1", status: "active" }],
      assignments: [{ userId: "admin-2", roleId: ROLE_IDS.admin, name: "admin" }],
    });
    const result = await executeCompanyRoleChange(memory.store, {
      actorUserId: "admin-1",
      companyId: "company-1",
      targetUserId: "admin-2",
      nextRole: "employee",
    });
    expect(result).toEqual({ ok: false, code: "LAST_ACTIVE_ADMIN" });
    expect(memory.read("admin-2")).toEqual([{ roleId: ROLE_IDS.admin, name: "admin" }]);
  });

  it("allows a role change for an inactive employee and for an inactive admin", async () => {
    const inactiveEmployee = createStore({
      users: [
        { id: "employee-1", companyId: "company-1", status: "inactive" },
        { id: "admin-1", companyId: "company-1", status: "active" },
      ],
      assignments: [{ userId: "employee-1", roleId: ROLE_IDS.employee, name: "employee" }],
    });
    const employeeResult = await executeCompanyRoleChange(inactiveEmployee.store, {
      actorUserId: "admin-1",
      companyId: "company-1",
      targetUserId: "employee-1",
      nextRole: "manager",
    });
    expect(employeeResult.ok).toBe(true);

    const suspendedAdmin = createStore({
      users: [{ id: "admin-2", companyId: "company-1", status: "suspended" }],
      assignments: [{ userId: "admin-2", roleId: ROLE_IDS.admin, name: "admin" }],
    });
    const adminResult = await executeCompanyRoleChange(suspendedAdmin.store, {
      actorUserId: "admin-1",
      companyId: "company-1",
      targetUserId: "admin-2",
      nextRole: "employee",
    });
    expect(adminResult.ok).toBe(true);
    expect(suspendedAdmin.read("admin-2")).toEqual([{ roleId: ROLE_IDS.employee, name: "employee" }]);
  });

  it("does not delete roles when inserting the first company role fails", async () => {
    const memory = createStore({
      failInsert: true,
      assignments: [{ userId: "employee-1", roleId: ROLE_IDS.PLATFORM_ADMIN, name: "PLATFORM_ADMIN" }],
    });
    const result = await executeCompanyRoleChange(memory.store, {
      actorUserId: "admin-1",
      companyId: "company-1",
      targetUserId: "employee-1",
      nextRole: "employee",
    });
    expect(result).toEqual({ ok: false, code: "PERSISTENCE_FAILED" });
    expect(memory.calls.delete).toEqual([]);
    expect(memory.read("employee-1")).toEqual([
      { roleId: ROLE_IDS.PLATFORM_ADMIN, name: "PLATFORM_ADMIN" },
    ]);
  });

  it("does not delete the current role when the replacement write fails", async () => {
    const memory = createStore({
      replaceReturnsFalse: true,
      assignments: [{ userId: "employee-1", roleId: ROLE_IDS.employee, name: "employee" }],
    });
    const result = await executeCompanyRoleChange(memory.store, {
      actorUserId: "admin-1",
      companyId: "company-1",
      targetUserId: "employee-1",
      nextRole: "manager",
    });
    expect(result).toEqual({ ok: false, code: "PERSISTENCE_FAILED" });
    expect(memory.calls.delete).toEqual([]);
    expect(memory.read("employee-1")).toEqual([{ roleId: ROLE_IDS.employee, name: "employee" }]);
  });

  it("grants the new role on the next authorization check and removes the old one", () => {
    const before: RoleAssignment[] = [
      { roleId: ROLE_IDS.employee, name: "employee" },
      { roleId: ROLE_IDS.PLATFORM_ADMIN, name: "PLATFORM_ADMIN" },
    ];
    const after = roleNamesAfterReplacement(before, "manager", ROLE_IDS.manager);
    expect(after).toEqual(expect.arrayContaining(["manager", "PLATFORM_ADMIN"]));
    expect(after).not.toContain("employee");

    const next = jest.fn();
    const managerReq = {
      context: { userId: "employee-1", companyId: "company-1", branchId: "b", roles: after },
    } as ContextRequest;
    requireRole(["admin", "manager", "HR"])(managerReq, mockRes(), next);
    expect(next).toHaveBeenCalledTimes(1);

    const denied = jest.fn();
    const res = mockRes();
    requireRole(["admin"])(
      { context: { ...managerReq.context, roles: ["employee"] } } as ContextRequest,
      res,
      denied
    );
    expect(denied).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);

    const platform = jest.fn();
    requireRole(["PLATFORM_ADMIN"])(managerReq, mockRes(), platform);
    expect(platform).toHaveBeenCalledTimes(1);
  });

  it("plans a no-op when the only company role is already the requested one", () => {
    const planned = planCompanyRoleReplacement({
      assignments: [{ roleId: ROLE_IDS.manager, name: "manager" }],
      nextRole: "manager",
      nextRoleId: ROLE_IDS.manager,
      targetStatus: "active",
      activeAdminCount: 2,
      isSelf: false,
    });
    expect(planned.ok && planned.plan.unchanged).toBe(true);
  });
});
