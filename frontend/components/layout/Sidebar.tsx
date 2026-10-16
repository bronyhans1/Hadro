"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  canAccessManagerFeatures,
  hasRole,
  ADMIN_MANAGER_ROLES,
  canAccessAdminFeatures,
  canEditPayrollSchedulePolicy,
} from "@/lib/auth/roles";
import { TENANT_NAV_ITEMS } from "@/lib/navigation/tenantNav";
import { filterNavEntries } from "@/lib/navigation/filterNav";
import { SidebarBrand } from "./SidebarBrand";
import { SidebarNavList } from "./SidebarNavList";
import { useSidebarCollapse } from "./SidebarCollapseContext";
import { navText } from "@/lib/navigation/navText";

export function Sidebar() {
  const { user } = useAuth();
  const { collapsed, toggle } = useSidebarCollapse();
  const isManager = canAccessManagerFeatures(user?.roles);
  const isAdminManager = hasRole(user?.roles, ADMIN_MANAGER_ROLES);
  const isAdmin = canAccessAdminFeatures(user?.roles);
  const isAdminHr = canEditPayrollSchedulePolicy(user?.roles);
  const payrollEnabled = user?.payrollEnabled !== false;

  const visibleItems = useMemo(
    () =>
      filterNavEntries(TENANT_NAV_ITEMS, {
        isManager,
        isAdminManager,
        isAdmin,
        isAdminHr,
        payrollEnabled,
      }),
    [payrollEnabled, isManager, isAdminManager, isAdmin, isAdminHr]
  );

  return (
    <aside
      className="sidebar-shell fixed left-0 top-0 z-30 h-screen"
      style={{ width: "var(--sidebar-width)" }}
      aria-label={navText("accessibility.mainNavigation", "Main navigation")}
    >
      <div className="flex h-full flex-col">
        <SidebarBrand homeHref="/dashboard" />
        <nav className="sidebar-nav-scroll flex-1 overflow-y-auto px-3 pt-3 pb-6" aria-label={navText("common.applicationModules", "Application modules")}>
          <SidebarNavList items={visibleItems} />
        </nav>
        <div className="sidebar-footer">
          <button
            type="button"
            onClick={toggle}
            className="nav-link sidebar-nav-link sidebar-collapse-button w-full text-[var(--text-muted)]"
            aria-label={collapsed ? navText("common.expandSidebar", "Expand sidebar") : navText("common.collapseSidebar", "Collapse sidebar")}
            title={collapsed ? navText("common.expandSidebar", "Expand sidebar") : navText("common.collapseSidebar", "Collapse sidebar")}
          >
            <svg
              className={`sidebar-nav-icon transition-transform ${collapsed ? "rotate-180" : ""}`}
              style={{ transitionDuration: "var(--ds-duration-normal)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            <span className="sidebar-collapse-label">{navText("common.collapseSidebar", "Collapse sidebar")}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
