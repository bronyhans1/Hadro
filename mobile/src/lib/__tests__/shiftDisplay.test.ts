import { formatShiftTimeRange, isOvernightWallClockSpan } from "../shiftDisplay";

describe("shiftDisplay (mobile parity)", () => {
  it("formats overnight span with (next day)", () => {
    expect(
      formatShiftTimeRange({ start_time: "22:00", end_time: "06:00", spans_midnight: true })
    ).toBe("22:00 → 06:00 (next day)");
  });

  it("detects overnight wall clock when end <= start", () => {
    expect(isOvernightWallClockSpan("22:00", "06:00")).toBe(true);
    expect(isOvernightWallClockSpan("09:00", "17:00")).toBe(false);
  });
});
