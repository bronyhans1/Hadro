import { checkoutRouteForSession } from "../attendanceCheckout";

describe("checkoutRouteForSession", () => {
  it("routes remote sessions to remote check-out", () => {
    expect(
      checkoutRouteForSession({ attendance_mode: "remote" })
    ).toBe("/attendance/remote-check-out");
  });

  it("routes onsite sessions to GPS check-out", () => {
    expect(checkoutRouteForSession({ attendance_mode: "onsite" })).toBe(
      "/attendance/check-out"
    );
    expect(checkoutRouteForSession(null)).toBe("/attendance/check-out");
  });
});
