export interface NavPermissionFlags {
  managerOnly?: boolean;
  adminManagerOnly?: boolean;
  adminOnly?: boolean;
  /** Admin or HR (company profile, schedule policy editors). */
  adminHrOnly?: boolean;
  payrollOnly?: boolean;
}

export interface NavLinkEntry extends NavPermissionFlags {
  type: "link";
  href: string;
  label: string;
  labelKey?: string;
  section?: string;
  sectionKey?: string;
}

export interface NavChildEntry extends NavPermissionFlags {
  href: string;
  label: string;
  labelKey?: string;
}

export interface NavGroupEntry {
  type: "group";
  id: string;
  label: string;
  labelKey?: string;
  section?: string;
  sectionKey?: string;
  iconHref: string;
  children: NavChildEntry[];
}

export type NavEntry = NavLinkEntry | NavGroupEntry;

/** @deprecated Use NavLinkEntry — kept for gradual migration */
export interface NavItem extends NavPermissionFlags {
  href: string;
  label: string;
  section?: string;
}

export interface SearchableNavItem {
  href: string;
  label: string;
  labelKey?: string;
  section?: string;
  sectionKey?: string;
  keywords?: string[];
}

export interface NavPermissionContext {
  isManager: boolean;
  isAdminManager: boolean;
  isAdmin: boolean;
  isAdminHr: boolean;
  payrollEnabled: boolean;
}
