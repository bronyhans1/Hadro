import type { Response } from "express";
import type { ContextRequest } from "../../../middleware/context.middleware";
import * as usersService from "../users.service";
import * as usersController from "../users.controller";
import { logAction } from "../../audit/audit.service";

jest.mock("../users.service");
jest.mock("../../audit/audit.service", () => ({
  logAction: jest.fn().mockResolvedValue(undefined),
}));

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

function ctxReq(partial: {
  roles?: string[];
  userId?: string;
  companyId?: string;
  body?: Record<string, unknown>;
  params?: { id: string };
}): ContextRequest {
  return {
    body: partial.body ?? {},
    params: partial.params ?? { id: "employee-1" },
    context: {
      userId: partial.userId ?? "admin-1",
      companyId: partial.companyId ?? "company-1",
      branchId: "branch-a",
      roles: partial.roles ?? ["admin"],
    },
  } as unknown as ContextRequest;
}

const updatedUser = {
  id: "employee-1",
  first_name: "Ada",
  last_name: "Lovelace",
  email: "ada@example.com",
  company_id: "company-1",
  company_name: "Co",
  branch_id: "branch-a",
  department_id: null,
  status: "active" as const,
  remote_attendance_allowed: false,
  roles: ["manager"],
  branch: null,
  department: null,
};

describe("changeUserRole", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(logAction).mockResolvedValue(undefined);
  });

  it("audits a successful change before reporting success", async () => {
    const order: string[] = [];
    jest.mocked(usersService.changeCompanyRole).mockResolvedValue({
      user: updatedUser,
      unchanged: false,
      previousRole: "employee",
      nextRole: "manager",
    });
    jest.mocked(logAction).mockImplementation(async () => {
      order.push("audit");
    });
    const res = mockRes();
    const originalJson = res.json.bind(res);
    res.json = ((payload: unknown) => {
      order.push("response");
      return originalJson(payload);
    }) as Response["json"];

    await usersController.changeUserRole(
      ctxReq({ body: { role: "manager" }, params: { id: "employee-1" } }),
      res
    );

    expect(usersService.changeCompanyRole).toHaveBeenCalledWith(
      "admin-1",
      "company-1",
      "employee-1",
      "manager"
    );
    expect(logAction).toHaveBeenCalledWith(
      "company-1",
      "admin-1",
      "user.role_change",
      "user",
      "employee-1",
      {
        actor_user_id: "admin-1",
        target_user_id: "employee-1",
        previous_role: "employee",
        new_role: "manager",
        company_id: "company-1",
      }
    );
    expect(order).toEqual(["audit", "response"]);
    expect(res.body).toEqual({ success: true, data: updatedUser });
  });

  it.each(["manager", "HR", "employee", "PLATFORM_ADMIN"])(
    "returns 403 for %s and does not change a role",
    async (role) => {
      const res = mockRes();
      await usersController.changeUserRole(ctxReq({ roles: [role], body: { role: "admin" } }), res);
      expect(res.statusCode).toBe(403);
      expect(usersService.changeCompanyRole).not.toHaveBeenCalled();
      expect(logAction).not.toHaveBeenCalled();
    }
  );

  it("returns 403 for a self change", async () => {
    jest.mocked(usersService.changeCompanyRole).mockResolvedValue({
      user: null,
      code: "SELF_ROLE_CHANGE",
    });
    const res = mockRes();
    await usersController.changeUserRole(
      ctxReq({ userId: "employee-1", params: { id: "employee-1" }, body: { role: "admin" } }),
      res
    );
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual(
      expect.objectContaining({ success: false, code: "SELF_ROLE_CHANGE" })
    );
    expect(logAction).not.toHaveBeenCalled();
  });

  it("returns 404 for a missing or out-of-company target", async () => {
    jest.mocked(usersService.changeCompanyRole).mockResolvedValue({ user: null, code: "NOT_FOUND" });
    const res = mockRes();
    await usersController.changeUserRole(ctxReq({ body: { role: "manager" } }), res);
    expect(res.statusCode).toBe(404);
    expect(logAction).not.toHaveBeenCalled();
  });

  it("rejects an invalid requested role", async () => {
    jest.mocked(usersService.changeCompanyRole).mockResolvedValue({ user: null, code: "INVALID_ROLE" });
    const res = mockRes();
    await usersController.changeUserRole(ctxReq({ body: { role: "PLATFORM_ADMIN" } }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({ code: "INVALID_ROLE" }));
    expect(logAction).not.toHaveBeenCalled();
  });

  it("rejects demotion of the last active admin", async () => {
    jest.mocked(usersService.changeCompanyRole).mockResolvedValue({
      user: null,
      code: "LAST_ACTIVE_ADMIN",
    });
    const res = mockRes();
    await usersController.changeUserRole(ctxReq({ body: { role: "employee" } }), res);
    expect(res.statusCode).toBe(409);
    expect(logAction).not.toHaveBeenCalled();
  });

  it("does not report success when persistence fails", async () => {
    jest.mocked(usersService.changeCompanyRole).mockResolvedValue({
      user: null,
      code: "PERSISTENCE_FAILED",
    });
    const res = mockRes();
    await usersController.changeUserRole(ctxReq({ body: { role: "manager" } }), res);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual(expect.objectContaining({ success: false, code: "PERSISTENCE_FAILED" }));
    expect(logAction).not.toHaveBeenCalled();
  });

  it("does not report success when the audit write fails", async () => {
    jest.mocked(usersService.changeCompanyRole).mockResolvedValue({
      user: updatedUser,
      unchanged: false,
      previousRole: "employee",
      nextRole: "manager",
    });
    jest.mocked(logAction).mockRejectedValue(new Error("audit down"));
    const res = mockRes();
    await usersController.changeUserRole(ctxReq({ body: { role: "manager" } }), res);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ success: false, error: "Internal server error" });
  });
});

describe("updateUser role field", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(logAction).mockResolvedValue(undefined);
  });

  it("does not change roles through the general employee update", async () => {
    jest.mocked(usersService.updateEmployee).mockResolvedValue({ user: updatedUser });
    const res = mockRes();
    await usersController.updateUser(
      ctxReq({
        roles: ["admin"],
        body: { role: "admin", first_name: "Ada" },
        params: { id: "employee-1" },
      }),
      res
    );
    expect(usersService.changeCompanyRole).not.toHaveBeenCalled();
    expect(usersService.updateEmployee).toHaveBeenCalledWith(
      "employee-1",
      "company-1",
      expect.not.objectContaining({ role: expect.anything() }),
      undefined
    );
    const input = jest.mocked(usersService.updateEmployee).mock.calls[0][2];
    expect(input).not.toHaveProperty("role");
    expect(res.body).toEqual(expect.objectContaining({ success: true }));
  });
});
