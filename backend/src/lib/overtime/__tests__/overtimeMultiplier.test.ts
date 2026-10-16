import {
  computeOvertimePayAmount,
  resolveOvertimeMultiplierApplied,
} from "../overtimeMultiplier";

describe("resolveOvertimeMultiplierApplied", () => {
  test("uses snapshot when present", () => {
    expect(
      resolveOvertimeMultiplierApplied({ overtime_multiplier_applied: 2 }, 1.5)
    ).toBe(2);
  });

  test("falls back to policy multiplier when snapshot null", () => {
    expect(
      resolveOvertimeMultiplierApplied({ overtime_multiplier_applied: null }, 1.75)
    ).toBe(1.75);
  });

  test("falls back when snapshot missing on legacy row", () => {
    expect(resolveOvertimeMultiplierApplied({}, 2.25)).toBe(2.25);
  });

  test("falls back when snapshot out of range", () => {
    expect(
      resolveOvertimeMultiplierApplied({ overtime_multiplier_applied: 0.5 }, 1.5)
    ).toBe(1.5);
  });

  test("default fallback when policy invalid", () => {
    expect(resolveOvertimeMultiplierApplied({}, Number.NaN)).toBe(1.5);
  });
});

describe("computeOvertimePayAmount", () => {
  test("computes OT pay from minutes rate and multiplier", () => {
    expect(computeOvertimePayAmount(120, 20, 1.5)).toBe(60);
  });

  test("returns zero for non-positive inputs", () => {
    expect(computeOvertimePayAmount(0, 20, 1.5)).toBe(0);
    expect(computeOvertimePayAmount(60, 0, 1.5)).toBe(0);
  });
});
