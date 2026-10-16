"use client";

import React from "react";
import { m, useReducedMotion } from "motion/react";
import { cn } from "@/lib/design-system/cn";
import { loadingAnimation, motionVariants } from "@/lib/motion";
import { SkeletonCard } from "./Skeleton";
import { Spinner } from "./LoadingPrimitives";
import { navText } from "@/lib/navigation/navText";

interface LoadingStateProps {
  message?: string;
  className?: string;
  variant?: "message" | "skeleton-card";
}

export function LoadingState({
  message = navText("common.loadingEllipsis", "Loading…"),
  className = "",
  variant = "message",
}: LoadingStateProps) {
  const reduced = useReducedMotion();

  if (variant === "skeleton-card") {
    return <SkeletonCard className={className} />;
  }

  return (
    <m.div
      className={cn(
        "flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border py-14",
        className
      )}
      style={{
        borderColor: "var(--ds-color-border)",
        background: "var(--ds-color-surface-muted)",
        color: "var(--ds-color-text-muted)",
      }}
      variants={motionVariants(reduced, loadingAnimation)}
      initial="hidden"
      animate="visible"
      role="status"
      aria-live="polite"
    >
      <span
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{
          background: "linear-gradient(180deg, rgba(37, 99, 235, 0.12), rgba(37, 99, 235, 0.06))",
          color: "var(--ds-color-primary)",
        }}
      >
        <Spinner className="h-5 w-5" />
      </span>
      <p className="text-sm font-medium">{message}</p>
    </m.div>
  );
}
