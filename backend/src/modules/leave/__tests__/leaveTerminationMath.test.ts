import {
  computeLeaveUsedDaysFirstDayBack,
  computeRestoredDaysFromTermination,
  isValidTerminateReturnDate,
  maxTerminateReturnDateYmd,
} from "../leaveTerminationMath";

describe("leaveTerminationMath (first day back at work)", () => {
  const leave = {
    startDateYmd: "2026-06-01",
    endDateYmd: "2026-06-05",
    totalDays: 5,
  };

  test("max return is day after approved end", () => {
    expect(maxTerminateReturnDateYmd("2026-06-05")).toBe("2026-06-06");
  });

  test("Scenario A: pre-start terminate with return on start_date → used 0, restored 5", () => {
    const r = computeRestoredDaysFromTermination({
      ...leave,
      actualReturnDateYmd: "2026-06-01",
    });
    expect(r).toEqual({ usedDays: 0, restoredDays: 5 });
  });

  test("Scenario B: return on first leave day → used 0, restored 5", () => {
    expect(computeLeaveUsedDaysFirstDayBack("2026-06-01", "2026-06-01")).toBe(0);
    const r = computeRestoredDaysFromTermination({
      ...leave,
      actualReturnDateYmd: "2026-06-01",
    });
    expect(r?.usedDays).toBe(0);
    expect(r?.restoredDays).toBe(5);
  });

  test("mid-leave return 2026-06-04 → used 3, restored 2", () => {
    const r = computeRestoredDaysFromTermination({
      ...leave,
      actualReturnDateYmd: "2026-06-04",
    });
    expect(r).toEqual({ usedDays: 3, restoredDays: 2 });
  });

  test("full leave through end → return day after end uses all days", () => {
    const r = computeRestoredDaysFromTermination({
      ...leave,
      actualReturnDateYmd: "2026-06-06",
    });
    expect(r).toEqual({ usedDays: 5, restoredDays: 0 });
  });

  test("rejects return before start or after end+1", () => {
    expect(
      isValidTerminateReturnDate("2026-06-01", "2026-06-05", "2026-05-31")
    ).toBe(false);
    expect(
      isValidTerminateReturnDate("2026-06-01", "2026-06-05", "2026-06-07")
    ).toBe(false);
    expect(
      isValidTerminateReturnDate("2026-06-01", "2026-06-05", "2026-06-06")
    ).toBe(true);
  });
});
