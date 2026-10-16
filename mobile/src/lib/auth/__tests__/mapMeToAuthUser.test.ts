import { mapMeToAuthUser, resolveRemoteAttendanceFlags, unwrapMeResponse } from "../mapMeToAuthUser";
import type { MeResponse } from "@/types/me";

const baseMe: MeResponse = {
  id: "u1",
  email: "a@b.com",
  first_name: "A",
  last_name: "B",
  company: {
    id: "c1",
    name: "Co",
    payroll_enabled: true,
    remote_attendance_enabled: true,
  },
  roles: ["employee"],
};

describe("unwrapMeResponse", () => {
  it("unwraps direct me payload", () => {
    expect(unwrapMeResponse({ ...baseMe })?.id).toBe("u1");
  });

  it("unwraps { success, data } envelope", () => {
    expect(unwrapMeResponse({ success: true, data: baseMe })?.id).toBe("u1");
  });
});

describe("resolveRemoteAttendanceFlags", () => {
  it("requires both company and employee flags", () => {
    expect(
      resolveRemoteAttendanceFlags({
        ...baseMe,
        remote_attendance_allowed: false,
      }).effectiveRemoteAttendanceEnabled
    ).toBe(false);
    expect(
      resolveRemoteAttendanceFlags({
        ...baseMe,
        company: { ...baseMe.company, remote_attendance_enabled: false },
        remote_attendance_allowed: true,
      }).effectiveRemoteAttendanceEnabled
    ).toBe(false);
    expect(
      resolveRemoteAttendanceFlags({
        ...baseMe,
        remote_attendance_allowed: true,
      }).effectiveRemoteAttendanceEnabled
    ).toBe(true);
  });

  it("reads camelCase remote fields when present", () => {
    const raw = {
      ...baseMe,
      remoteAttendanceAllowed: true,
      effectiveRemoteAttendanceEnabled: true,
      company: { ...baseMe.company, remoteAttendanceEnabled: true },
    } as unknown as MeResponse;
    expect(resolveRemoteAttendanceFlags(raw).effectiveRemoteAttendanceEnabled).toBe(true);
  });
});

describe("mapMeToAuthUser", () => {
  it("maps effective remote attendance onto AuthUser", () => {
    const user = mapMeToAuthUser({
      ...baseMe,
      remote_attendance_allowed: true,
      effective_remote_attendance_enabled: true,
    });
    expect(user.effectiveRemoteAttendanceEnabled).toBe(true);
    expect(user.remoteAttendanceAllowed).toBe(true);
    expect(user.companyRemoteAttendanceEnabled).toBe(true);
  });
});
