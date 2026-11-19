/** Mobile filter panel visibility classes for ResponsiveFilterCard (< md). */
export function responsiveFiltersPanelClass(mobileOpen: boolean): string {
  return mobileOpen ? "mt-3 block md:mt-0" : "hidden md:block";
}
