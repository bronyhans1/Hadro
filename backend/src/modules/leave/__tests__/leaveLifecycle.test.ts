import { isApprovedLeaveActive } from "../leaveLifecycle";

describe("isApprovedLeaveActive", () => {
  it("is active when approved and end_date is today or future", () => {
    expect(
      isApprovedLeaveActive(
        { status: "approved", end_date: "2026-06-10" },
        "2026-06-01"
      )
    ).toBe(true);
    expect(
      isApprovedLeaveActive(
        { status: "approved", end_date: "2026-06-01" },
        "2026-06-01"
      )
    ).toBe(true);
  });

  it("is inactive when end_date is in the past", () => {
    expect(
      isApprovedLeaveActive(
        { status: "approved", end_date: "2026-05-31" },
        "2026-06-01"
      )
    ).toBe(false);
  });

  it("is inactive when not approved", () => {
    expect(
      isApprovedLeaveActive(
        { status: "completed", end_date: "2026-12-31" },
        "2026-06-01"
      )
    ).toBe(false);
  });
});
