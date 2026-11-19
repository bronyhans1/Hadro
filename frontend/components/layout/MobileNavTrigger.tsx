"use client";

import { Menu, X } from "lucide-react";
import { navText } from "@/lib/navigation/navText";
import { useMobileNav } from "./SidebarCollapseContext";

/** Hamburger / close control for the shared mobile navigation drawer (< lg). */
export function MobileNavTrigger() {
  const { mobileNavOpen, toggleMobileNav } = useMobileNav();

  return (
    <button
      type="button"
      className="shell-mobile-nav-trigger ds-focus-ring inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border lg:hidden"
      style={{
        borderColor: "var(--ds-color-border)",
        background: "var(--ds-color-surface-muted)",
        color: "var(--ds-color-text-primary)",
      }}
      aria-label={
        mobileNavOpen
          ? navText("common.closeNavigation", "Close navigation")
          : navText("common.openNavigation", "Open navigation")
      }
      aria-expanded={mobileNavOpen}
      aria-controls="hadro-app-shell-nav"
      onClick={() => toggleMobileNav()}
    >
      {mobileNavOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
    </button>
  );
}
