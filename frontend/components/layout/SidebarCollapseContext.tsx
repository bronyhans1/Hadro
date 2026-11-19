"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import {
  SHELL_DESKTOP_MIN_PX,
  reduceMobileNav,
  shellDesktopRailWidth,
  type MobileNavState,
} from "@/lib/layout/shellLayout";

const STORAGE_KEY = "hadro-sidebar-collapsed";

interface SidebarCollapseContextValue {
  collapsed: boolean;
  /** True when viewport is ≥ 1024px. Desktop collapse applies only while this is true. */
  isDesktopShell: boolean;
  /** Collapse preference applied only on desktop rail (never inside the mobile drawer). */
  railCollapsed: boolean;
  toggle: () => void;
  mobileNavOpen: boolean;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  toggleMobileNav: () => void;
}

const SidebarCollapseContext = createContext<SidebarCollapseContextValue | null>(null);

const initialMobileNav: MobileNavState = { open: false };

export function SidebarCollapseProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [isDesktopShell, setIsDesktopShell] = useState(true);
  const [mobileNav, dispatchMobileNav] = useReducer(reduceMobileNav, initialMobileNav);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") setCollapsed(true);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  /* Desktop rail width only — mobile layout inset is forced to 0 in CSS. */
  useEffect(() => {
    if (!hydrated) return;
    const width = shellDesktopRailWidth(collapsed);
    document.documentElement.style.setProperty("--sidebar-width", width);
    document.documentElement.dataset.sidebarCollapsed = collapsed ? "true" : "false";
  }, [collapsed, hydrated]);

  useEffect(() => {
    document.documentElement.dataset.mobileNavOpen = mobileNav.open ? "true" : "false";
  }, [mobileNav.open]);

  /* Close drawer on route changes (nav link selection). */
  useEffect(() => {
    dispatchMobileNav({ type: "routeChange" });
  }, [pathname]);

  /* Track desktop breakpoint; crossing into desktop must not leave a stale open drawer. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(`(min-width: ${SHELL_DESKTOP_MIN_PX}px)`);
    const sync = () => {
      setIsDesktopShell(mq.matches);
      if (mq.matches) dispatchMobileNav({ type: "viewportDesktop" });
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  /* Prevent background scroll while the mobile drawer is open. */
  useEffect(() => {
    if (!mobileNav.open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileNav.open]);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const openMobileNav = useCallback(() => dispatchMobileNav({ type: "open" }), []);
  const closeMobileNav = useCallback(() => dispatchMobileNav({ type: "close" }), []);
  const toggleMobileNav = useCallback(() => dispatchMobileNav({ type: "toggle" }), []);

  const railCollapsed = collapsed && isDesktopShell;

  return (
    <SidebarCollapseContext.Provider
      value={{
        collapsed,
        isDesktopShell,
        railCollapsed,
        toggle,
        mobileNavOpen: mobileNav.open,
        openMobileNav,
        closeMobileNav,
        toggleMobileNav,
      }}
    >
      {children}
    </SidebarCollapseContext.Provider>
  );
}

const fallback: SidebarCollapseContextValue = {
  collapsed: false,
  isDesktopShell: true,
  railCollapsed: false,
  toggle: () => {},
  mobileNavOpen: false,
  openMobileNav: () => {},
  closeMobileNav: () => {},
  toggleMobileNav: () => {},
};

export function useSidebarCollapse() {
  const ctx = useContext(SidebarCollapseContext);
  return ctx ?? fallback;
}

export function useMobileNav() {
  const { mobileNavOpen, openMobileNav, closeMobileNav, toggleMobileNav } = useSidebarCollapse();
  return { mobileNavOpen, openMobileNav, closeMobileNav, toggleMobileNav };
}
