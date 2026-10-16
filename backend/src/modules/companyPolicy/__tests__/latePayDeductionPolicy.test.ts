import {
  isLatePayDeductionActiveOnAttendanceDate,
  normalizeIsoDateOnly,
} from "../latePayDeductionPolicy";

describe("latePayDeductionPolicy", () => {
  describe("normalizeIsoDateOnly", () => {
    test("accepts YYYY-MM-DD", () => {
      expect(normalizeIsoDateOnly("2026-07-18")).toBe("2026-07-18");
    });

    test("trims and takes date portion of timestamps", () => {
      expect(normalizeIsoDateOnly("2026-07-18T12:00:00.000Z")).toBe("2026-07-18");
    });

    test("rejects invalid calendar dates", () => {
      expect(normalizeIsoDateOnly("2026-02-31")).toBeNull();
      expect(normalizeIsoDateOnly("not-a-date")).toBeNull();
      expect(normalizeIsoDateOnly(null)).toBeNull();
    });
  });

  describe("isLatePayDeductionActiveOnAttendanceDate", () => {
    const base = {
      late_pay_deduction_enabled: true,
      late_pay_deduction_effective_from: "2026-07-01",
      payroll_enabled: true,
    };

    test("false when feature disabled", () => {
      expect(
        isLatePayDeductionActiveOnAttendanceDate(
          { ...base, late_pay_deduction_enabled: false },
          "2026-07-15"
        )
      ).toBe(false);
    });

    test("false when effective_from is missing — never assumes today", () => {
      expect(
        isLatePayDeductionActiveOnAttendanceDate(
          {
            late_pay_deduction_enabled: true,
            late_pay_deduction_effective_from: null,
            payroll_enabled: true,
          },
          "2026-07-15"
        )
      ).toBe(false);
    });

    test("false when payroll disabled", () => {
      expect(
        isLatePayDeductionActiveOnAttendanceDate(
          { ...base, payroll_enabled: false },
          "2026-07-15"
        )
      ).toBe(false);
    });

    test("false for attendance before effective date", () => {
      expect(isLatePayDeductionActiveOnAttendanceDate(base, "2026-06-30")).toBe(false);
    });

    test("true on effective date and after", () => {
      expect(isLatePayDeductionActiveOnAttendanceDate(base, "2026-07-01")).toBe(true);
      expect(isLatePayDeductionActiveOnAttendanceDate(base, "2026-07-18")).toBe(true);
    });
  });
});
