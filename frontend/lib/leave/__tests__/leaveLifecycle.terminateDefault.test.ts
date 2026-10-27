import {
  defaultTerminateReturnDate,
  maxTerminateReturnDateYmd,
} from "../leaveLifecycle";

describe("defaultTerminateReturnDate", () => {
  test("multi-day mid-leave defaults to next calendar day", () => {
    expect(
      defaultTerminateReturnDate(
        { start_date: "2026-06-01", end_date: "2026-06-02" },
        "2026-06-01"
      )
    ).toBe("2026-06-02");
  });

  test("single-day and final-day default to day after end", () => {
    expect(
      defaultTerminateReturnDate(
        { start_date: "2026-06-01", end_date: "2026-06-01" },
        "2026-06-01"
      )
    ).toBe(maxTerminateReturnDateYmd("2026-06-01"));
    expect(
      defaultTerminateReturnDate(
        { start_date: "2026-06-01", end_date: "2026-06-05" },
        "2026-06-05"
      )
    ).toBe("2026-06-06");
  });
});
