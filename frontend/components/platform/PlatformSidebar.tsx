"use client";

import { PLATFORM_NAV_ITEMS } from "@/lib/navigation/platformNav";
import { SidebarBrand } from "@/components/layout/SidebarBrand";
import { SidebarNavList } from "@/components/layout/SidebarNavList";
import { useSidebarCollapse } from "@/components/layout/SidebarCollapseContext";
import { translate } from "@/lib/i18n";

export function PlatformSidebar() {
  const { collapsed, toggle } = useSidebarCollapse();

  return (
    <aside
      className="sidebar-shell fixed left-0 top-0 z-30 h-screen"
      style={{ width: "var(--sidebar-width)" }}
      aria-label={translate("platform.platformNavigation")}
    >
      <div className="flex h-full flex-col">
        <SidebarBrand homeHref="/platform/dashboard" subtitle={translate("common.platformConsole")} />
        <nav className="sidebar-nav-scroll flex-1 overflow-y-auto px-2 pt-2 pb-6" aria-label={translate("platform.platformModules")}>
          <SidebarNavList items={PLATFORM_NAV_ITEMS} />
        </nav>
        <div className="sidebar-footer">
          <button
            type="button"
            onClick={toggle}
            className="nav-link sidebar-nav-link sidebar-collapse-button w-full text-[var(--text-muted)]"
            aria-label={collapsed ? translate("common.expandSidebar") : translate("common.collapseSidebar")}
            title={collapsed ? translate("common.expandSidebar") : translate("common.collapseSidebar")}
          >
            <svg
              className={`sidebar-nav-icon transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            <span className="sidebar-collapse-label">{translate("common.collapseSidebar")}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
