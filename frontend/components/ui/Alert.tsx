import React from "react";
import { cn } from "@/lib/design-system/cn";

export type AlertVariant = "success" | "info" | "warning" | "error";

const variantConfig: Record<
  AlertVariant,
  { bg: string; border: string; text: string; icon: string }
> = {
  success: {
    bg: "var(--ds-color-success-subtle)",
    border: "var(--ds-color-success-border)",
    text: "var(--ds-color-success-text)",
    icon: "✓",
  },
  info: {
    bg: "var(--ds-color-info-subtle)",
    border: "var(--ds-color-info-border)",
    text: "var(--ds-color-info-text)",
    icon: "i",
  },
  warning: {
    bg: "var(--ds-color-warning-subtle)",
    border: "var(--ds-color-warning-border)",
    text: "var(--ds-color-warning-text)",
    icon: "!",
  },
  error: {
    bg: "var(--ds-color-danger-subtle)",
    border: "var(--ds-color-danger-border)",
    text: "var(--ds-color-danger-text)",
    icon: "×",
  },
};

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function Alert({ variant = "info", title, children, className, icon }: AlertProps) {
  const cfg = variantConfig[variant];
  return (
    <div
      role="alert"
      className={cn("flex gap-3 rounded-lg border p-4", className)}
      style={{
        background: cfg.bg,
        borderColor: cfg.border,
        color: cfg.text,
      }}
    >
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
        style={{ background: "var(--ds-color-surface)", color: cfg.text }}
        aria-hidden
      >
        {icon ?? cfg.icon}
      </span>
      <div className="min-w-0 flex-1">
        {title ? <p className="text-sm font-semibold">{title}</p> : null}
        <div className={cn("text-sm", title && "mt-1")}>{children}</div>
      </div>
    </div>
  );
}
