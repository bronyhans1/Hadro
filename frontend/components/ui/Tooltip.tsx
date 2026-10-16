"use client";

import React, { useId, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { cn } from "@/lib/design-system/cn";
import { motionVariants, tooltipAnimation } from "@/lib/motion";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: "top" | "bottom";
  className?: string;
}

export function Tooltip({ content, children, side = "top", className }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {React.cloneElement(children, {
        "aria-describedby": open ? id : undefined,
      } as Partial<unknown>)}
      <AnimatePresence>
        {open ? (
        <m.span
          id={id}
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-50 max-w-xs rounded-md border px-2.5 py-1.5 text-xs font-medium shadow",
            side === "top" ? "bottom-full left-1/2 mb-2" : "top-full left-1/2 mt-2"
          )}
          style={{
            x: "-50%",
            background: "var(--ds-color-surface)",
            borderColor: "var(--ds-color-border)",
            color: "var(--ds-color-text-primary)",
            boxShadow: "var(--ds-shadow-dropdown)",
          }}
          variants={motionVariants(reduced, tooltipAnimation)}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {content}
        </m.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
