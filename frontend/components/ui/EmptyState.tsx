"use client";

import React from "react";
import { FolderOpen } from "lucide-react";
import { m, useReducedMotion } from "motion/react";
import { cn } from "@/lib/design-system/cn";
import { emptyIconReveal, fadeIn, motionVariants } from "@/lib/motion";
import { Button } from "./Button";
import { navText } from "@/lib/navigation/navText";

interface EmptyStateProps {
  message?: string;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  message = navText("common.noData", "No data"),
  title,
  description,
  icon,
  action,
  secondaryAction,
  className = "",
  compact = false,
}: EmptyStateProps) {
  const reduced = useReducedMotion();
  const displayTitle = title ?? message;
  const displayDescription = description;
  const displayIcon = icon ?? <FolderOpen className="h-5 w-5" />;

  return (
    <m.div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border px-6 py-12 text-center",
        "transition-[border-color,background-color]",
        compact && "rounded-none border-0 px-4 py-8",
        className
      )}
      style={{
        borderColor: "var(--ds-color-border)",
        background: "var(--ds-color-surface-muted)",
        transitionDuration: "var(--ds-duration-normal)",
      }}
      variants={motionVariants(reduced, fadeIn)}
      initial="hidden"
      animate="visible"
    >
      <m.div
        className={cn(
          "mb-4 flex h-12 w-12 items-center justify-center rounded-full",
          compact && "mb-3 h-10 w-10"
        )}
        style={{
          background: "var(--ds-color-primary-muted)",
          color: "var(--ds-color-primary)",
        }}
        variants={motionVariants(reduced, emptyIconReveal)}
        aria-hidden
      >
        {displayIcon}
      </m.div>
      <p className="text-sm font-semibold" style={{ color: "var(--ds-color-text-primary)" }}>
        {displayTitle}
      </p>
      {displayDescription ? (
        <p className="ds-caption mt-2 max-w-sm">{displayDescription}</p>
      ) : null}
      {action || secondaryAction ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </m.div>
  );
}

/** Convenience empty state with a single primary action button. */
export function EmptyStateWithAction({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <EmptyState
      title={title}
      description={description}
      action={
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      }
    />
  );
}
