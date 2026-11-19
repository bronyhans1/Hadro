/** Desktop payroll DataTable / rollup table visibility (md and up). */
export function payrollDesktopTableClass(): string {
  return "hidden md:block";
}

/** Mobile payroll card/list visibility (below md). */
export function payrollMobileCardsClass(): string {
  return "space-y-3 md:hidden";
}

/** Filter panel visibility for payroll ResponsiveFilterCard-style collapses (< md). */
export function payrollFiltersPanelClass(mobileOpen: boolean): string {
  return mobileOpen ? "mt-3 block md:mt-0" : "hidden md:block";
}

export interface PayrollTableColumnLike {
  key: string;
}

const DEFAULT_ACTION_KEYS = ["actions", "payslip"] as const;

/** Split table columns into primary header, detail fields, and optional actions for mobile cards. */
export function splitPayrollTableColumns<T extends PayrollTableColumnLike>(
  columns: readonly T[],
  options?: { actionKeys?: readonly string[] }
): { primary: T | undefined; details: T[]; actions: T | undefined } {
  const actionKeys = new Set(options?.actionKeys ?? DEFAULT_ACTION_KEYS);
  const actions = columns.find((column) => actionKeys.has(column.key));
  const rest = columns.filter((column) => !actionKeys.has(column.key));
  return {
    primary: rest[0],
    details: rest.slice(1),
    actions,
  };
}

const MOBILE_HIDDEN_DETAIL_KEYS = new Set([
  "shadow_duration_ot",
  "shadow_shift_ot",
  "regular_minutes",
  "overtime_minutes",
]);

/**
 * Prefer essential payroll figures on mobile cards.
 * Hides dense shadow/minute columns that remain available on desktop.
 */
export function filterPayrollMobileDetailColumns<T extends PayrollTableColumnLike>(
  details: readonly T[]
): T[] {
  return details.filter((column) => !MOBILE_HIDDEN_DETAIL_KEYS.has(column.key));
}
