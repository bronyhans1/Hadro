import {
  canCreditPaidLeaveDay,
  resolveCompanyTodayIso,
} from "../paidLeavePayrollEligibility";
import { calendarYmdInTimeZone } from "../../../lib/businessCalendar";

describe("canCreditPaidLeaveDay", () => {
  test("returns false for future leave dates", () => {
    expect(canCreditPaidLeaveDay("2026-06-15", "2026-06-13")).toBe(false);
    expect(canCreditPaidLeaveDay("2026-06-16", "2026-06-15")).toBe(false);
  });

  test("returns true for today and past leave dates", () => {
    expect(canCreditPaidLeaveDay("2026-06-15", "2026-06-15")).toBe(true);
    expect(canCreditPaidLeaveDay("2026-06-14", "2026-06-15")).toBe(true);
  });
});

describe("resolveCompanyTodayIso", () => {
  test("uses company business timezone, not UTC slice", () => {
    // 2026-06-15 23:30 UTC is still 2026-06-15 in Accra (UTC+0)
    const iso = resolveCompanyTodayIso(
      { business_timezone: "Africa/Accra" },
      new Date("2026-06-15T23:30:00.000Z")
    );
    expect(iso).toBe("2026-06-15");
  });

  test("calendar boundary: late UTC can be next calendar day in Tokyo", () => {
    const utcLate = new Date("2026-06-15T20:00:00.000Z");
    const tokyo = calendarYmdInTimeZone(utcLate, "Asia/Tokyo").iso;
    expect(tokyo).toBe("2026-06-16");
    expect(resolveCompanyTodayIso({ business_timezone: "Asia/Tokyo" }, utcLate)).toBe(
      "2026-06-16"
    );
  });
});
