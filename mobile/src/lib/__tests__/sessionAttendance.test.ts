import {
  formatAttendanceDayShort,
  isOvernightSession,
  isRemoteAttendanceSession,
  sessionAttendanceDayKey,
} from "../sessionAttendance";

describe("sessionAttendance (mobile)", () => {
  it("uses attendance_date as ownership key", () => {
    expect(
      sessionAttendanceDayKey({
        attendance_date: "2026-03-31",
        check_in: "2026-04-01T01:00:00.000Z",
      })
    ).toBe("2026-03-31");
  });

  it("flags overnight when ownership day differs from check-in UTC day", () => {
    expect(
      isOvernightSession({
        attendance_date: "2026-03-31",
        check_in: "2026-04-01T01:00:00.000Z",
      })
    ).toBe(true);
  });

  it("formats short attendance day label", () => {
    expect(formatAttendanceDayShort("2026-03-31")).toBe("Mar 31, 2026");
  });

  it("detects remote attendance mode", () => {
    expect(isRemoteAttendanceSession({ attendance_mode: "remote" })).toBe(true);
    expect(isRemoteAttendanceSession({ attendance_mode: "onsite" })).toBe(false);
    expect(isRemoteAttendanceSession(null)).toBe(false);
  });
});
