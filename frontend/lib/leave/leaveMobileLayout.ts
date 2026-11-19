/** Desktop leave DataTable visibility (md and up). */
export function leaveDesktopTableClass(): string {
  return "hidden md:block";
}

/** Mobile leave card/list visibility (below md). */
export function leaveMobileCardsClass(): string {
  return "space-y-3 md:hidden";
}

/** Filter panel visibility for leave ResponsiveFilterCard-style collapses (< md). */
export function leaveFiltersPanelClass(mobileOpen: boolean): string {
  return mobileOpen ? "mt-3 block md:mt-0" : "hidden md:block";
}

export interface LeaveTableColumnLike {
  key: string;
}

/** Split table columns into primary header, detail fields, and optional actions for mobile cards. */
export function splitLeaveTableColumns<T extends LeaveTableColumnLike>(
  columns: readonly T[]
): { primary: T | undefined; details: T[]; actions: T | undefined } {
  const actions = columns.find((column) => column.key === "actions");
  const rest = columns.filter((column) => column.key !== "actions");
  return {
    primary: rest[0],
    details: rest.slice(1),
    actions,
  };
}
