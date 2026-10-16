"use client";

import { cn } from "@/lib/design-system/cn";
import { navText } from "@/lib/navigation/navText";

interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
  className?: string;
}

export function Progress({ value, max = 100, label, className }: ProgressProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div className={cn("space-y-1", className)}>
      {label ? (
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: "var(--ds-color-text-muted)" }}>{label}</span>
          <span className="tabular-nums font-medium" style={{ color: "var(--ds-color-text-primary)" }}>
            {Math.round(pct)}%
          </span>
        </div>
      ) : null}
      <div
        className="h-2 w-full overflow-hidden rounded-full"
        style={{ background: "var(--ds-color-surface-muted)" }}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? navText("common.progress", "Progress")}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{
            width: `${pct}%`,
            background: "var(--ds-color-primary)",
          }}
        />
      </div>
    </div>
  );
}
