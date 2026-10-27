/**
 * Live earnings pass-through of the backend earnings summary.
 *
 * Do not compute leave amounts here. Paid-leave `today_earned` is zero until
 * the official shift/workday close credits a persisted payroll row; after
 * close, the summary reflects that authoritative result.
 */
import type { EarningsSummary } from "@/lib/api/payroll.api";

export function toLiveEarnedLeaveView(summary: EarningsSummary): EarningsSummary {
  return summary;
}
