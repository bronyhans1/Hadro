/**
 * Live earnings pass-through.
 *
 * Paid leave credits are emitted by the workforce shift-close engine and must
 * appear immediately in Daily Earnings (including for calendar_today).
 */
import type { EarningsSummary } from "@/lib/api/payroll.api";

export function toLiveEarnedLeaveView(summary: EarningsSummary): EarningsSummary {
  return summary;
}
