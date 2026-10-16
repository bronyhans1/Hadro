import * as usersRepo from "../users/users.repository";
import { formatLeaveDateYmd } from "../../lib/leaveDates";
import { NotificationType } from "./notificationTypes";
import { dispatchNotification, dispatchToMany } from "./notificationDispatch.service";
import * as repo from "./notifications.repository";
import type { LeaveRequestRecord } from "../leave/leave.repository";

async function reviewerDisplayName(reviewerUserId: string | undefined): Promise<string | null> {
  if (!reviewerUserId) return null;
  const reviewer = await usersRepo.getUserById(reviewerUserId);
  if (!reviewer) return null;
  const name = [reviewer.first_name, reviewer.last_name].filter(Boolean).join(" ").trim();
  return name || null;
}

export async function notifyLeaveSubmitted(params: {
  companyId: string;
  employeeUserId: string;
  leaveId: string;
  startDate: string;
  endDate: string;
  leaveType: string;
}): Promise<void> {
  const employee = await usersRepo.getUserById(params.employeeUserId);
  const name =
    employee
      ? [employee.first_name, employee.last_name].filter(Boolean).join(" ").trim()
      : "An employee";

  await dispatchNotification({
    companyId: params.companyId,
    userId: params.employeeUserId,
    type: NotificationType.LEAVE_SUBMITTED,
    title: "Leave request submitted",
    body: `Your ${params.leaveType} request (${params.startDate} → ${params.endDate}) is pending approval.`,
    dedupeKey: `leave_submitted:${params.leaveId}:employee`,
    metadata: {
      leave_id: params.leaveId,
      leave_type: params.leaveType,
      status: "pending",
    },
    sendEmail: true,
  });

  const reviewers = await repo.listUserIdsByRoleNames(params.companyId, [
    "admin",
    "manager",
    "HR",
  ]);
  const targets = reviewers.filter((id) => id !== params.employeeUserId);
  await dispatchToMany(targets, {
    companyId: params.companyId,
    type: NotificationType.LEAVE_PENDING_REVIEW,
    title: "Leave needs review",
    body: `${name} requested ${params.leaveType} (${params.startDate} → ${params.endDate}).`,
    dedupeKey: `leave_pending:${params.leaveId}`,
    metadata: {
      leave_id: params.leaveId,
      employee_user_id: params.employeeUserId,
      leave_type: params.leaveType,
      status: "pending",
    },
    sendEmail: true,
  });
}

/**
 * Notify the requesting employee after leave status leaves pending (approved/rejected).
 */
export async function notifyLeaveOutcome(params: {
  companyId: string;
  employeeUserId: string;
  leave: Pick<
    LeaveRequestRecord,
    "id" | "start_date" | "end_date" | "leave_type" | "status"
  >;
  outcome: "approved" | "rejected";
  reviewerUserId: string;
}): Promise<void> {
  const startDate = formatLeaveDateYmd(params.leave.start_date);
  const endDate = formatLeaveDateYmd(params.leave.end_date);
  const leaveType = params.leave.leave_type?.trim() || "leave";
  const reviewerName = await reviewerDisplayName(params.reviewerUserId);
  const byReviewer = reviewerName ? ` by ${reviewerName}` : "";

  if (params.outcome === "approved") {
    await dispatchNotification({
      companyId: params.companyId,
      userId: params.employeeUserId,
      type: NotificationType.LEAVE_APPROVED,
      title: "Leave approved",
      body: `Your ${leaveType} request (${startDate} → ${endDate}) was approved${byReviewer}.`,
      dedupeKey: `leave_approved:${params.leave.id}`,
      metadata: {
        leave_id: params.leave.id,
        leave_type: leaveType,
        status: "approved",
        reviewer_user_id: params.reviewerUserId,
        reviewer_name: reviewerName,
      },
      sendEmail: true,
    });
    return;
  }

  await dispatchNotification({
    companyId: params.companyId,
    userId: params.employeeUserId,
    type: NotificationType.LEAVE_REJECTED,
    title: "Leave rejected",
    body: `Your ${leaveType} request (${startDate} → ${endDate}) was not approved${byReviewer}.`,
    dedupeKey: `leave_rejected:${params.leave.id}`,
    metadata: {
      leave_id: params.leave.id,
      leave_type: leaveType,
      status: "rejected",
      reviewer_user_id: params.reviewerUserId,
      reviewer_name: reviewerName,
    },
    sendEmail: true,
  });
}

export async function notifyLeaveCancelled(params: {
  companyId: string;
  employeeUserId: string;
  leave: Pick<
    LeaveRequestRecord,
    "id" | "start_date" | "end_date" | "leave_type" | "status"
  > & {
    employee_name?: string | null;
    employee_email?: string | null;
  };
}): Promise<void> {
  const name =
    params.leave.employee_name?.trim() ||
    params.leave.employee_email?.trim() ||
    "An employee";
  const leaveType = params.leave.leave_type?.trim() || "leave";
  const startDate = formatLeaveDateYmd(params.leave.start_date);
  const endDate = formatLeaveDateYmd(params.leave.end_date);

  const reviewers = await repo.listUserIdsByRoleNames(params.companyId, [
    "admin",
    "manager",
    "HR",
  ]);
  const targets = reviewers.filter((id) => id !== params.employeeUserId);
  await dispatchToMany(targets, {
    companyId: params.companyId,
    type: NotificationType.LEAVE_CANCELLED,
    title: "Leave request cancelled",
    body: `${name} cancelled a ${leaveType} request (${startDate} → ${endDate}).`,
    dedupeKey: `leave_cancelled:${params.leave.id}`,
    metadata: {
      leave_id: params.leave.id,
      employee_user_id: params.employeeUserId,
      leave_type: leaveType,
      status: "cancelled",
    },
    sendEmail: true,
  });
}

export async function notifyLeaveTerminated(params: {
  companyId: string;
  employeeUserId: string;
  leave: Pick<
    LeaveRequestRecord,
    "id" | "start_date" | "end_date" | "leave_type" | "status"
  > & {
    restored_days?: number | null;
    actual_return_date?: string | null;
  };
  terminatorUserId: string;
}): Promise<void> {
  const leaveType = params.leave.leave_type?.trim() || "leave";
  const startDate = formatLeaveDateYmd(params.leave.start_date);
  const endDate = formatLeaveDateYmd(params.leave.end_date);
  const restored = Number(params.leave.restored_days ?? 0);
  const restoredText =
    restored > 0 ? ` ${restored} day${restored === 1 ? "" : "s"} were restored.` : "";

  await dispatchNotification({
    companyId: params.companyId,
    userId: params.employeeUserId,
    type: NotificationType.LEAVE_TERMINATED,
    title: "Leave terminated early",
    body: `Your ${leaveType} leave (${startDate} → ${endDate}) was terminated early.${restoredText}`,
    dedupeKey: `leave_terminated:${params.leave.id}:employee`,
    metadata: {
      leave_id: params.leave.id,
      leave_type: leaveType,
      status: "terminated",
      restored_days: restored,
      actual_return_date: params.leave.actual_return_date,
      terminated_by: params.terminatorUserId,
    },
    sendEmail: true,
  });

  const reviewers = await repo.listUserIdsByRoleNames(params.companyId, [
    "admin",
    "manager",
    "HR",
  ]);
  const targets = reviewers.filter(
    (id) => id !== params.employeeUserId && id !== params.terminatorUserId
  );
  if (targets.length === 0) return;

  await dispatchToMany(targets, {
    companyId: params.companyId,
    type: NotificationType.LEAVE_TERMINATED,
    title: "Leave terminated early",
    body: `An employee’s ${leaveType} leave (${startDate} → ${endDate}) was terminated early.${restoredText}`,
    dedupeKey: `leave_terminated:${params.leave.id}:reviewers`,
    metadata: {
      leave_id: params.leave.id,
      employee_user_id: params.employeeUserId,
      leave_type: leaveType,
      status: "terminated",
      restored_days: restored,
      actual_return_date: params.leave.actual_return_date,
      terminated_by: params.terminatorUserId,
    },
    sendEmail: true,
  });
}

/** @deprecated Use notifyLeaveOutcome — kept for direct imports/tests. */
export async function notifyLeaveApproved(params: {
  companyId: string;
  employeeUserId: string;
  leaveId: string;
  startDate: string;
  endDate: string;
  leaveType?: string;
  reviewerUserId?: string;
}): Promise<void> {
  await notifyLeaveOutcome({
    companyId: params.companyId,
    employeeUserId: params.employeeUserId,
    leave: {
      id: params.leaveId,
      start_date: params.startDate,
      end_date: params.endDate,
      leave_type: params.leaveType ?? "leave",
      status: "approved",
    },
    outcome: "approved",
    reviewerUserId: params.reviewerUserId ?? "",
  });
}

/** @deprecated Use notifyLeaveOutcome — kept for direct imports/tests. */
export async function notifyLeaveRejected(params: {
  companyId: string;
  employeeUserId: string;
  leaveId: string;
  startDate: string;
  endDate: string;
  leaveType?: string;
  reviewerUserId?: string;
}): Promise<void> {
  await notifyLeaveOutcome({
    companyId: params.companyId,
    employeeUserId: params.employeeUserId,
    leave: {
      id: params.leaveId,
      start_date: params.startDate,
      end_date: params.endDate,
      leave_type: params.leaveType ?? "leave",
      status: "rejected",
    },
    outcome: "rejected",
    reviewerUserId: params.reviewerUserId ?? "",
  });
}

export async function notifyPayrollSyncFailure(params: {
  companyId: string;
  userId: string;
  failureKind: string;
  errorMessage: string;
  workSessionId?: string | null;
}): Promise<void> {
  const dedupeKey = `payroll_sync:${params.failureKind}:${params.userId}:${params.workSessionId ?? "monthly"}:${new Date().toISOString().slice(0, 10)}`;
  const hrAdmins = await repo.listUserIdsByRoleNames(params.companyId, ["admin", "HR"]);
  const targets = [...new Set([...hrAdmins, params.userId])];
  await dispatchToMany(targets, {
    companyId: params.companyId,
    type: NotificationType.PAYROLL_SYNC_FAILURE,
    title: "Payroll sync issue",
    body: `Payroll could not be updated (${params.failureKind}). Ask HR to review sync failures.`,
    dedupeKey,
    metadata: {
      failure_kind: params.failureKind,
      work_session_id: params.workSessionId,
      error_preview: params.errorMessage.slice(0, 200),
    },
    sendEmail: true,
  });
}

export async function notifyPayrollExportReady(params: {
  companyId: string;
  userId: string;
  year: number;
  month: number;
  format: "csv" | "xlsx";
}): Promise<void> {
  await dispatchNotification({
    companyId: params.companyId,
    userId: params.userId,
    type: NotificationType.PAYROLL_EXPORT_READY,
    title: "Payroll export ready",
    body: `Your ${params.format.toUpperCase()} export for ${params.year}-${String(params.month).padStart(2, "0")} completed.`,
    dedupeKey: `payroll_export:${params.userId}:${params.year}:${params.month}:${params.format}`,
    metadata: { year: params.year, month: params.month, format: params.format },
    sendEmail: false,
  });
}
