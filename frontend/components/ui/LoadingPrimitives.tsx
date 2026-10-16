"use client";

import React from "react";
import { LoaderCircle } from "lucide-react";
import { m, useReducedMotion } from "motion/react";
import { cn } from "@/lib/design-system/cn";
import { loadingAnimation, motionVariants } from "@/lib/motion";
import { navText } from "@/lib/navigation/navText";

export function Spinner({
  className,
  label = navText("common.loading", "Loading"),
}: {
  className?: string;
  label?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <m.span
      className="inline-flex"
      variants={motionVariants(reduced, loadingAnimation)}
      initial="hidden"
      animate="visible"
      role="status"
      aria-label={label}
    >
      <LoaderCircle className={cn("animate-spin", className)} aria-hidden />
    </m.span>
  );
}

export function InlineSpinner({
  label = navText("common.loading", "Loading"),
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-2 text-sm", className)}
      style={{ color: "var(--ds-color-text-muted)" }}
      role="status"
      aria-live="polite"
    >
      <Spinner className="h-4 w-4" label={label} />
      <span>{label}</span>
    </span>
  );
}

export function LoadingBar({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn("relative h-1 w-full overflow-hidden rounded-full", className)}
      style={{ background: "var(--ds-color-primary-muted)" }}
      aria-hidden
    >
      <span
        className="absolute inset-y-0 left-0 w-1/3 animate-[loading-bar_1.2s_ease-in-out_infinite] rounded-full"
        style={{
          background:
            "linear-gradient(90deg, var(--ds-color-primary), var(--ds-color-primary-hover))",
        }}
      />
    </div>
  );
}
