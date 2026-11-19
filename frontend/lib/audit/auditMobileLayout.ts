/** Desktop audit DataTable / HTML table visibility (md and up). */
export function auditDesktopTableClass(): string {
  return "hidden md:block";
}

/** Mobile audit card/list visibility (below md). */
export function auditMobileCardsClass(): string {
  return "space-y-3 md:hidden";
}

/** Filter panel visibility for audit ResponsiveFilterCard-style collapses (< md). */
export function auditFiltersPanelClass(mobileOpen: boolean): string {
  return mobileOpen ? "mt-3 block md:mt-0" : "hidden md:block";
}

export interface AuditTableColumnLike {
  key: string;
}

/** Prefer action as the mobile card primary when present; otherwise first column. */
export function splitAuditTableColumns<T extends AuditTableColumnLike>(
  columns: readonly T[]
): { primary: T | undefined; details: T[] } {
  const action = columns.find((column) => column.key === "action");
  if (action) {
    return {
      primary: action,
      details: columns.filter((column) => column.key !== "action"),
    };
  }
  return {
    primary: columns[0],
    details: columns.slice(1),
  };
}

const PLATFORM_MOBILE_HIDDEN_DETAIL_KEYS = new Set(["status"]);

/**
 * Prefer essential platform audit fields on mobile cards.
 * Status badge remains available on desktop tables.
 */
export function filterPlatformAuditMobileDetailColumns<T extends AuditTableColumnLike>(
  details: readonly T[]
): T[] {
  return details.filter((column) => !PLATFORM_MOBILE_HIDDEN_DETAIL_KEYS.has(column.key));
}

/** Touch-friendly full-width control row helpers on phones. */
export function auditFilterActionsRowClass(): string {
  return "flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center";
}

export function auditFilterActionClass(): string {
  return "w-full sm:w-auto";
}
