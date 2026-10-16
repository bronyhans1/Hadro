/**
 * Resolve OT multiplier for display (payslip/export). Does not affect gross_earnings storage.
 */
export function resolveOvertimeMultiplierApplied(
  record: { overtime_multiplier_applied?: number | null },
  policyMultiplier: number
): number {
  const snap = record.overtime_multiplier_applied;
  if (typeof snap === "number" && !Number.isNaN(snap) && snap >= 1 && snap <= 3) {
    return snap;
  }
  if (
    typeof policyMultiplier === "number" &&
    !Number.isNaN(policyMultiplier) &&
    policyMultiplier >= 1 &&
    policyMultiplier <= 3
  ) {
    return policyMultiplier;
  }
  return 1.5;
}

export function computeOvertimePayAmount(
  overtimeMinutes: number,
  hourlyRate: number,
  multiplier: number
): number {
  if (overtimeMinutes <= 0 || hourlyRate <= 0 || multiplier <= 0) return 0;
  return (overtimeMinutes / 60) * hourlyRate * multiplier;
}
