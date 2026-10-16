import { Response } from "express";
import { ContextRequest } from "../../middleware/context.middleware";
import { getRequiredCompanyContext } from "../../lib/companyRequestContext";
import { routeParamString } from "../../lib/routeParams";
import * as leaveBalanceService from "./leaveBalance.service";
import { toLeaveBalanceApi, toLeaveBalanceApiList } from "./leaveBalance.mapper";
import { listLeaveTypePolicies } from "./leaveTypePolicy.service";
import * as auditService from "../audit/audit.service";
import { resolveManagerListUserIds } from "../../lib/resolveScopedUserIds";
import { isBranchScopedManagerRole, isCompanyAdminRole } from "../../lib/branchAccess";

async function compensationByTypeForCompany(
  companyId: string
): Promise<Map<string, "paid" | "unpaid">> {
  const policies = await listLeaveTypePolicies(companyId);
  return new Map(policies.map((p) => [p.leave_type, p.compensation_type]));
}

function branchRestrictOr403(
  req: ContextRequest,
  res: Response
): string | undefined | null {
  const ctx = req.context!;
  if (isCompanyAdminRole(ctx.roles)) {
    return undefined;
  }
  if (isBranchScopedManagerRole(ctx.roles)) {
    if (!ctx.branchId) {
      res.status(403).json({
        success: false,
        error: "Branch context required for this role",
      });
      return null;
    }
    return ctx.branchId;
  }
  return undefined;
}

export async function getMyLeaveBalances(
  req: ContextRequest,
  res: Response
): Promise<void> {
  try {
    const { companyId, userId } = getRequiredCompanyContext(req);
    const rows = await leaveBalanceService.getMyLeaveBalances(userId, companyId);
    const compensationByType = await compensationByTypeForCompany(companyId);
    res.json({ success: true, data: toLeaveBalanceApiList(rows, compensationByType) });
  } catch (err) {
    console.error("getMyLeaveBalances error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function getCompanyLeaveBalances(
  req: ContextRequest,
  res: Response
): Promise<void> {
  try {
    const ctx = getRequiredCompanyContext(req);
    const { companyId } = ctx;
    const resolved = await resolveManagerListUserIds(ctx, companyId);
    if (resolved.error) {
      res
        .status(resolved.error.status)
        .json({ success: false, error: resolved.error.message });
      return;
    }
    const balances = await leaveBalanceService.getCompanyLeaveBalances(
      companyId,
      resolved.scopedUserIds
    );
    const compensationByType = await compensationByTypeForCompany(companyId);
    res.json({ success: true, data: toLeaveBalanceApiList(balances, compensationByType) });
  } catch (err) {
    console.error("getCompanyLeaveBalances error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function getUserLeaveBalance(
  req: ContextRequest,
  res: Response
): Promise<void> {
  try {
    const { companyId } = getRequiredCompanyContext(req);
    const userId = routeParamString(req.params.userId);

    if (!userId) {
      res.status(400).json({ success: false, error: "userId is required" });
      return;
    }

    const restrict = branchRestrictOr403(req, res);
    if (restrict === null) {
      return;
    }

    const result = await leaveBalanceService.getUserLeaveBalances(
      userId,
      companyId,
      restrict
    );

    if (result.error) {
      res.status(404).json({ success: false, error: result.error });
      return;
    }
    const compensationByType = await compensationByTypeForCompany(companyId);
    const apiList = toLeaveBalanceApiList(result.data ?? [], compensationByType);
    res.json({ success: true, data: apiList });
  } catch (err) {
    console.error("getUserLeaveBalance error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function createLeaveBalance(
  req: ContextRequest,
  res: Response
): Promise<void> {
  try {
    const { companyId } = getRequiredCompanyContext(req);
    const body = req.body ?? {};
    const user_id =
      typeof body.user_id === "string" ? body.user_id.trim() : undefined;
    const leave_type =
      typeof body.leave_type === "string" ? body.leave_type.trim() : "annual";
    const total_days = body.total_days;

    if (!user_id) {
      res.status(400).json({ success: false, error: "user_id is required" });
      return;
    }

    const restrict = branchRestrictOr403(req, res);
    if (restrict === null) {
      return;
    }

    const result = await leaveBalanceService.createLeaveBalance(
      user_id,
      companyId,
      { user_id, leave_type, total_days },
      restrict
    );

    if (result.error) {
      const status = result.error === "User not found" ? 404 : 400;
      res.status(status).json({ success: false, error: result.error });
      return;
    }
    if (!result.data) {
      res.status(400).json({ success: false, error: "Failed to create leave balance" });
      return;
    }
    try {
      await auditService.logAction(
        companyId,
        req.context!.userId,
        "leave_balance_created",
        "leave_balance",
        result.data.id,
        {
          user_id: result.data.user_id,
          leave_type: result.data.leave_type,
          total_days: result.data.total_days,
          used_days: result.data.used_days,
        }
      );
    } catch (auditErr) {
      console.error("Audit log leave_balance_created error", auditErr);
    }
    const compensationByType = await compensationByTypeForCompany(companyId);
    res.status(201).json({
      success: true,
      data: toLeaveBalanceApi(result.data, compensationByType),
    });
  } catch (err) {
    console.error("createLeaveBalance error", err);
    const code = (err as { code?: string }).code;
    if (code === "23505") {
      res.status(409).json({
        success: false,
        error: "Leave balance for this type already exists. Refresh and try again.",
      });
      return;
    }
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function updateLeaveBalance(
  req: ContextRequest,
  res: Response
): Promise<void> {
  try {
    const { companyId, userId: actorUserId } = getRequiredCompanyContext(req);
    const id = routeParamString(req.params.id);
    const body = req.body ?? {};
    const total_days = body.total_days;

    if (!id) {
      res.status(400).json({ success: false, error: "id is required" });
      return;
    }

    const restrict = branchRestrictOr403(req, res);
    if (restrict === null) {
      return;
    }

    const result = await leaveBalanceService.updateLeaveBalance(
      id,
      companyId,
      { total_days },
      restrict
    );

    if (result.error) {
      const status = result.error === "Leave balance not found" ? 404 : 400;
      res.status(status).json({ success: false, error: result.error });
      return;
    }
    if (!result.data) {
      res.status(400).json({ success: false, error: "Failed to update leave balance" });
      return;
    }
    try {
      await auditService.logAction(
        companyId,
        actorUserId,
        "leave_balance_updated",
        "leave_balance",
        id,
        {
          leave_type: result.data.leave_type,
          total_days: result.data.total_days,
          used_days: result.data.used_days,
        }
      );
    } catch (auditErr) {
      console.error("Audit log leave_balance_updated error", auditErr);
    }
    const compensationByType = await compensationByTypeForCompany(companyId);
    res.json({
      success: true,
      data: toLeaveBalanceApi(result.data, compensationByType),
    });
  } catch (err) {
    console.error("updateLeaveBalance error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}
