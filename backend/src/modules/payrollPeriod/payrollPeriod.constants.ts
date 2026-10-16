export const PAYROLL_PERIOD_STATUSES = [
  "draft",
  "processing",
  "approved",
  "locked",
  "archived",
] as const;

export type PayrollPeriodStatus = (typeof PAYROLL_PERIOD_STATUSES)[number];

/** Legacy API/DB values accepted on input and normalized to canonical statuses. */
export const PAYROLL_PERIOD_STATUS_ALIASES: Record<string, PayrollPeriodStatus> = {
  review: "processing",
  closed: "archived",
};

export const PAYROLL_PERIOD_DEFAULT_STATUS: PayrollPeriodStatus = "draft";

/** Periods that may be regenerated / recalculated. */
export const PAYROLL_PERIOD_MUTABLE_STATUSES: readonly PayrollPeriodStatus[] = [
  "draft",
  "processing",
];

/** Finalized periods — mutations must be rejected. */
export const PAYROLL_PERIOD_PROTECTED_STATUSES: readonly PayrollPeriodStatus[] = [
  "approved",
  "locked",
  "archived",
];

export const PAYROLL_PERIOD_YEAR_MIN = 2000;
export const PAYROLL_PERIOD_YEAR_MAX = 2100;
export const PAYROLL_PERIOD_MONTH_MIN = 1;
export const PAYROLL_PERIOD_MONTH_MAX = 12;

export const PAYROLL_PERIOD_LIST_DEFAULT_LIMIT = 24;
export const PAYROLL_PERIOD_LIST_MAX_LIMIT = 100;

export function normalizePayrollPeriodStatus(raw: unknown): PayrollPeriodStatus | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const key = raw.trim().toLowerCase();
  if ((PAYROLL_PERIOD_STATUSES as readonly string[]).includes(key)) {
    return key as PayrollPeriodStatus;
  }
  return PAYROLL_PERIOD_STATUS_ALIASES[key] ?? null;
}

export function isPayrollPeriodMutableStatus(
  status: PayrollPeriodStatus | string | null | undefined
): boolean {
  const normalized = normalizePayrollPeriodStatus(status ?? "draft") ?? "draft";
  return (PAYROLL_PERIOD_MUTABLE_STATUSES as readonly string[]).includes(normalized);
}

export function isPayrollPeriodProtectedStatus(
  status: PayrollPeriodStatus | string | null | undefined
): boolean {
  const normalized = normalizePayrollPeriodStatus(status ?? "draft") ?? "draft";
  return (PAYROLL_PERIOD_PROTECTED_STATUSES as readonly string[]).includes(normalized);
}

export function formatPayrollPeriodStatusLabel(
  status: PayrollPeriodStatus | string | null | undefined
): string {
  const normalized = normalizePayrollPeriodStatus(status ?? "draft") ?? "draft";
  if (normalized === "processing") return "Processing";
  if (normalized === "approved") return "Approved";
  if (normalized === "locked") return "Locked";
  if (normalized === "archived") return "Archived";
  return "Draft";
}
