import type { WageRateRecord } from "@/lib/api/wageRates.api";

/** Mirrors backend effective wage lookup (effective_from <= date, latest first). */
export function resolveEffectiveWageRate(
  rates: WageRateRecord[],
  dateYmd: string
): WageRateRecord | null {
  const d = dateYmd.slice(0, 10);
  const sorted = rates
    .filter((r) => String(r.effective_from).slice(0, 10) <= d)
    .sort((a, b) =>
      String(b.effective_from).slice(0, 10).localeCompare(String(a.effective_from).slice(0, 10))
    );
  return sorted[0] ?? null;
}

/** Manual OT Hours (Phase 3B) requires an active hourly wage rate on the earnings date. */
export function isHourlyEligibleForManualOtHours(
  rates: WageRateRecord[],
  dateYmd: string
): boolean {
  const row = resolveEffectiveWageRate(rates, dateYmd);
  if (!row || row.rate_type === "monthly") return false;
  return typeof row.hourly_rate === "number" && row.hourly_rate > 0;
}
