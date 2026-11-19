"use client";

import React, { useEffect, useRef } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { cn } from "@/lib/design-system/cn";
import { drawerBackdrop, drawerPresence, motionVariants } from "@/lib/motion";
import { navText } from "@/lib/navigation/navText";
import { useMobileNav } from "./SidebarCollapseContext";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface AppShellSidebarFrameProps {
  children: React.ReactNode;
  ariaLabel: string;
}

/**
 * Shared tenant/platform sidebar chrome.
 * Desktop: fixed rail using --sidebar-width.
 * Below lg: off-canvas drawer controlled by mobile nav state (separate from collapse).
 * Stacking: backdrop z-40 · open panel z-[45] · header z-50 · Modal z-[55].
 * Do not leave a lower utility z-index on the panel while the backdrop is mounted —
 * that intercepts nav Link clicks on mobile.
 */
export function AppShellSidebarFrame({ children, ariaLabel }: AppShellSidebarFrameProps) {
  const { mobileNavOpen, closeMobileNav } = useMobileNav();
  const reduced = useReducedMotion();
  const panelRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef(closeMobileNav);
  closeRef.current = closeMobileNav;

  useEffect(() => {
    if (!mobileNavOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const focusTimer = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1
      );
      (nodes[0] ?? panel).focus();
    }, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
        const top = dialogs[dialogs.length - 1];
        if (top && panelRef.current && top !== panelRef.current) return;
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;

      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1 && el.offsetParent !== null
      );
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || !panelRef.current.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !panelRef.current.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus?.();
      previousFocusRef.current = null;
    };
  }, [mobileNavOpen]);

  return (
    <>
      <AnimatePresence>
        {mobileNavOpen ? (
          <m.button
            key="shell-mobile-nav-backdrop"
            type="button"
            className="shell-mobile-nav-backdrop fixed inset-0 z-40 cursor-default border-0 p-0 lg:hidden"
            style={{ background: "var(--ds-color-overlay)" }}
            aria-label={navText("common.closeNavigation", "Close navigation")}
            variants={drawerPresence}
            initial={false}
            animate="visible"
            exit="exit"
            onClick={() => closeMobileNav()}
          >
            <m.span
              className="absolute inset-0 block"
              variants={motionVariants(reduced, drawerBackdrop)}
              initial="hidden"
              animate="visible"
              exit="exit"
              aria-hidden
            />
          </m.button>
        ) : null}
      </AnimatePresence>

      <aside
        ref={panelRef}
        id="hadro-app-shell-nav"
        className={cn(
          "sidebar-shell fixed left-0 top-0 h-screen outline-none",
          /* Desktop rail: z-30. Mobile open must beat backdrop (z-40) or Links never receive clicks. */
          mobileNavOpen ? "z-[45]" : "z-30"
        )}
        aria-label={ariaLabel}
        data-mobile-open={mobileNavOpen ? "true" : "false"}
        role={mobileNavOpen ? "dialog" : undefined}
        aria-modal={mobileNavOpen ? true : undefined}
        tabIndex={mobileNavOpen ? -1 : undefined}
      >
        <div className="relative z-[1] flex h-full flex-col">{children}</div>
      </aside>
    </>
  );
}
