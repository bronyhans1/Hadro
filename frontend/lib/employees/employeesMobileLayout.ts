/** Mobile filter panel visibility classes for the Employees directory (< md). */
export function employeeFiltersPanelClass(mobileOpen: boolean): string {
  return mobileOpen ? "mt-3 block md:mt-0" : "hidden md:block";
}
