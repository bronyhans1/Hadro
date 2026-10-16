import type { NavEntry } from "./types";

/** Platform admin navigation — hierarchy: overview, company management, monitoring, settings. */
export const PLATFORM_NAV_ITEMS: NavEntry[] = [
  { type: "link", href: "/platform/dashboard", label: "Dashboard", labelKey: "navigation.dashboard", section: "Platform", sectionKey: "navigation.sections.platform" },
  { type: "link", href: "/platform/companies", label: "Companies", labelKey: "navigation.companies", section: "Company Management", sectionKey: "navigation.sections.companyManagement" },
  { type: "link", href: "/platform/companies/new", label: "Provision Company", labelKey: "navigation.provisionCompany", section: "Company Management", sectionKey: "navigation.sections.companyManagement" },
  { type: "link", href: "/platform/onboarding", label: "Onboarding Requests", labelKey: "navigation.onboardingRequests", section: "Company Management", sectionKey: "navigation.sections.companyManagement" },
  { type: "link", href: "/platform/audit", label: "Audit Center", labelKey: "navigation.auditCenter", section: "Monitoring", sectionKey: "navigation.sections.monitoring" },
  { type: "link", href: "/platform/settings", label: "System Settings", labelKey: "navigation.systemSettings", section: "Platform", sectionKey: "navigation.sections.platform" },
];
