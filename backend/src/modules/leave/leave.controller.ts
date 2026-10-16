import { Response } from "express";
import { ContextRequest } from "../../middleware/context.middleware";
import { getRequiredCompanyContext } from "../../lib/companyRequestContext";
import { routeParamString } from "../../lib/routeParams";
import * as leaveService from "./leave.service";
import * as auditService from "../audit/audit.service";
import { toLeaveApi, toLeaveApiList, toCurrentlyOnLeaveApiList } from "./leave.mapper";
import { todayYmd } from "./leaveLifecycle";
import { resolveManagerListUserIdsForLeave } from "../../lib/resolveScopedUserIds";

function canOverrideLeaveCompensation(roles: string[] | undefined): boolean {
  if (!roles?.length) return false;
  return roles.some((r) => r === "admin" || r === "HR");
}

function compensationFromBody(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const b = body as Record<string, unknown>;
  if (typeof b.leave_compensation_type === "string") return b.leave_compensation_type;
  if (typeof b.compensation_type === "string") return b.compensation_type;
  return undefined;
}

function overrideReasonFromBody(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const b = body as Record<string, unknown>;
  if (typeof b.leave_override_reason === "string") return b.leave_override_reason;
  if (typeof b.override_reason === "string") return b.override_reason;
  return undefined;
}

async function applyCompensationOverrideIfRequested(params: {
  req: ContextRequest;
  leaveId: string;
  companyId: string;
  actorUserId: string;
  scope: leaveService.LeaveActionScope;
  compensationRaw: string | undefined;
  overrideReasonRaw?: string | undefined;
}): Promise<{ error?: string; status?: number }> {
  const raw = params.compensationRaw?.trim();
  if (!raw) return {};

  if (!canOverrideLeaveCompensation(params.req.context?.roles)) {
    return {
      error: "Only admin or HR can override leave compensation",
      status: 403,
    };
  }

  const result = await leaveService.updateLeaveCompensation(
    params.leaveId,
    params.companyId,
    raw,
    params.scope,
    params.overrideReasonRaw
  );

  if (result.error) {
    const status = result.error === "Leave request not found" ? 404 : 400;
    return { error: result.error, status };
  }

  if (result.changed) {
    try {
      await auditService.logAction(
        params.companyId,
        params.actorUserId,
        "leave_compensation_overridden",
        "leave_request",
        params.leaveId,
        {
          leave_request_id: params.leaveId,
          previous_compensation: result.previous_compensation,
          new_compensation: result.new_compensation,
          override_reason: result.override_reason ?? null,
        }
      );
    } catch (auditErr) {
      console.error("Audit log leave_compensation_overridden error", auditErr);
    }
  }

  return {};
}

export async function requestLeave(
  req: ContextRequest,
  res: Response
): Promise<void> {
  try {
    const { userId, companyId } = getRequiredCompanyContext(req);
    const { start_date, end_date, leave_type, reason } = req.body ?? {};

    const result = await leaveService.requestLeave(userId, companyId, {
      start_date,
      end_date,
      leave_type,
      reason,
    });

    if (result.error) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }
    if (!result.data) {
      res.status(400).json({ success: false, error: "Failed to create leave request" });
      return;
    }
    res.status(201).json({ success: true, data: toLeaveApi(result.data) });
  } catch (err) {
    console.error("requestLeave error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function getMyLeave(
  req: ContextRequest,
  res: Response
): Promise<void> {
  try {
    const { userId, companyId } = getRequiredCompanyContext(req);
    const requests = await leaveService.getMyLeaveRequests(userId, companyId);
    // Employee view: never expose HR-only override reason
    res.json({ success: true, data: toLeaveApiList(requests) });
  } catch (err) {
    console.error("getMyLeave error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function getCurrentlyOnLeave(
  req: ContextRequest,
  res: Response
): Promise<void> {
  try {
    const ctx = getRequiredCompanyContext(req);
    const { companyId } = ctx;
    const asOfDate =
      typeof req.query.as_of === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.as_of)
        ? req.query.as_of
        : todayYmd();
    const resolved = await resolveManagerListUserIdsForLeave(ctx, companyId);
    if (resolved.error) {
      res
        .status(resolved.error.status)
        .json({ success: false, error: resolved.error.message });
      return;
    }
    const rows = await leaveService.getCurrentlyOnLeave(
      companyId,
      resolved.scopedUserIds,
      asOfDate
    );
    res.json({ success: true, data: toCurrentlyOnLeaveApiList(rows, asOfDate) });
  } catch (err) {
    console.error("getCurrentlyOnLeave error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function getCompanyLeave(
  req: ContextRequest,
  res: Response
): Promise<void> {
  try {
    const ctx = getRequiredCompanyContext(req);
    const { companyId } = ctx;
    const statusRaw =
      typeof req.query.status === "string" ? req.query.status : undefined;
    const resolved = await resolveManagerListUserIdsForLeave(ctx, companyId);
    if (resolved.error) {
      res
        .status(resolved.error.status)
        .json({ success: false, error: resolved.error.message });
      return;
    }
    const requests = await leaveService.getCompanyLeaveRequests(
      companyId,
      statusRaw,
      resolved.scopedUserIds
    );
    res.json({
      success: true,
      data: toLeaveApiList(requests, { includeOverrideReason: true }),
    });
  } catch (err) {
    console.error("getCompanyLeave error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function approveLeave(
  req: ContextRequest,
  res: Response
): Promise<void> {
  try {
    const ctx = getRequiredCompanyContext(req);
    const { companyId, userId: approverId } = ctx;
    const leaveId = routeParamString(req.params.leaveId);

    if (!leaveId) {
      res.status(400).json({ success: false, error: "leaveId is required" });
      return;
    }

    const resolved = await resolveManagerListUserIdsForLeave(req.context!, companyId);
    if (resolved.error) {
      res
        .status(resolved.error.status)
        .json({ success: false, error: resolved.error.message });
      return;
    }

    const scope = { allowedUserIds: resolved.scopedUserIds };
    const override = await applyCompensationOverrideIfRequested({
      req,
      leaveId,
      companyId,
      actorUserId: approverId,
      scope,
      compensationRaw: compensationFromBody(req.body),
      overrideReasonRaw: overrideReasonFromBody(req.body),
    });
    if (override.error) {
      res.status(override.status ?? 400).json({ success: false, error: override.error });
      return;
    }

    const result = await leaveService.approveLeave(
      leaveId,
      companyId,
      approverId,
      scope
    );

    if (result.error) {
      const status =
        result.error === "Leave request not found" ? 404 : 400;
      res.status(status).json({ success: false, error: result.error });
      return;
    }
    if (!result.data) {
      res.status(400).json({ success: false, error: "Failed to approve leave" });
      return;
    }
    try {
      await auditService.logAction(
        companyId,
        approverId,
        "leave_approved",
        "leave_request",
        leaveId,
        { leave_request_id: leaveId }
      );
    } catch (auditErr) {
      console.error("Audit log leave_approved error", auditErr);
    }
    res.json({
      success: true,
      data: toLeaveApi(result.data, { includeOverrideReason: true }),
    });
  } catch (err) {
    console.error("approveLeave error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function reviewLeave(
  req: ContextRequest,
  res: Response
): Promise<void> {
  try {
    const ctx = getRequiredCompanyContext(req);
    const { companyId, userId: reviewerId } = ctx;
    const leaveId = routeParamString(req.params.leaveId);
    const action = (req.body?.action as string | undefined)?.toLowerCase();

    if (!leaveId) {
      res.status(400).json({ success: false, error: "leaveId is required" });
      return;
    }
    if (action !== "approve" && action !== "reject") {
      res.status(400).json({
        success: false,
        error: 'body.action must be "approve" or "reject"',
      });
      return;
    }

    const resolved = await resolveManagerListUserIdsForLeave(req.context!, companyId);
    if (resolved.error) {
      res
        .status(resolved.error.status)
        .json({ success: false, error: resolved.error.message });
      return;
    }

    const scope = { allowedUserIds: resolved.scopedUserIds };
    const override = await applyCompensationOverrideIfRequested({
      req,
      leaveId,
      companyId,
      actorUserId: reviewerId,
      scope,
      compensationRaw: compensationFromBody(req.body),
      overrideReasonRaw: overrideReasonFromBody(req.body),
    });
    if (override.error) {
      res.status(override.status ?? 400).json({ success: false, error: override.error });
      return;
    }

    const result = await leaveService.reviewLeave(
      leaveId,
      companyId,
      reviewerId,
      action,
      scope
    );

    if (result.error) {
      const status =
        result.error === "Leave request not found" ? 404 : 400;
      res.status(status).json({ success: false, error: result.error });
      return;
    }
    if (!result.data) {
      res.status(400).json({ success: false, error: "Failed to review leave" });
      return;
    }
    try {
      await auditService.logAction(
        companyId,
        reviewerId,
        action === "approve" ? "leave_approved" : "leave_rejected",
        "leave_request",
        leaveId,
        { leave_request_id: leaveId, via: "review" }
      );
    } catch (auditErr) {
      console.error("Audit log leave review error", auditErr);
    }
    res.json({
      success: true,
      data: toLeaveApi(result.data, { includeOverrideReason: true }),
    });
  } catch (err) {
    console.error("reviewLeave error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function updateLeaveCompensation(
  req: ContextRequest,
  res: Response
): Promise<void> {
  try {
    const ctx = getRequiredCompanyContext(req);
    const { companyId, userId: actorUserId } = ctx;
    const leaveId = routeParamString(req.params.leaveId);

    if (!leaveId) {
      res.status(400).json({ success: false, error: "leaveId is required" });
      return;
    }

    if (!canOverrideLeaveCompensation(req.context?.roles)) {
      res.status(403).json({
        success: false,
        error: "Only admin or HR can override leave compensation",
      });
      return;
    }

    const compensationRaw = compensationFromBody(req.body);
    if (!compensationRaw?.trim()) {
      res.status(400).json({
        success: false,
        error: 'body.leave_compensation_type must be "paid" or "unpaid"',
      });
      return;
    }

    const resolved = await resolveManagerListUserIdsForLeave(req.context!, companyId);
    if (resolved.error) {
      res
        .status(resolved.error.status)
        .json({ success: false, error: resolved.error.message });
      return;
    }

    const result = await leaveService.updateLeaveCompensation(
      leaveId,
      companyId,
      compensationRaw,
      { allowedUserIds: resolved.scopedUserIds },
      overrideReasonFromBody(req.body)
    );

    if (result.error || !result.data) {
      const status = result.error === "Leave request not found" ? 404 : 400;
      res.status(status).json({
        success: false,
        error: result.error ?? "Failed to update compensation",
      });
      return;
    }

    if (result.changed) {
      try {
        await auditService.logAction(
          companyId,
          actorUserId,
          "leave_compensation_overridden",
          "leave_request",
          leaveId,
          {
            leave_request_id: leaveId,
            previous_compensation: result.previous_compensation,
            new_compensation: result.new_compensation,
            override_reason: result.override_reason ?? null,
          }
        );
      } catch (auditErr) {
        console.error("Audit log leave_compensation_overridden error", auditErr);
      }
    }

    res.json({
      success: true,
      data: toLeaveApi(result.data, { includeOverrideReason: true }),
    });
  } catch (err) {
    console.error("updateLeaveCompensation error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function rejectLeave(
  req: ContextRequest,
  res: Response
): Promise<void> {
  try {
    const ctx = getRequiredCompanyContext(req);
    const { companyId, userId: reviewerId } = ctx;
    const leaveId = routeParamString(req.params.leaveId);

    if (!leaveId) {
      res.status(400).json({ success: false, error: "leaveId is required" });
      return;
    }

    const resolved = await resolveManagerListUserIdsForLeave(ctx, companyId);
    if (resolved.error) {
      res
        .status(resolved.error.status)
        .json({ success: false, error: resolved.error.message });
      return;
    }

    const scope = { allowedUserIds: resolved.scopedUserIds };
    const override = await applyCompensationOverrideIfRequested({
      req,
      leaveId,
      companyId,
      actorUserId: reviewerId,
      scope,
      compensationRaw: compensationFromBody(req.body),
      overrideReasonRaw: overrideReasonFromBody(req.body),
    });
    if (override.error) {
      res.status(override.status ?? 400).json({ success: false, error: override.error });
      return;
    }

    const result = await leaveService.rejectLeave(leaveId, companyId, reviewerId, scope);

    if (result.error) {
      const status =
        result.error === "Leave request not found" ? 404 : 400;
      res.status(status).json({ success: false, error: result.error });
      return;
    }
    if (!result.data) {
      res.status(400).json({ success: false, error: "Failed to reject leave" });
      return;
    }
    try {
      await auditService.logAction(
        companyId,
        reviewerId,
        "leave_rejected",
        "leave_request",
        leaveId,
        { leave_request_id: leaveId }
      );
    } catch (auditErr) {
      console.error("Audit log leave_rejected error", auditErr);
    }
    res.json({
      success: true,
      data: toLeaveApi(result.data, { includeOverrideReason: true }),
    });
  } catch (err) {
    console.error("rejectLeave error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function cancelLeave(
  req: ContextRequest,
  res: Response
): Promise<void> {
  try {
    const { userId, companyId } = getRequiredCompanyContext(req);
    const leaveId = routeParamString(req.params.leaveId);

    if (!leaveId) {
      res.status(400).json({ success: false, error: "leaveId is required" });
      return;
    }

    const result = await leaveService.cancelPendingLeave(userId, companyId, leaveId);
    if (result.error) {
      const status = result.error === "Leave request not found" ? 404 : 400;
      res.status(status).json({ success: false, error: result.error });
      return;
    }
    if (!result.data) {
      res.status(400).json({ success: false, error: "Failed to cancel leave request" });
      return;
    }

    try {
      await auditService.logAction(
        companyId,
        userId,
        "leave_cancelled",
        "leave_request",
        leaveId,
        { leave_request_id: leaveId }
      );
    } catch (auditErr) {
      console.error("Audit log leave_cancelled error", auditErr);
    }

    res.json({ success: true, data: toLeaveApi(result.data) });
  } catch (err) {
    console.error("cancelLeave error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function terminateLeave(
  req: ContextRequest,
  res: Response
): Promise<void> {
  try {
    const ctx = getRequiredCompanyContext(req);
    const { companyId, userId: terminatorId } = ctx;
    const leaveId = routeParamString(req.params.leaveId);
    const actual_return_date = typeof req.body?.actual_return_date === "string" ? req.body.actual_return_date : "";
    const reason = typeof req.body?.reason === "string" ? req.body.reason : null;

    if (!leaveId) {
      res.status(400).json({ success: false, error: "leaveId is required" });
      return;
    }
    if (!actual_return_date.trim()) {
      res.status(400).json({ success: false, error: "actual_return_date is required" });
      return;
    }

    const resolved = await resolveManagerListUserIdsForLeave(req.context!, companyId);
    if (resolved.error) {
      res
        .status(resolved.error.status)
        .json({ success: false, error: resolved.error.message });
      return;
    }

    const result = await leaveService.terminateApprovedLeave({
      leaveId,
      companyId,
      terminatorId,
      actualReturnDate: actual_return_date.trim(),
      reason,
      scope: { allowedUserIds: resolved.scopedUserIds },
    });

    if (result.error) {
      const status = result.error === "Leave request not found" ? 404 : 400;
      res.status(status).json({ success: false, error: result.error });
      return;
    }
    if (!result.data) {
      res.status(400).json({ success: false, error: "Failed to terminate leave request" });
      return;
    }

    try {
      await auditService.logAction(
        companyId,
        terminatorId,
        "leave_terminated",
        "leave_request",
        leaveId,
        {
          leave_request_id: leaveId,
          actual_return_date: actual_return_date.trim(),
          restored_days: result.data.restored_days ?? null,
        }
      );
    } catch (auditErr) {
      console.error("Audit log leave_terminated error", auditErr);
    }

    res.json({ success: true, data: toLeaveApi(result.data) });
  } catch (err) {
    console.error("terminateLeave error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}
