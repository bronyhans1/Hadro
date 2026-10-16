"use client";

import { CheckCircle2, X } from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { cn } from "@/lib/design-system/cn";
import { fadeUp, motionVariants } from "@/lib/motion";
import { navText } from "@/lib/navigation/navText";
import { translate } from "@/lib/i18n";

export type SuccessBannerProps = {
  open: boolean;
  /** Primary heading — default “Changes Saved”. */
  title?: string;
  /** Supporting sentence under the title. */
  description?: string;
  onDismiss?: () => void;
  className?: string;
};

/**
 * Prominent inline success confirmation for major actions (settings, profiles, config).
 * Does not auto-scroll — pair with a viewport toast via useSuccessBanner so feedback
 * is visible regardless of scroll position.
 */
export function SuccessBanner({
  open,
  title,
  description,
  onDismiss,
  className,
}: SuccessBannerProps) {
  const reduced = useReducedMotion();
  const heading = title ?? translate("leave.changesSaved");
  const detail = description ?? translate("common.changesSavedDescription");

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <m.div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={cn(
            "relative flex gap-3 rounded-xl border px-4 py-3.5 shadow-sm",
            className
          )}
          style={{
            background: "var(--ds-color-success-subtle)",
            borderColor: "var(--ds-color-success-border)",
            color: "var(--ds-color-text-primary)",
            boxShadow: "var(--ds-shadow-card, var(--shadow-soft))",
          }}
          variants={motionVariants(reduced, fadeUp)}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <span
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            style={{
              background: "var(--ds-color-surface)",
              color: "var(--ds-color-success-text)",
              boxShadow: "inset 0 0 0 1px var(--ds-color-success-border)",
            }}
            aria-hidden
          >
            <CheckCircle2 className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0 flex-1 pr-6">
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--ds-color-success-text)" }}
            >
              {heading}
            </p>
            {detail ? (
              <p className="mt-0.5 text-sm" style={{ color: "var(--ds-color-text-secondary)" }}>
                {detail}
              </p>
            ) : null}
          </div>
          {onDismiss ? (
            <button
              type="button"
              onClick={onDismiss}
              className="absolute right-2 top-2 rounded-md p-1.5 transition-colors hover:bg-[var(--ds-color-nav-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
              aria-label={navText("common.dismissSuccess", "Dismiss success message")}
              style={{ color: "var(--ds-color-text-muted)" }}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
