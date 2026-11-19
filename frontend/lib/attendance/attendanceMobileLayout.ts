/** Desktop attendance DataTable visibility (md and up). */
export function attendanceDesktopTableClass(): string {
  return "hidden md:block";
}

/** Mobile attendance card/list visibility (below md). */
export function attendanceMobileCardsClass(): string {
  return "space-y-3 md:hidden";
}

/** Filter panel visibility for attendance ResponsiveFilterCard-style collapses (< md). */
export function attendanceFiltersPanelClass(mobileOpen: boolean): string {
  return mobileOpen ? "mt-3 block md:mt-0" : "hidden md:block";
}
