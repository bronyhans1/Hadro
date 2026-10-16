import {
  buildOvertimeCompensationSnapshot,
  computeOvertimePayFromCompensation,
  formatOvertimeCompensationLabel,
  legacyCompensationMethodApplied,
  overtimeCompensationFromPolicy,
  resolveOvertimeCompensationApplied,
  validateFixedOvertimeHourlyRateForMode,
} from "../overtimeCompensation";
import {
  OVERTIME_COMPENSATION_METHOD_FIXED_RATE,
  OVERTIME_COMPENSATION_METHOD_MULTIPLIER,
} from "../../../constants/overtimeCompensationMethod";

describe("overtimeCompensationFromPolicy", () => {
  test("defaults to multiplier mode", () => {
    const comp = overtimeCompensationFromPolicy({ overtime_multiplier: 1.5 });
    expect(comp.method).toBe(OVERTIME_COMPENSATION_METHOD_MULTIPLIER);
    expect(comp.overtimeMultiplier).toBe(1.5);
    expect(comp.fixedOvertimeHourlyRate).toBeNull();
  });

  test("reads fixed_rate mode and rate", () => {
    const comp = overtimeCompensationFromPolicy({
      overtime_compensation_method: "fixed_rate",
      fixed_overtime_hourly_rate: 20,
      overtime_multiplier: 1.5,
    });
    expect(comp.method).toBe(OVERTIME_COMPENSATION_METHOD_FIXED_RATE);
    expect(comp.fixedOvertimeHourlyRate).toBe(20);
  });
});

describe("computeOvertimePayFromCompensation", () => {
  test("multiplier mode unchanged", () => {
    const pay = computeOvertimePayFromCompensation(120, 20, {
      method: OVERTIME_COMPENSATION_METHOD_MULTIPLIER,
      overtimeMultiplier: 1.5,
      fixedOvertimeHourlyRate: null,
    });
    expect(pay).toBe(60);
  });

  test("fixed_rate mode uses company rate only", () => {
    const pay = computeOvertimePayFromCompensation(240, 50, {
      method: OVERTIME_COMPENSATION_METHOD_FIXED_RATE,
      overtimeMultiplier: 1.5,
      fixedOvertimeHourlyRate: 20,
    });
    expect(pay).toBe(80);
  });

  test("fixed_rate returns zero when rate missing", () => {
    const pay = computeOvertimePayFromCompensation(60, 20, {
      method: OVERTIME_COMPENSATION_METHOD_FIXED_RATE,
      overtimeMultiplier: 1.5,
      fixedOvertimeHourlyRate: null,
    });
    expect(pay).toBe(0);
  });
});

describe("buildOvertimeCompensationSnapshot", () => {
  test("multiplier snapshot stores multiplier only", () => {
    expect(
      buildOvertimeCompensationSnapshot({
        method: OVERTIME_COMPENSATION_METHOD_MULTIPLIER,
        overtimeMultiplier: 2,
        fixedOvertimeHourlyRate: null,
      })
    ).toEqual({
      overtime_compensation_method_applied: "multiplier",
      overtime_multiplier_applied: 2,
      fixed_overtime_rate_applied: null,
    });
  });

  test("fixed_rate snapshot stores fixed rate only", () => {
    expect(
      buildOvertimeCompensationSnapshot({
        method: OVERTIME_COMPENSATION_METHOD_FIXED_RATE,
        overtimeMultiplier: 1.5,
        fixedOvertimeHourlyRate: 20,
      })
    ).toEqual({
      overtime_compensation_method_applied: "fixed_rate",
      overtime_multiplier_applied: null,
      fixed_overtime_rate_applied: 20,
    });
  });
});

describe("resolveOvertimeCompensationApplied", () => {
  const policy = overtimeCompensationFromPolicy({
    overtime_compensation_method: "fixed_rate",
    fixed_overtime_hourly_rate: 25,
    overtime_multiplier: 1.5,
  });

  test("uses row snapshot over current policy", () => {
    const resolved = resolveOvertimeCompensationApplied(
      {
        overtime_compensation_method_applied: "fixed_rate",
        fixed_overtime_rate_applied: 20,
      },
      policy
    );
    expect(resolved.fixedOvertimeHourlyRate).toBe(20);
  });

  test("legacy row without method falls back to multiplier snapshot", () => {
    const resolved = resolveOvertimeCompensationApplied(
      { overtime_multiplier_applied: 2 },
      policy
    );
    expect(resolved.method).toBe(OVERTIME_COMPENSATION_METHOD_MULTIPLIER);
    expect(resolved.overtimeMultiplier).toBe(2);
  });

  test("legacy row without any snapshot uses policy multiplier", () => {
    const resolved = resolveOvertimeCompensationApplied({}, policy);
    expect(resolved.method).toBe(OVERTIME_COMPENSATION_METHOD_MULTIPLIER);
    expect(resolved.overtimeMultiplier).toBe(1.5);
  });
});

describe("legacyCompensationMethodApplied", () => {
  test("null snapshot treated as multiplier", () => {
    expect(legacyCompensationMethodApplied({})).toBe(
      OVERTIME_COMPENSATION_METHOD_MULTIPLIER
    );
  });
});

describe("validateFixedOvertimeHourlyRateForMode", () => {
  test("requires positive rate for fixed_rate", () => {
    expect(
      validateFixedOvertimeHourlyRateForMode("fixed_rate", 0).ok
    ).toBe(false);
    expect(
      validateFixedOvertimeHourlyRateForMode("fixed_rate", 20).ok
    ).toBe(true);
  });

  test("skips validation for multiplier mode", () => {
    expect(
      validateFixedOvertimeHourlyRateForMode("multiplier", null).ok
    ).toBe(true);
  });
});

describe("formatOvertimeCompensationLabel", () => {
  test("labels both modes", () => {
    expect(
      formatOvertimeCompensationLabel({
        method: OVERTIME_COMPENSATION_METHOD_MULTIPLIER,
        overtimeMultiplier: 1.5,
        fixedOvertimeHourlyRate: null,
      })
    ).toBe("Multiplier (1.5x)");
    expect(
      formatOvertimeCompensationLabel({
        method: OVERTIME_COMPENSATION_METHOD_FIXED_RATE,
        overtimeMultiplier: 1.5,
        fixedOvertimeHourlyRate: 20,
      })
    ).toBe("Fixed OT rate (20.00/hr)");
  });
});
