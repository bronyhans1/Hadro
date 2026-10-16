import * as usersRepo from "../users/users.repository";
import { NotificationType } from "./notificationTypes";
import { dispatchNotification, dispatchToMany } from "./notificationDispatch.service";
import * as repo from "./notifications.repository";

async function employeeDisplayName(userId: string): Promise<string> {
  const employee = await usersRepo.getUserById(userId);
  if (!employee) return "An employee";
  const name = [employee.first_name, employee.last_name].filter(Boolean).join(" ").trim();
  return name || employee.email || "An employee";
}

export async function notifyRemoteSessionSubmitted(params: {
  companyId: string;
  employeeUserId: string;
  sessionId: string;
  checkInIso: string;
}): Promise<void> {
  const name = await employeeDisplayName(params.employeeUserId);
  const timeLabel = new Date(params.checkInIso).toISOString().replace("T", " ").slice(0, 16);

  const reviewers = await repo.listUserIdsByRoleNames(params.companyId, [
    "admin",
    "manager",
    "HR",
  ]);
  const targets = reviewers.filter((id) => id !== params.employeeUserId);

  await dispatchToMany(targets, {
    companyId: params.companyId,
    type: NotificationType.REMOTE_ATTENDANCE_PENDING,
    title: "Remote attendance needs review",
    body: `${name} clocked in remotely at ${timeLabel}.`,
    dedupeKey: `remote_pending:${params.sessionId}`,
    metadata: {
      session_id: params.sessionId,
      employee_user_id: params.employeeUserId,
      status: "pending",
    },
    sendEmail: true,
  });
}

export async function notifyRemoteSessionApproved(params: {
  companyId: string;
  employeeUserId: string;
  sessionId: string;
  reviewerUserId: string;
}): Promise<void> {
  await dispatchNotification({
    companyId: params.companyId,
    userId: params.employeeUserId,
    type: NotificationType.REMOTE_ATTENDANCE_APPROVED,
    title: "Remote attendance approved",
    body: "Your remote session was approved. Payroll will be processed if applicable.",
    dedupeKey: `remote_approved:${params.sessionId}:employee`,
    metadata: {
      session_id: params.sessionId,
      status: "approved",
      reviewer_user_id: params.reviewerUserId,
    },
    sendEmail: true,
  });
}

export async function notifyRemoteSessionRejected(params: {
  companyId: string;
  employeeUserId: string;
  sessionId: string;
  reviewerUserId: string;
  reviewNote?: string | null;
}): Promise<void> {
  const noteSuffix = params.reviewNote?.trim()
    ? ` Note: ${params.reviewNote.trim()}`
    : "";

  await dispatchNotification({
    companyId: params.companyId,
    userId: params.employeeUserId,
    type: NotificationType.REMOTE_ATTENDANCE_REJECTED,
    title: "Remote attendance rejected",
    body: `Your remote session was not approved.${noteSuffix}`,
    dedupeKey: `remote_rejected:${params.sessionId}:employee`,
    metadata: {
      session_id: params.sessionId,
      status: "rejected",
      reviewer_user_id: params.reviewerUserId,
    },
    sendEmail: true,
  });
}
