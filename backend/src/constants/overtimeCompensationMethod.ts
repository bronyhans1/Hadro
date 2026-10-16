export const OVERTIME_COMPENSATION_METHOD_MULTIPLIER = "multiplier";
export const OVERTIME_COMPENSATION_METHOD_FIXED_RATE = "fixed_rate";

export const OVERTIME_COMPENSATION_METHODS = [
  OVERTIME_COMPENSATION_METHOD_MULTIPLIER,
  OVERTIME_COMPENSATION_METHOD_FIXED_RATE,
] as const;

export type OvertimeCompensationMethod =
  (typeof OVERTIME_COMPENSATION_METHODS)[number];

export const DEFAULT_OVERTIME_COMPENSATION_METHOD: OvertimeCompensationMethod =
  OVERTIME_COMPENSATION_METHOD_MULTIPLIER;

export function isOvertimeCompensationMethod(
  value: unknown
): value is OvertimeCompensationMethod {
  return (
    typeof value === "string" &&
    (OVERTIME_COMPENSATION_METHODS as readonly string[]).includes(value)
  );
}

export function normalizeOvertimeCompensationMethod(
  value: unknown
): OvertimeCompensationMethod {
  if (isOvertimeCompensationMethod(value)) return value;
  return DEFAULT_OVERTIME_COMPENSATION_METHOD;
}
