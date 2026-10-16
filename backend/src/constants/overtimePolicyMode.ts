export const OVERTIME_POLICY_MODE_DURATION = "duration";
export const OVERTIME_POLICY_MODE_SHIFT_END = "shift_end";
export const OVERTIME_POLICY_MODE_GREATER_OF = "greater_of";
export const OVERTIME_POLICY_MODE_MANUAL_ONLY = "manual_only";
export const OVERTIME_POLICY_MODE_NONE = "none";

export const OVERTIME_POLICY_MODES = [
  OVERTIME_POLICY_MODE_DURATION,
  OVERTIME_POLICY_MODE_SHIFT_END,
  OVERTIME_POLICY_MODE_GREATER_OF,
  OVERTIME_POLICY_MODE_MANUAL_ONLY,
  OVERTIME_POLICY_MODE_NONE,
] as const;

export type OvertimePolicyMode = (typeof OVERTIME_POLICY_MODES)[number];

export const DEFAULT_OVERTIME_POLICY_MODE: OvertimePolicyMode =
  OVERTIME_POLICY_MODE_DURATION;

/** Phase 2: modes that affect payroll calculations. */
export const ACTIVATED_OVERTIME_POLICY_MODES = [
  OVERTIME_POLICY_MODE_DURATION,
  OVERTIME_POLICY_MODE_NONE,
] as const;

export type ActivatedOvertimePolicyMode =
  (typeof ACTIVATED_OVERTIME_POLICY_MODES)[number];

export const UNSUPPORTED_OVERTIME_POLICY_MODES = [
  OVERTIME_POLICY_MODE_SHIFT_END,
  OVERTIME_POLICY_MODE_GREATER_OF,
  OVERTIME_POLICY_MODE_MANUAL_ONLY,
] as const;

export function isActivatedOvertimePolicyMode(
  mode: OvertimePolicyMode
): mode is ActivatedOvertimePolicyMode {
  return (ACTIVATED_OVERTIME_POLICY_MODES as readonly string[]).includes(mode);
}

export function isOvertimePolicyMode(value: unknown): value is OvertimePolicyMode {
  return (
    typeof value === "string" &&
    (OVERTIME_POLICY_MODES as readonly string[]).includes(value)
  );
}

export function normalizeOvertimePolicyMode(
  value: unknown
): OvertimePolicyMode {
  return isOvertimePolicyMode(value) ? value : DEFAULT_OVERTIME_POLICY_MODE;
}

export function overtimePolicyModeLabel(mode: OvertimePolicyMode): string {
  switch (mode) {
    case OVERTIME_POLICY_MODE_DURATION:
      return "Duration-Based OT";
    case OVERTIME_POLICY_MODE_SHIFT_END:
      return "Shift-End OT";
    case OVERTIME_POLICY_MODE_GREATER_OF:
      return "Greater Of (Duration vs Shift)";
    case OVERTIME_POLICY_MODE_MANUAL_ONLY:
      return "Manual OT Only";
    case OVERTIME_POLICY_MODE_NONE:
      return "No Automatic OT";
    default:
      return "Duration-Based OT";
  }
}
