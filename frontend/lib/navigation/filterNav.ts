import type {
  NavChildEntry,
  NavEntry,
  NavGroupEntry,
  NavPermissionContext,
  NavPermissionFlags,
  SearchableNavItem,
} from "./types";

/** Overview routes — exact pathname match only (prevents parent/child dual-active). */
const EXACT_MATCH_HREFS = new Set([
  "/attendance",
  "/payroll",
  "/leave",
  "/platform/companies",
]);

export function isNavRouteActive(pathname: string, href: string): boolean {
  if (EXACT_MATCH_HREFS.has(href)) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isEntryPermitted(flags: NavPermissionFlags, ctx: NavPermissionContext): boolean {
  if (flags.payrollOnly && !ctx.payrollEnabled) return false;
  if (flags.managerOnly && !ctx.isManager) return false;
  if (flags.adminManagerOnly && !ctx.isAdminManager) return false;
  if (flags.adminOnly && !ctx.isAdmin) return false;
  if (flags.adminHrOnly && !ctx.isAdminHr) return false;
  return true;
}

export function filterNavEntries(entries: NavEntry[], ctx: NavPermissionContext): NavEntry[] {
  const result: NavEntry[] = [];

  for (const entry of entries) {
    if (entry.type === "link") {
      if (isEntryPermitted(entry, ctx)) result.push(entry);
      continue;
    }

    const visibleChildren = entry.children.filter((child) => isEntryPermitted(child, ctx));
    if (visibleChildren.length === 0) continue;

    result.push({ ...entry, children: visibleChildren });
  }

  return result;
}

export function getActiveGroupIds(entries: NavEntry[], pathname: string): string[] {
  const ids: string[] = [];
  for (const entry of entries) {
    if (entry.type !== "group") continue;
    if (entry.children.some((child) => isNavRouteActive(pathname, child.href))) {
      ids.push(entry.id);
    }
  }
  return ids;
}

export function findActiveChildInGroup(group: NavGroupEntry, pathname: string): NavChildEntry | null {
  return group.children.find((child) => isNavRouteActive(pathname, child.href)) ?? null;
}

export function flattenNavForSearch(entries: NavEntry[]): SearchableNavItem[] {
  const items: SearchableNavItem[] = [];

  for (const entry of entries) {
    if (entry.type === "link") {
      items.push({
        href: entry.href,
        label: entry.label,
        labelKey: entry.labelKey,
        section: entry.section,
        sectionKey: entry.sectionKey,
        keywords: [entry.href.replace(/\//g, " ")],
      });
      continue;
    }

    for (const child of entry.children) {
      items.push({
        href: child.href,
        label: child.label,
        labelKey: child.labelKey,
        section: entry.label,
        sectionKey: entry.labelKey,
        keywords: [entry.label, child.label, child.href.replace(/\//g, " ")],
      });
    }
  }

  return items;
}
