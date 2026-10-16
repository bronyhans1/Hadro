/**
 * Phase 18A — Late Pay Deduction is effective-dated, never retroactive.
 *
 * Applied only when enabled, an effective_from date exists, and the attendance
 * day is on or after that date. Missing effective_from ⇒ never apply.
 */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type LatePayDeductionPolicySlice = {
  late_pay_deduction_enabled?: boolean | null;
  late_pay_deduction_effective_from?: string | null;
  /** When false, payroll (and thus late pay) is off. Undefined treated as on. */
  payroll_enabled?: boolean | null;
};

export function normalizeIsoDateOnly(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().slice(0, 10);
  if (!ISO_DATE_RE.test(trimmed)) return null;
  const [y, m, d] = trimmed.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return trimmed;
}

/**
 * Whether late pay deduction may be applied for a specific attendance day.
 * Does not inspect late_minutes — callers still require deductible minutes.
 */
export function isLatePayDeductionActiveOnAttendanceDate(
  policy: LatePayDeductionPolicySlice,
  attendanceDateYmd: string
): boolean {
  if (policy.payroll_enabled === false) return false;
  if (policy.late_pay_deduction_enabled !== true) return false;

  const effectiveFrom = normalizeIsoDateOnly(policy.late_pay_deduction_effective_from);
  if (!effectiveFrom) return false;

  const day = normalizeIsoDateOnly(attendanceDateYmd);
  if (!day) return false;

  return day >= effectiveFrom;
}
