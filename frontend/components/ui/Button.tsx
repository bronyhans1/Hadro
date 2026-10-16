"use client";

import React from "react";
import { m, useReducedMotion } from "motion/react";
import type { HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/design-system/cn";
import { buttonInteraction, transitions } from "@/lib/motion";
import { Spinner } from "./LoadingPrimitives";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "dangerGhost"
  | "success"
  | "warning"
  | "link"
  | "filter";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconOnly?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-transparent bg-[var(--ds-color-primary)] text-[#1C1C1C] hover:bg-[var(--ds-color-primary-hover)] active:bg-[var(--ds-color-primary-active)]",
  secondary:
    "border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] text-[var(--ds-color-text-primary)] hover:border-[var(--ds-color-border-strong)] hover:bg-[var(--ds-color-nav-hover)]",
  outline:
    "border border-[var(--ds-color-border)] bg-transparent text-[var(--ds-color-text-primary)] hover:border-[var(--ds-color-border-strong)] hover:bg-[var(--ds-color-nav-hover)]",
  ghost:
    "border border-transparent bg-transparent text-[var(--ds-color-text-primary)] hover:bg-[var(--ds-color-nav-hover)]",
  danger:
    "border border-transparent bg-[var(--ds-color-danger)] text-white hover:bg-[var(--ds-color-danger-hover)]",
  dangerGhost:
    "border border-transparent bg-transparent text-[var(--ds-color-danger-text)] hover:bg-[var(--ds-color-danger-subtle)] hover:text-[var(--ds-color-danger-text)]",
  success:
    "border border-transparent bg-[var(--ds-color-success)] text-white hover:bg-[var(--ds-color-success-hover)]",
  warning:
    "border border-transparent bg-[var(--ds-color-warning)] text-white hover:bg-[var(--ds-color-warning-hover)]",
  link:
    "h-auto border border-transparent bg-transparent px-0 text-sm text-[var(--ds-color-primary)] underline-offset-4 hover:underline",
  filter:
    "border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] text-[var(--ds-color-text-secondary)] hover:border-[var(--ds-color-border-strong)] hover:bg-[var(--ds-color-primary-muted)] hover:text-[var(--ds-color-text-primary)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  iconOnly = false,
  leftIcon,
  rightIcon,
  disabled,
  className,
  children,
  style,
  type = "button",
  "aria-busy": ariaBusy,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const reduced = useReducedMotion();

  return (
    <m.button
      type={type}
      disabled={isDisabled}
      aria-busy={loading ? true : ariaBusy}
      className={cn(
        "ds-focus-ring relative inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold",
        "transition-[background-color,border-color,box-shadow,transform,opacity]",
        variantClasses[variant],
        iconOnly && "aspect-square p-0",
        !iconOnly && variant !== "link" && sizeClasses[size],
        iconOnly && (size === "sm" ? "h-8 w-8" : size === "lg" ? "h-11 w-11" : "h-9 w-9"),
        isDisabled && "cursor-not-allowed opacity-50",
        className
      )}
      style={{
        transitionDuration: "var(--ds-duration-normal)",
        ...style,
      }}
      whileHover={!isDisabled && !reduced ? buttonInteraction.hover : undefined}
      whileTap={!isDisabled && !reduced ? buttonInteraction.tap : undefined}
      transition={transitions.fast}
      {...props}
    >
      {loading ? (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
          <Spinner className="h-4 w-4" />
        </span>
      ) : null}
      <span className={cn("inline-flex items-center justify-center gap-2", loading && "invisible")}>
        {leftIcon}
        {/* iconOnly IconButtons pass the icon as children — must still render */}
        {children}
        {rightIcon}
      </span>
    </m.button>
  );
}

export function IconButton({
  "aria-label": ariaLabel,
  children,
  ...props
}: ButtonProps & { "aria-label": string }) {
  return (
    <Button iconOnly aria-label={ariaLabel} {...props}>
      {children}
    </Button>
  );
}
