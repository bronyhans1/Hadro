/** Desktop report results table visibility (md and up). */
export function reportsDesktopTableClass(): string {
  return "hidden md:block";
}

/** Mobile report results card/list visibility (below md). */
export function reportsMobileCardsClass(): string {
  return "space-y-3 md:hidden";
}

/** Filter panel visibility for report ResponsiveFilterCard-style collapses (< md). */
export function reportsFiltersPanelClass(mobileOpen: boolean): string {
  return mobileOpen ? "mt-3 block md:mt-0" : "hidden md:block";
}

export interface ReportsTableColumnLike {
  key: string;
}

/** Split report table columns into primary header and detail fields for mobile cards. */
export function splitReportsTableColumns<T extends ReportsTableColumnLike>(
  columns: readonly T[]
): { primary: T | undefined; details: T[] } {
  return {
    primary: columns[0],
    details: columns.slice(1),
  };
}

const LEAVE_MOBILE_HIDDEN_DETAIL_KEYS = new Set(["source", "reviewed_at"]);

/**
 * Prefer essential leave-report fields on mobile cards.
 * Dense review metadata remains available on desktop tables.
 */
export function filterLeaveReportMobileDetailColumns<T extends ReportsTableColumnLike>(
  details: readonly T[]
): T[] {
  return details.filter((column) => !LEAVE_MOBILE_HIDDEN_DETAIL_KEYS.has(column.key));
}

/** Stack export actions full-width on phones; wrap inline from sm up. */
export function reportsExportActionsRowClass(): string {
  return "flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap";
}

/** Touch-friendly export button width on mobile. */
export function reportsExportActionClass(): string {
  return "w-full sm:w-auto";
}
