/**
 * Canonical business-friendly labels for audit action keys.
 * Internal keys stay in APIs/storage; UI should always display these labels.
 */

import { presentStructuredAuditAction, translate } from "@/lib/i18n";

export const AUDIT_ACTION_LABELS: Readonly<Record<string, string>> = {
  // Users
  "user.create": "Created User",
  "user.update": "Updated User",
  "user.delete": "Deleted User",
  "user.deactivate": "Deactivated User",
  "user.assign_shift": "Assigned Shift",
  "user.role_change": "Changed User Role",

  // Branches
  "branch.create": "Created Branch",
  "branch.update": "Updated Branch",
  "branch.delete": "Deleted Branch",

  // Departments
  "department.create": "Created Department",
  "department.update": "Updated Department",
  "department.delete": "Deleted Department",

  // Attendance / sessions
  "session.clock_in": "Employee Clocked In",
  "session.clock_out": "Employee Clocked Out",
  "session.manual_clock_in": "Manual Clock-In",
  "session.manual_clock_out": "Manual Clock-Out",
  "session.remote_clock_in": "Remote Clock-In",
  "session.remote_clock_out": "Remote Clock-Out",
  "session.remote_approved": "Remote Attendance Approved",
  "session.remote_rejected": "Remote Attendance Rejected",
  attendance_day_override_upserted: "Updated Attendance Day Override",
  attendance_day_override_deleted: "Removed Attendance Day Override",

  // Leave
  leave_approved: "Leave Approved",
  leave_rejected: "Leave Rejected",
  leave_cancelled: "Leave Cancelled",
  leave_terminated: "Leave Terminated",
  leave_balance_created: "Created Leave Balance",
  leave_balance_updated: "Updated Leave Balance",

  // Payroll / compensation
  payroll_approved: "Payroll Approved",
  payroll_locked: "Payroll Locked",
  wage_rate_created: "Created Wage Rate",
  wage_rate_updated: "Updated Wage Rate",
  wage_rate_deleted: "Deleted Wage Rate",
  "manual_overtime.created": "Manual Overtime Created",
  "manual_overtime.approved": "Manual Overtime Approved",
  "manual_overtime.cancelled": "Manual Overtime Cancelled",

  // Settings / policy / holidays
  company_policy_updated: "Updated Company Policy",
  company_holiday_created: "Created Company Holiday",
  company_holiday_updated: "Updated Company Holiday",
  company_holiday_deleted: "Deleted Company Holiday",

  // Platform
  "platform.company_create": "Provisioned Company",
  "platform.company_provision": "Provisioned Company",
  "platform.company_delete": "Deleted Company",
  "platform.company_branch_limit_update": "Updated Branch Limit",
  "platform.company_status_update": "Updated Company Status",
  "platform.user_delete": "Deleted Platform User",
  "platform.support_settings_update": "Updated Support Settings",
};

/** Title-case a key without exposing dotted/underscored identifiers as-is. */
export function humanizeAuditActionKey(action: string): string {
  const trimmed = (action ?? "").trim();
  if (!trimmed) return translate("audit.unknownAction");
  return trimmed
    .replace(/[._]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (s) => s.toUpperCase());
}

/**
 * Resolve a stable business label for an audit action key.
 * Never returns the raw internal key when it contains `.` or `_`.
 */
const ACTION_I18N: Record<string, string> = {
  "user.create": "audit.userCreate",
  "user.update": "audit.userUpdate",
  "user.delete": "audit.userDelete",
  "user.deactivate": "audit.userDeactivate",
  "user.assign_shift": "audit.userAssignShift",
  "user.role_change": "audit.userRoleChange",
  "branch.create": "branches.auditCreated",
  "branch.update": "branches.auditUpdated",
  "branch.delete": "branches.auditDeleted",
  "department.create": "audit.departmentCreate",
  "department.update": "audit.departmentUpdate",
  "department.delete": "audit.departmentDelete",
  "session.clock_in": "audit.employeeClockedIn",
  "session.clock_out": "audit.employeeClockedOut",
  "session.manual_clock_in": "audit.manualClockIn",
  "session.manual_clock_out": "audit.manualClockOut",
  "session.remote_clock_in": "audit.remoteClockIn",
  "session.remote_clock_out": "audit.remoteClockOut",
  "session.remote_approved": "audit.remoteApproved",
  "session.remote_rejected": "audit.remoteRejected",
  attendance_day_override_upserted: "audit.dayOverrideUpdated",
  attendance_day_override_deleted: "audit.dayOverrideRemoved",
  leave_approved: "audit.leaveApproved",
  leave_rejected: "audit.leaveRejected",
  leave_cancelled: "audit.leaveCancelled",
  leave_terminated: "audit.leaveTerminated",
  leave_balance_created: "audit.leaveBalanceCreated",
  leave_balance_updated: "audit.leaveBalanceUpdated",
  payroll_approved: "audit.payrollApproved",
  payroll_locked: "audit.payrollLocked",
  wage_rate_created: "audit.wageCreated",
  wage_rate_updated: "audit.wageUpdated",
  wage_rate_deleted: "audit.wageDeleted",
  "manual_overtime.created": "audit.manualOtCreated",
  "manual_overtime.approved": "audit.manualOtApproved",
  "manual_overtime.cancelled": "audit.manualOtCancelled",
  company_policy_updated: "audit.policyUpdated",
  company_holiday_created: "audit.holidayCreated",
  company_holiday_updated: "audit.holidayUpdated",
  company_holiday_deleted: "audit.holidayDeleted",
  "platform.company_create": "audit.companyProvisioned",
  "platform.company_provision": "audit.companyProvisioned",
  "platform.company_delete": "audit.companyDeleted",
  "platform.company_branch_limit_update": "branches.auditLimit",
  "platform.company_status_update": "audit.companyStatusUpdated",
  "platform.user_delete": "audit.platformUserDeleted",
  "platform.support_settings_update": "audit.supportSettingsUpdated",
};

export function getAuditActionLabel(action: string): string {
  const key = (action ?? "").trim();
  if (!key) return translate("audit.unknownAction");
  const structured = presentStructuredAuditAction(key);
  if (structured) return structured;
  const i18nKey = ACTION_I18N[key];
  if (i18nKey) return translate(i18nKey);
  return humanizeAuditActionKey(key);
}
