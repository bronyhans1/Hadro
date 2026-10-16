import {
  DEFAULT_OVERTIME_POLICY_MODE,
  isOvertimePolicyMode,
  normalizeOvertimePolicyMode,
  OVERTIME_POLICY_MODES,
  overtimePolicyModeLabel,
} from "../../constants/overtimePolicyMode";
import { validateOvertimePolicyModeInput } from "../../modules/companyPolicy/companyPolicy.service";
import { validateOvertimePolicyModeForActivation } from "../../modules/companyPolicy/companyPolicy.service";

describe("overtimePolicyMode", () => {
  test("allowed modes are recognized", () => {
    for (const mode of OVERTIME_POLICY_MODES) {
      expect(isOvertimePolicyMode(mode)).toBe(true);
    }
    expect(isOvertimePolicyMode("invalid")).toBe(false);
    expect(isOvertimePolicyMode(null)).toBe(false);
  });

  test("normalize defaults unknown values to duration", () => {
    expect(normalizeOvertimePolicyMode(undefined)).toBe(DEFAULT_OVERTIME_POLICY_MODE);
    expect(normalizeOvertimePolicyMode("shift_end")).toBe("shift_end");
    expect(normalizeOvertimePolicyMode("bogus")).toBe("duration");
  });

  test("labels cover all modes", () => {
    for (const mode of OVERTIME_POLICY_MODES) {
      expect(overtimePolicyModeLabel(mode).length).toBeGreaterThan(0);
    }
  });
});

describe("validateOvertimePolicyModeInput", () => {
  test("accepts undefined", () => {
    const r = validateOvertimePolicyModeInput(undefined);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.mode).toBe("duration");
  });

  test("accepts valid mode values", () => {
    const r = validateOvertimePolicyModeInput("greater_of");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.mode).toBe("greater_of");
  });

  test("rejects invalid mode", () => {
    const r = validateOvertimePolicyModeInput("weekly");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/overtime_policy_mode/);
  });
});

describe("validateOvertimePolicyModeForActivation", () => {
  test("allows duration and none", () => {
    expect(validateOvertimePolicyModeForActivation("duration").ok).toBe(true);
    expect(validateOvertimePolicyModeForActivation("none").ok).toBe(true);
  });

  test("rejects unsupported modes", () => {
    for (const mode of ["shift_end", "greater_of", "manual_only"] as const) {
      const r = validateOvertimePolicyModeForActivation(mode);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toMatch(/not available yet/i);
    }
  });
});
