import * as repo from "./leave.repository";
import * as balanceRepo from "./leaveBalance.repository";
import {
  formatLeaveTypesList,
  leaveTypeLabel,
  normalizeLeaveType,
} from "./leaveTypes";
import { resolveLeaveCompensationForCompany } from "./leaveTypePolicy.service";
import {
  notifyLeaveOutcome,
  notifyLeaveSubmitted,
  notifyLeaveCancelled,
  notifyLeaveTerminated,
} from "../notifications/operationalNotifications.service";
import { completeExpiredApprovedLeaves } from "./leaveCompletion.service";
import { isApprovedLeaveActive } from "./leaveLifecycle";
import { scheduleLeavePayrollResyncForLeaveRecord } from "../payroll/leavePayrollResync";

export interface RequestLeaveInput {
  start_date: string;
  end_date: string;
  leave_type: string;
  reason?: string | null;
}

export interface ServiceResult<T> {
  data: T | null;
  error?: string;
}

function trim(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() || undefined : undefined;
}

async function safeNotifyLeaveOutcome(
  label: string,
  fn: () => Promise<void>
): Promise<void> {
  try {
    await fn();
  } catch (err) {
    console.warn(`[notifications] ${label} failed`, err);
  }
}

export async function requestLeave(
  userId: string,
  companyId: string,
  data: RequestLeaveInput
): Promise<ServiceResult<repo.LeaveRequestRecord>> {
  const startDateStr = trim(data.start_date);
  const endDateStr = trim(data.end_date);
  const leaveTypeRaw = trim(data.leave_type);
  const leaveType = leaveTypeRaw ? normalizeLeaveType(leaveTypeRaw) : null;
  const reason = data.reason !== undefined ? trim(data.reason) ?? null : null;

  if (!startDateStr || !endDateStr) {
    return { data: null, error: "start_date and end_date are required" };
  }
  if (!leaveType) {
    return {
      data: null,
      error: `leave_type is required and must be one of: ${formatLeaveTypesList()}`,
    };
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { data: null, error: "Invalid date format" };
  }

  if (startDate > endDate) {
    return { data: null, error: "start_date must be before or equal to end_date" };
  }

  const diffMs = endDate.getTime() - startDate.getTime();
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

  if (totalDays < 1) {
    return { data: null, error: "Invalid date range" };
  }

  const balance = await balanceRepo.getLeaveBalanceByType(userId, companyId, leaveType);
  if (!balance) {
    return {
      data: null,
      error: `No ${leaveTypeLabel(leaveType)} leave balance is set up for your account. Ask HR to assign allocation for this leave type.`,
    };
  }
  const remaining = (balance.total_days ?? 0) - (balance.used_days ?? 0);
  if (totalDays > remaining) {
    return {
      data: null,
      error: `Insufficient ${leaveTypeLabel(leaveType)} leave balance (${remaining} day${remaining === 1 ? "" : "s"} remaining, ${totalDays} requested).`,
    };
  }

  const compensation = await resolveLeaveCompensationForCompany(companyId, leaveType);

  const request = await repo.createLeaveRequest({
    user_id: userId,
    company_id: companyId,
    start_date: startDateStr,
    end_date: endDateStr,
    leave_type: leaveType,
    leave_compensation_type: compensation,
    leave_compensation_default: compensation,
    reason,
    total_days: totalDays,
    status: "pending",
  });

  notifyLeaveSubmitted({
    companyId,
    employeeUserId: userId,
    leaveId: request.id,
    startDate: startDateStr,
    endDate: endDateStr,
    leaveType,
  }).catch((err) => console.warn("notifyLeaveSubmitted", err));

  return { data: request };
}

/** When `allowedUserIds` is set, the leave request’s employee must be in that set (manager/HR branch). */
export interface LeaveActionScope {
  allowedUserIds?: string[] | null;
}

function normalizeCompensationInput(
  raw: string | null | undefined
): "paid" | "unpaid" | null {
  if (raw == null) return null;
  const t = String(raw).trim().toLowerCase();
  if (t === "paid" || t === "unpaid") return t;
  return null;
}

export type LeaveCompensationOverrideResult = ServiceResult<repo.LeaveRequestRecord> & {
  previous_compensation?: "paid" | "unpaid";
  new_compensation?: "paid" | "unpaid";
  changed?: boolean;
  override_reason?: string | null;
};

const MAX_OVERRIDE_REASON_LEN = 500;

function normalizeOverrideReason(raw: string | null | undefined): string {
  return typeof raw === "string" ? raw.trim() : "";
}

/**
 * HR/Admin override of leave_compensation_type while the request is still pending.
 * Does not modify company_leave_type_policies. Immutable after approval.
 * When final compensation differs from company default, override reason is required.
 */
export async function updateLeaveCompensation(
  leaveId: string,
  companyId: string,
  compensationRaw: string,
  scope?: LeaveActionScope,
  overrideReasonRaw?: string | null
): Promise<LeaveCompensationOverrideResult> {
  const compensation = normalizeCompensationInput(compensationRaw);
  if (!compensation) {
    return { data: null, error: 'compensation_type must be "paid" or "unpaid"' };
  }

  const leave = await repo.getLeaveById(leaveId);
  if (!leave || leave.company_id !== companyId) {
    return { data: null, error: "Leave request not found" };
  }
  if (scope?.allowedUserIds != null && !scope.allowedUserIds.includes(leave.user_id)) {
    return { data: null, error: "Leave request not found" };
  }
  if ((leave.status ?? "").toLowerCase() !== "pending") {
    return {
      data: null,
      error: "Compensation can only be changed on pending leave requests",
    };
  }

  const previous =
    normalizeCompensationInput(leave.leave_compensation_type) ??
    normalizeCompensationInput(leave.leave_compensation_default) ??
    "paid";
  const companyDefault =
    normalizeCompensationInput(leave.leave_compensation_default) ?? previous;
  const differsFromDefault = compensation !== companyDefault;
  const reason = normalizeOverrideReason(overrideReasonRaw);
  const existingReason = normalizeOverrideReason(leave.leave_override_reason);

  if (differsFromDefault) {
    if (!reason) {
      // Allow no-op when already overridden with same compensation + existing reason
      if (previous === compensation && existingReason) {
        return {
          data: leave,
          previous_compensation: previous,
          new_compensation: compensation,
          changed: false,
          override_reason: existingReason,
        };
      }
      return {
        data: null,
        error: "Override reason is required when compensation differs from the company default",
      };
    }
    if (reason.length > MAX_OVERRIDE_REASON_LEN) {
      return {
        data: null,
        error: `Override reason must be at most ${MAX_OVERRIDE_REASON_LEN} characters`,
      };
    }
  }

  const nextReason = differsFromDefault ? reason || existingReason : null;

  if (
    previous === compensation &&
    normalizeOverrideReason(leave.leave_override_reason) === (nextReason ?? "")
  ) {
    return {
      data: leave,
      previous_compensation: previous,
      new_compensation: compensation,
      changed: false,
      override_reason: nextReason,
    };
  }

  const updated = await repo.updateLeaveCompensationType(
    leaveId,
    companyId,
    compensation,
    nextReason
  );
  if (!updated) {
    return {
      data: null,
      error: "Compensation can only be changed on pending leave requests",
    };
  }

  return {
    data: updated,
    previous_compensation: previous,
    new_compensation: compensation,
    changed: true,
    override_reason: nextReason,
  };
}

export async function approveLeave(
  leaveId: string,
  companyId: string,
  approverId: string,
  scope?: LeaveActionScope
): Promise<ServiceResult<repo.LeaveRequestRecord>> {
  const leave = await repo.getLeaveById(leaveId);
  if (!leave) {
    return { data: null, error: "Leave request not found" };
  }
  if (leave.company_id !== companyId) {
    return { data: null, error: "Leave request not found" };
  }
  if (scope?.allowedUserIds != null && !scope.allowedUserIds.includes(leave.user_id)) {
    return { data: null, error: "Leave request not found" };
  }
  if (leave.status !== "pending") {
    return { data: null, error: "Leave request is not pending" };
  }

  try {
    const updated = await repo.approveLeaveRequestTransaction(
      leaveId,
      companyId,
      approverId
    );
    await safeNotifyLeaveOutcome("notifyLeaveApproved", () =>
      notifyLeaveOutcome({
        companyId,
        employeeUserId: updated.user_id,
        leave: updated,
        outcome: "approved",
        reviewerUserId: approverId,
      })
    );
    scheduleLeavePayrollResyncForLeaveRecord(updated);
    return { data: updated };
  } catch (err) {
    const e = err as Error & { code?: string };
    const code = e.code ?? "";
    if (code === "leave_not_found") {
      return { data: null, error: "Leave request not found" };
    }
    if (code === "leave_not_pending") {
      return { data: null, error: "Leave request is not pending" };
    }
    if (code === "leave_balance_missing") {
      const typeLabel = leaveTypeLabel(leave.leave_type);
      return {
        data: null,
        error: `Cannot approve: no ${typeLabel} leave balance exists for this employee. Set allocation before approving.`,
      };
    }
    if (code === "leave_balance_insufficient") {
      const typeLabel = leaveTypeLabel(leave.leave_type);
      return {
        data: null,
        error: `Cannot approve: insufficient ${typeLabel} leave balance for ${leave.total_days} day(s).`,
      };
    }
    console.error("approveLeave transaction error", err);
    return { data: null, error: "Failed to approve leave request" };
  }
}

export async function rejectLeave(
  leaveId: string,
  companyId: string,
  reviewerId: string,
  scope?: LeaveActionScope
): Promise<ServiceResult<repo.LeaveRequestRecord>> {
  const leave = await repo.getLeaveById(leaveId);
  if (!leave) {
    return { data: null, error: "Leave request not found" };
  }
  if (leave.company_id !== companyId) {
    return { data: null, error: "Leave request not found" };
  }
  if (scope?.allowedUserIds != null && !scope.allowedUserIds.includes(leave.user_id)) {
    return { data: null, error: "Leave request not found" };
  }
  if (leave.status !== "pending") {
    return { data: null, error: "Leave request is not pending" };
  }

  const now = new Date().toISOString();
  const updated = await repo.updateLeaveStatus(
    leaveId,
    "rejected",
    reviewerId,
    now
  );
  if (!updated) {
    return { data: null, error: "Failed to update leave request" };
  }

  await safeNotifyLeaveOutcome("notifyLeaveRejected", () =>
    notifyLeaveOutcome({
      companyId,
      employeeUserId: updated.user_id,
      leave: updated,
      outcome: "rejected",
      reviewerUserId: reviewerId,
    })
  );

  return { data: updated };
}

export type ReviewLeaveAction = "approve" | "reject";

export async function reviewLeave(
  leaveId: string,
  companyId: string,
  reviewerId: string,
  action: ReviewLeaveAction,
  scope?: LeaveActionScope
): Promise<ServiceResult<repo.LeaveRequestRecord>> {
  if (action === "approve") {
    return approveLeave(leaveId, companyId, reviewerId, scope);
  }
  return rejectLeave(leaveId, companyId, reviewerId, scope);
}

async function reconcileExpiredApprovedLeave(companyId: string): Promise<void> {
  try {
    await completeExpiredApprovedLeaves({ companyId });
  } catch (err) {
    console.warn("[leave] completeExpiredApprovedLeaves failed", err);
  }
}

export async function getMyLeaveRequests(
  userId: string,
  companyId: string
): Promise<repo.LeaveRequestRecord[]> {
  await reconcileExpiredApprovedLeave(companyId);
  return repo.getUserLeaveRequests(userId, companyId);
}

export async function getCompanyLeaveRequests(
  companyId: string,
  statusFilter?: string | null,
  filterUserIds?: string[] | null
): Promise<repo.LeaveRequestRecord[]> {
  await reconcileExpiredApprovedLeave(companyId);
  return repo.getCompanyLeaveRequests(companyId, statusFilter, filterUserIds);
}

export async function getCurrentlyOnLeave(
  companyId: string,
  filterUserIds?: string[] | null,
  asOfDate?: string
): Promise<repo.LeaveRequestRecord[]> {
  await reconcileExpiredApprovedLeave(companyId);
  return repo.getCurrentlyOnLeave(companyId, asOfDate, filterUserIds);
}

export async function cancelPendingLeave(
  userId: string,
  companyId: string,
  leaveId: string
): Promise<ServiceResult<repo.LeaveRequestRecord>> {
  const leave = await repo.getLeaveById(leaveId);
  if (!leave) return { data: null, error: "Leave request not found" };
  if (leave.company_id !== companyId) return { data: null, error: "Leave request not found" };
  if (leave.user_id !== userId) return { data: null, error: "Leave request not found" };
  if (leave.status !== "pending") return { data: null, error: "Leave request is not pending" };

  const now = new Date().toISOString();
  const updated = await repo.cancelPendingLeaveRequest({
    leaveId,
    companyId,
    userId,
    cancelledAtIso: now,
  });
  if (!updated) return { data: null, error: "Leave request not found" };

  safeNotifyLeaveOutcome("notifyLeaveCancelled", () =>
    notifyLeaveCancelled({
      companyId,
      employeeUserId: userId,
      leave: updated,
    })
  ).catch(() => null);

  return { data: updated };
}

export async function terminateApprovedLeave(params: {
  leaveId: string;
  companyId: string;
  terminatorId: string;
  actualReturnDate: string;
  reason?: string | null;
  scope?: LeaveActionScope;
}): Promise<ServiceResult<repo.LeaveRequestRecord>> {
  const leave = await repo.getLeaveById(params.leaveId);
  if (!leave) return { data: null, error: "Leave request not found" };
  if (leave.company_id !== params.companyId) return { data: null, error: "Leave request not found" };
  if (params.scope?.allowedUserIds != null && !params.scope.allowedUserIds.includes(leave.user_id)) {
    return { data: null, error: "Leave request not found" };
  }
  if (leave.status !== "approved") return { data: null, error: "Leave request is not approved" };
  if (!isApprovedLeaveActive(leave)) {
    return { data: null, error: "Leave request is not active" };
  }

  try {
    const updated = await repo.terminateLeaveRequestTransaction({
      leaveId: params.leaveId,
      companyId: params.companyId,
      terminatorId: params.terminatorId,
      actualReturnDate: params.actualReturnDate,
      reason: params.reason ?? null,
    });

    safeNotifyLeaveOutcome("notifyLeaveTerminated", () =>
      notifyLeaveTerminated({
        companyId: params.companyId,
        employeeUserId: updated.user_id,
        leave: updated,
        terminatorUserId: params.terminatorId,
      })
    ).catch(() => null);

    scheduleLeavePayrollResyncForLeaveRecord(updated);

    return { data: updated };
  } catch (err) {
    const e = err as Error & { code?: string };
    const code = e.code ?? "";
    if (code === "leave_not_found") return { data: null, error: "Leave request not found" };
    if (code === "leave_not_approved") return { data: null, error: "Leave request is not approved" };
    if (code === "leave_not_active") return { data: null, error: "Leave request is not active" };
    if (code === "invalid_return_date") {
      return {
        data: null,
        error:
          "Return date must be the first day back at work, from leave start through the day after approved end.",
      };
    }
    if (code === "leave_balance_missing") {
      const typeLabel = leaveTypeLabel(leave.leave_type);
      return { data: null, error: `Cannot terminate: no ${typeLabel} leave balance exists for this employee.` };
    }
    if (code === "leave_balance_restore_exceeds") {
      return { data: null, error: "Cannot terminate: restored days exceed deducted days" };
    }
    console.error("terminateApprovedLeave transaction error", err);
    return { data: null, error: "Failed to terminate leave request" };
  }
}
