import { AttendanceMode, isRemoteAttendanceMode } from "../constants/attendanceMode";
import { RemoteApprovalStatus } from "../constants/remoteApprovalStatus";
import { WorkSessionStatus } from "../constants/workSessionStatus";

export type PayrollEligibilitySession = {
  attendance_mode?: string | null;
  remote_approval_status?: string | null;
  check_in?: string | null;
  status?: string | null;
};

/**
 * Remote sessions require explicit approval before hourly payroll or salary sync.
 * Onsite sessions (default) remain eligible immediately on clock-out.
 */
export function isPayrollEligibleSession(session: PayrollEligibilitySession): boolean {
  const mode = session.attendance_mode ?? AttendanceMode.ONSITE;
  if (!isRemoteAttendanceMode(mode)) {
    return true;
  }
  return session.remote_approval_status === RemoteApprovalStatus.APPROVED;
}

/** Completed session that may affect salary aggregation or hourly payroll. */
export function isCompletedPayrollEligibleSession(session: PayrollEligibilitySession): boolean {
  if (!session.check_in || session.status !== WorkSessionStatus.COMPLETED) {
    return false;
  }
  return isPayrollEligibleSession(session);
}

export function filterCompletedPayrollEligibleSessions<T extends PayrollEligibilitySession>(
  sessions: T[]
): T[] {
  return sessions.filter(isCompletedPayrollEligibleSession);
}
