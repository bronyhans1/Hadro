/** Desktop organisation DataTable visibility (md and up). */
export function organisationDesktopTableClass(): string {
  return "hidden md:block";
}

/** Mobile organisation card/list visibility (below md). */
export function organisationMobileCardsClass(): string {
  return "space-y-3 md:hidden";
}

/** Filter panel visibility for organisation ResponsiveFilterCard-style collapses (< md). */
export function organisationFiltersPanelClass(mobileOpen: boolean): string {
  return mobileOpen ? "mt-3 block md:mt-0" : "hidden md:block";
}

export interface OrganisationTableColumnLike {
  key: string;
}

/** Split table columns into primary header, detail fields, and optional actions for mobile cards. */
export function splitOrganisationTableColumns<T extends OrganisationTableColumnLike>(
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
