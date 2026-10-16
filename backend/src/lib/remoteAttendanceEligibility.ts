/**
 * Effective remote attendance: company policy AND per-employee authorization.
 */

export const REMOTE_ATTENDANCE_NOT_ENABLED_COMPANY =
  "Remote attendance is not enabled for your company";

export const REMOTE_ATTENDANCE_NOT_AUTHORIZED_EMPLOYEE =
  "You are not authorized for remote attendance. Contact your manager or HR.";

export interface RemoteAttendanceEligibilityInput {
  companyRemoteEnabled: boolean;
  employeeRemoteAllowed: boolean;
}

export function effectiveRemoteAttendanceEnabled(
  input: RemoteAttendanceEligibilityInput
): boolean {
  return input.companyRemoteEnabled === true && input.employeeRemoteAllowed === true;
}

export function assertRemoteAttendanceEligible(
  input: RemoteAttendanceEligibilityInput
): { ok: true } | { ok: false; error: string; httpStatus: 403 | 400 } {
  if (!input.companyRemoteEnabled) {
    return {
      ok: false,
      error: REMOTE_ATTENDANCE_NOT_ENABLED_COMPANY,
      httpStatus: 400,
    };
  }
  if (!input.employeeRemoteAllowed) {
    return {
      ok: false,
      error: REMOTE_ATTENDANCE_NOT_AUTHORIZED_EMPLOYEE,
      httpStatus: 403,
    };
  }
  return { ok: true };
}
