"use client";

import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { cn } from "@/lib/design-system/cn";
import {
  drawerBackdrop,
  drawerPanel,
  drawerPresence,
  motionVariants,
  reducedFade,
} from "@/lib/motion";
import { navText } from "@/lib/navigation/navText";

export type DrawerSize = "md" | "lg";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** md = max-w-md (default); lg = max-w-xl for denser detail panels */
  size?: DrawerSize;
}

const sizeClasses: Record<DrawerSize, string> = {
  md: "max-w-md",
  lg: "max-w-xl",
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared right slide-over panel. Use for detail/preview drawers across the app.
 * Overlay z-40 · panel z-50 · Modal should sit above (z-[55]) when nested.
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: DrawerProps) {
  const reduced = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
        const top = dialogs[dialogs.length - 1];
        if (top && panelRef.current && top !== panelRef.current) return;
        e.stopPropagation();
        onCloseRef.current();
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
      document.body.style.overflow = "";
      previousFocusRef.current?.focus?.();
      previousFocusRef.current = null;
    };
    // Focus moves only when the drawer opens or closes. `onClose` is read from a ref
    // so a new callback on each parent render does not steal focus from fields inside.
  }, [open]);

  const panelMotion = reduced ? reducedFade : drawerPanel;

  return (
    <AnimatePresence>
      {open ? (
        <m.div
          className="fixed inset-0 z-50 flex justify-end"
          variants={drawerPresence}
          initial={false}
          animate="visible"
          exit="exit"
        >
          <m.button
            type="button"
            className="absolute inset-0 z-40 cursor-default border-0 p-0"
            style={{ background: "var(--ds-color-overlay)" }}
            variants={motionVariants(reduced, drawerBackdrop)}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            aria-label={navText("common.closeDrawer", "Close drawer")}
          />
          <m.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            className={cn(
              "relative z-50 flex h-full w-full flex-col border-l",
              sizeClasses[size]
            )}
            style={{
              borderColor: "var(--ds-color-border)",
              background: "var(--ds-color-surface)",
              boxShadow: "var(--ds-shadow-drawer)",
            }}
            variants={motionVariants(reduced, panelMotion)}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div
              className="flex shrink-0 items-start justify-between gap-3 border-b px-5 py-4"
              style={{ borderColor: "var(--ds-color-border)" }}
            >
              <div className="min-w-0">
                <h2 id={titleId} className="ds-h2 text-lg">
                  {title}
                </h2>
                {description ? (
                  <p id={descriptionId} className="ds-caption mt-0.5">
                    {description}
                  </p>
                ) : null}
              </div>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={onClose}
                className="ds-focus-ring shrink-0 rounded-lg p-1.5 transition-colors hover:bg-[var(--ds-color-nav-hover)]"
                style={{
                  color: "var(--ds-color-text-muted)",
                  transitionDuration: "var(--ds-duration-fast)",
                }}
                aria-label={navText("common.close", "Close")}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

            {footer ? (
              <div
                className="flex shrink-0 items-center justify-end gap-2 border-t px-5 py-3.5"
                style={{ borderColor: "var(--ds-color-border)" }}
              >
                {footer}
              </div>
            ) : null}
          </m.div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
