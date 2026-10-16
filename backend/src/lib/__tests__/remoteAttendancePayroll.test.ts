import { AttendanceMode } from "../../constants/attendanceMode";
import { RemoteApprovalStatus } from "../../constants/remoteApprovalStatus";
import { WorkSessionStatus } from "../../constants/workSessionStatus";
import {
  filterCompletedPayrollEligibleSessions,
  isCompletedPayrollEligibleSession,
  isPayrollEligibleSession,
} from "../remoteAttendancePayroll";

describe("isPayrollEligibleSession", () => {
  it("allows onsite sessions by default", () => {
    expect(isPayrollEligibleSession({})).toBe(true);
    expect(
      isPayrollEligibleSession({
        attendance_mode: AttendanceMode.ONSITE,
        remote_approval_status: null,
      })
    ).toBe(true);
  });

  it("blocks remote pending and rejected sessions", () => {
    expect(
      isPayrollEligibleSession({
        attendance_mode: AttendanceMode.REMOTE,
        remote_approval_status: RemoteApprovalStatus.PENDING,
      })
    ).toBe(false);
    expect(
      isPayrollEligibleSession({
        attendance_mode: AttendanceMode.REMOTE,
        remote_approval_status: RemoteApprovalStatus.REJECTED,
      })
    ).toBe(false);
  });

  it("allows remote approved sessions", () => {
    expect(
      isPayrollEligibleSession({
        attendance_mode: AttendanceMode.REMOTE,
        remote_approval_status: RemoteApprovalStatus.APPROVED,
      })
    ).toBe(true);
  });
});

describe("completed payroll eligibility (monthly + hourly parity)", () => {
  const base = {
    check_in: "2026-03-01T09:00:00.000Z",
    status: WorkSessionStatus.COMPLETED,
  };

  it("excludes remote pending completed sessions", () => {
    expect(
      isCompletedPayrollEligibleSession({
        ...base,
        attendance_mode: AttendanceMode.REMOTE,
        remote_approval_status: RemoteApprovalStatus.PENDING,
      })
    ).toBe(false);
    const filtered = filterCompletedPayrollEligibleSessions([
      {
        ...base,
        attendance_mode: AttendanceMode.REMOTE,
        remote_approval_status: RemoteApprovalStatus.PENDING,
      },
      {
        ...base,
        attendance_mode: AttendanceMode.REMOTE,
        remote_approval_status: RemoteApprovalStatus.APPROVED,
      },
    ]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.remote_approval_status).toBe(RemoteApprovalStatus.APPROVED);
  });

  it("includes remote approved and onsite completed sessions", () => {
    expect(
      isCompletedPayrollEligibleSession({
        ...base,
        attendance_mode: AttendanceMode.REMOTE,
        remote_approval_status: RemoteApprovalStatus.APPROVED,
      })
    ).toBe(true);
    expect(isCompletedPayrollEligibleSession({ ...base, attendance_mode: AttendanceMode.ONSITE })).toBe(
      true
    );
  });
});
