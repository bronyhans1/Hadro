"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  canAccessAdminFeatures,
  canAccessManagerFeatures,
  canEditPayrollSchedulePolicy,
  hasRole,
  ADMIN_MANAGER_ROLES,
  isPlatformAdmin,
} from "@/lib/auth/roles";
import { filterNavEntries, flattenNavForSearch } from "@/lib/navigation/filterNav";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { PlatformNotificationBell } from "@/components/platform/PlatformNotificationBell";
import { CompanyBranchContext } from "./CompanyBranchContext";
import { GlobalSearchTrigger, useGlobalSearchShortcut } from "./GlobalSearch";
import { ProfileMenu } from "./ProfileMenu";
import { TENANT_NAV_ITEMS } from "@/lib/navigation/tenantNav";
import { PLATFORM_NAV_ITEMS } from "@/lib/navigation/platformNav";
import type { SearchableNavItem } from "@/lib/navigation/types";
import { translate } from "@/lib/i18n";

const GlobalSearch = dynamic(
  () => import("./GlobalSearch").then((mod) => mod.GlobalSearch),
  { ssr: false }
);
const ProfileDrawer = dynamic(
  () => import("@/components/profile/ProfileDrawer").then((mod) => mod.ProfileDrawer),
  { ssr: false }
);
const LogoutConfirmDialog = dynamic(
  () => import("@/components/auth/LogoutConfirmDialog").then((mod) => mod.LogoutConfirmDialog),
  { ssr: false }
);

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const isPlatform = !!user && isPlatformAdmin(user.roles);
  const showTenantNotifications = !!user && !isPlatform;
  const settingsHref = isPlatform ? "/platform/settings" : "/settings";

  const openSearch = useCallback(() => setSearchOpen(true), []);
  useGlobalSearchShortcut(openSearch);

  const searchItems = useMemo((): SearchableNavItem[] => {
    if (!user) return [];
    const isManager = canAccessManagerFeatures(user.roles);
    const isAdminManager = hasRole(user.roles, ADMIN_MANAGER_ROLES);
    const isAdmin = canAccessAdminFeatures(user.roles);
    const isAdminHr = canEditPayrollSchedulePolicy(user.roles);
    const payrollEnabled = user.payrollEnabled !== false;

    const source = isPlatform ? PLATFORM_NAV_ITEMS : TENANT_NAV_ITEMS;
    const filtered = filterNavEntries(source, {
      isManager,
      isAdminManager,
      isAdmin,
      isAdminHr,
      payrollEnabled,
    });
    return flattenNavForSearch(filtered);
  }, [user, isPlatform]);

  function handleLogoutConfirmed() {
    logout();
    router.replace("/login");
  }

  return (
    <>
      <header
        className="app-header fixed right-0 top-0 z-20 flex min-w-0 items-center gap-3 px-3 sm:gap-4 sm:px-5"
        style={{ left: "var(--sidebar-width)" }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <GlobalSearchTrigger onClick={() => setSearchOpen(true)} />

          {user?.profileCompletion &&
          user.profileCompletion.requiredComplete &&
          user.profileCompletion.recommendedMissingFields.length > 0 ? (
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="ds-focus-ring hidden shrink-0 items-center gap-2 rounded-full border border-[var(--ds-color-warning-border)] bg-[var(--ds-color-warning-subtle)] px-3 py-1 text-xs font-medium text-[var(--ds-color-warning-text)] shadow-sm transition-colors hover:opacity-90 md:inline-flex"
            >
              <span>{translate("profile.completeProfile")}</span>
              <span
                className="rounded px-1.5 py-0.5 font-semibold"
                style={{ background: "var(--surface)", color: "var(--text-primary)" }}
              >
                {translate("common.optional")}
              </span>
            </button>
          ) : null}
        </div>

        <CompanyBranchContext />

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {showTenantNotifications ? <NotificationBell /> : null}
          {isPlatform ? <PlatformNotificationBell /> : null}
          {user ? (
            <ProfileMenu
              onOpenProfile={() => setProfileOpen(true)}
              onSignOut={() => setLogoutConfirmOpen(true)}
              settingsHref={settingsHref}
            />
          ) : null}
        </div>
      </header>

      <GlobalSearch items={searchItems} open={searchOpen} onOpenChange={setSearchOpen} />
      <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} />
      <LogoutConfirmDialog
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={handleLogoutConfirmed}
      />
    </>
  );
}
