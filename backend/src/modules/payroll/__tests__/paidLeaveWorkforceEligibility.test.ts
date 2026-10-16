import {
  canCreditPaidLeaveDay,
  canEmitPaidLeaveWorkforceEarning,
} from "../paidLeavePayrollEligibility";
import {
  hasScheduledShiftClosed,
  resolveScheduledShiftCloseForOwnershipDay,
} from "../../../lib/shiftWindow";

describe("paid leave workforce eligibility", () => {
  test("calendar gate allows elapsed days only", () => {
    expect(canCreditPaidLeaveDay("2026-06-15", "2026-06-15")).toBe(true);
    expect(canCreditPaidLeaveDay("2026-06-16", "2026-06-15")).toBe(false);
  });

  test("today requires shift closed; past days do not", () => {
    expect(
      canEmitPaidLeaveWorkforceEarning({
        earningsDateYmd: "2026-06-14",
        companyTodayYmd: "2026-06-15",
        shiftHasClosed: false,
      })
    ).toBe(true);
    expect(
      canEmitPaidLeaveWorkforceEarning({
        earningsDateYmd: "2026-06-15",
        companyTodayYmd: "2026-06-15",
        shiftHasClosed: false,
      })
    ).toBe(false);
    expect(
      canEmitPaidLeaveWorkforceEarning({
        earningsDateYmd: "2026-06-15",
        companyTodayYmd: "2026-06-15",
        shiftHasClosed: true,
      })
    ).toBe(true);
    expect(
      canEmitPaidLeaveWorkforceEarning({
        earningsDateYmd: "2026-06-16",
        companyTodayYmd: "2026-06-15",
        shiftHasClosed: true,
      })
    ).toBe(false);
  });
});

describe("resolveScheduledShiftCloseForOwnershipDay", () => {
  const dayShift = {
    id: "s1",
    start_time: "08:00",
    end_time: "17:00",
    grace_minutes: 0,
    spans_midnight: false,
    is_active: true,
  };

  const nightShift = {
    id: "s2",
    start_time: "22:00",
    end_time: "06:00",
    grace_minutes: 0,
    spans_midnight: true,
    is_active: true,
  };

  test("day shift closes on ownership day at end time", () => {
    const r = resolveScheduledShiftCloseForOwnershipDay({
      ownershipYmd: "2026-06-15",
      businessTimeZone: "Africa/Accra",
      overnightShiftsEnabled: true,
      shift: dayShift,
    });
    expect(r.overnightLogicActive).toBe(false);
    expect(hasScheduledShiftClosed(
      {
        ownershipYmd: "2026-06-15",
        businessTimeZone: "Africa/Accra",
        overnightShiftsEnabled: true,
        shift: dayShift,
      },
      new Date(r.expectedEndUtcIso)
    )).toBe(true);
    expect(hasScheduledShiftClosed(
      {
        ownershipYmd: "2026-06-15",
        businessTimeZone: "Africa/Accra",
        overnightShiftsEnabled: true,
        shift: dayShift,
      },
      new Date(new Date(r.expectedEndUtcIso).getTime() - 60_000)
    )).toBe(false);
  });

  test("overnight shift closes after midnight following ownership day", () => {
    const r = resolveScheduledShiftCloseForOwnershipDay({
      ownershipYmd: "2026-06-15",
      businessTimeZone: "Africa/Accra",
      overnightShiftsEnabled: true,
      shift: nightShift,
    });
    expect(r.overnightLogicActive).toBe(true);
    const end = new Date(r.expectedEndUtcIso);
    // Accra is UTC+0 — end should be 2026-06-16 06:00
    expect(end.toISOString().startsWith("2026-06-16T06:00")).toBe(true);
  });
});
