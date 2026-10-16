import {
  assertRemoteAttendanceEligible,
  effectiveRemoteAttendanceEnabled,
  REMOTE_ATTENDANCE_NOT_AUTHORIZED_EMPLOYEE,
  REMOTE_ATTENDANCE_NOT_ENABLED_COMPANY,
} from "../remoteAttendanceEligibility";

describe("effectiveRemoteAttendanceEnabled", () => {
  it("is false when company disabled and employee enabled", () => {
    expect(
      effectiveRemoteAttendanceEnabled({
        companyRemoteEnabled: false,
        employeeRemoteAllowed: true,
      })
    ).toBe(false);
  });

  it("is false when company enabled and employee disabled", () => {
    expect(
      effectiveRemoteAttendanceEnabled({
        companyRemoteEnabled: true,
        employeeRemoteAllowed: false,
      })
    ).toBe(false);
  });

  it("is true only when both enabled", () => {
    expect(
      effectiveRemoteAttendanceEnabled({
        companyRemoteEnabled: true,
        employeeRemoteAllowed: true,
      })
    ).toBe(true);
  });
});

describe("assertRemoteAttendanceEligible", () => {
  it("blocks when company disabled regardless of employee flag", () => {
    const result = assertRemoteAttendanceEligible({
      companyRemoteEnabled: false,
      employeeRemoteAllowed: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(REMOTE_ATTENDANCE_NOT_ENABLED_COMPANY);
      expect(result.httpStatus).toBe(400);
    }
  });

  it("blocks unauthorized employee when company enabled", () => {
    const result = assertRemoteAttendanceEligible({
      companyRemoteEnabled: true,
      employeeRemoteAllowed: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(REMOTE_ATTENDANCE_NOT_AUTHORIZED_EMPLOYEE);
      expect(result.httpStatus).toBe(403);
    }
  });

  it("allows when both enabled", () => {
    expect(
      assertRemoteAttendanceEligible({
        companyRemoteEnabled: true,
        employeeRemoteAllowed: true,
      })
    ).toEqual({ ok: true });
  });
});
