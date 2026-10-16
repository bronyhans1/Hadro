import {
  isCurrentlyOnApprovedLeave,
  leaveDaysRemaining,
  inclusiveDaysBetween,
} from "../leaveLifecycle";

describe("isCurrentlyOnApprovedLeave", () => {
  const leave = {
    status: "approved",
    start_date: "2026-05-28",
    end_date: "2026-06-01",
  };

  it("is true when today is within the leave period", () => {
    expect(isCurrentlyOnApprovedLeave(leave, "2026-05-30")).toBe(true);
    expect(isCurrentlyOnApprovedLeave(leave, "2026-05-28")).toBe(true);
    expect(isCurrentlyOnApprovedLeave(leave, "2026-06-01")).toBe(true);
  });

  it("is false before start or after end", () => {
    expect(isCurrentlyOnApprovedLeave(leave, "2026-05-27")).toBe(false);
    expect(isCurrentlyOnApprovedLeave(leave, "2026-06-02")).toBe(false);
  });

  it("is false for non-approved statuses", () => {
    expect(
      isCurrentlyOnApprovedLeave({ ...leave, status: "completed" }, "2026-05-30")
    ).toBe(false);
    expect(
      isCurrentlyOnApprovedLeave({ ...leave, status: "terminated" }, "2026-05-30")
    ).toBe(false);
    expect(
      isCurrentlyOnApprovedLeave({ ...leave, status: "cancelled" }, "2026-05-30")
    ).toBe(false);
  });
});

describe("leaveDaysRemaining", () => {
  it("counts inclusive days through end_date", () => {
    expect(leaveDaysRemaining("2026-06-01", "2026-05-30")).toBe(3);
    expect(leaveDaysRemaining("2026-06-01", "2026-06-01")).toBe(1);
    expect(leaveDaysRemaining("2026-06-01", "2026-06-02")).toBe(0);
  });
});

describe("inclusiveDaysBetween", () => {
  it("returns inclusive calendar day count", () => {
    expect(inclusiveDaysBetween("2026-05-28", "2026-06-01")).toBe(5);
  });
});
