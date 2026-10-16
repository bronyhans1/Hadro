import React from "react";
import { cn } from "@/lib/design-system/cn";

export type BadgeVariant =
  | "default"
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "active"
  | "draft"
  | "approved"
  | "locked"
  | "closed"
  | "pending"
  | "cancelled"
  | "late"
  | "present"
  | "absent"
  | "completed"
  | "remote"
  | "rejected"
  | "inactive"
  | "archived"
  | "unknown"
  | "blocked";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default:
    "border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] text-[var(--ds-color-text-secondary)]",
  neutral:
    "border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] text-[var(--ds-color-text-secondary)]",
  info: "border-[var(--ds-color-info-border)] bg-[var(--ds-color-info-subtle)] text-[var(--ds-color-info-text)]",
  success:
    "border-[var(--ds-color-success-border)] bg-[var(--ds-color-success-subtle)] text-[var(--ds-color-success-text)]",
  warning:
    "border-[var(--ds-color-warning-border)] bg-[var(--ds-color-warning-subtle)] text-[var(--ds-color-warning-text)]",
  danger:
    "border-[var(--ds-color-danger-border)] bg-[var(--ds-color-danger-subtle)] text-[var(--ds-color-danger-text)]",
  active:
    "border-[var(--ds-color-success-border)] bg-[var(--ds-color-success-subtle)] text-[var(--ds-color-success-text)]",
  draft:
    "border-[var(--ds-color-warning-border)] bg-[var(--ds-color-warning-subtle)] text-[var(--ds-color-warning-text)]",
  approved:
    "border-[var(--ds-color-success-border)] bg-[var(--ds-color-success-subtle)] text-[var(--ds-color-success-text)]",
  locked:
    "border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] text-[var(--ds-color-text-secondary)]",
  closed:
    "border-[var(--ds-color-border-strong)] bg-[var(--ds-color-surface-muted)] text-[var(--ds-color-text-muted)]",
  pending:
    "border-[var(--ds-color-warning-border)] bg-[var(--ds-color-warning-subtle)] text-[var(--ds-color-warning-text)]",
  cancelled:
    "border-[var(--ds-color-danger-border)] bg-[var(--ds-color-danger-subtle)] text-[var(--ds-color-danger-text)]",
  late:
    "border-[var(--ds-color-warning-border)] bg-[var(--ds-color-warning-subtle)] text-[var(--ds-color-warning-text)]",
  present:
    "border-[var(--ds-color-success-border)] bg-[var(--ds-color-success-subtle)] text-[var(--ds-color-success-text)]",
  absent:
    "border-[var(--ds-color-danger-border)] bg-[var(--ds-color-danger-subtle)] text-[var(--ds-color-danger-text)]",
  completed:
    "border-[var(--ds-color-success-border)] bg-[var(--ds-color-success-subtle)] text-[var(--ds-color-success-text)]",
  remote:
    "border-[var(--ds-color-info-border)] bg-[var(--ds-color-info-subtle)] text-[var(--ds-color-info-text)]",
  rejected:
    "border-[var(--ds-color-danger-border)] bg-[var(--ds-color-danger-subtle)] text-[var(--ds-color-danger-text)]",
  inactive:
    "border-[var(--ds-color-danger-border)] bg-[var(--ds-color-danger-subtle)] text-[var(--ds-color-danger-text)]",
  archived:
    "border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] text-[var(--ds-color-text-muted)]",
  unknown:
    "border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] text-[var(--ds-color-text-muted)]",
  blocked:
    "border-[var(--ds-color-border-strong)] bg-[var(--ds-color-surface-muted)] text-[var(--ds-color-text-secondary)]",
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium leading-4",
        "transition-colors",
        variants[variant],
        className
      )}
      style={{ transitionDuration: "var(--ds-duration-fast)" }}
    >
      {children}
    </span>
  );
}
