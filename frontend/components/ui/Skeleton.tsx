import React from "react";
import { cn } from "@/lib/design-system/cn";
import { navText } from "@/lib/navigation/navText";

export interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return <div className={cn("ds-skeleton", className)} style={style} aria-hidden />;
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-3" style={{ width: i === lines - 1 ? "70%" : "100%" }} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn("rounded-xl border p-4", className)}
      style={{
        borderColor: "var(--ds-color-border)",
        background: "var(--ds-color-surface)",
        boxShadow: "var(--ds-shadow-card)",
      }}
      aria-busy
      aria-label={navText("common.loading", "Loading")}
    >
      <Skeleton className="mb-3 h-4 w-1/3" />
      <Skeleton className="mb-2 h-8 w-1/2" />
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div
      className={cn("overflow-hidden rounded-xl border", className)}
      style={{ borderColor: "var(--ds-color-border)", background: "var(--ds-color-surface)" }}
      aria-busy
      aria-label={navText("common.loadingTable", "Loading table")}
    >
      <div className="flex gap-4 border-b px-4 py-3" style={{ borderColor: "var(--ds-color-border)", background: "var(--ds-color-surface-muted)" }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b px-4 py-3 last:border-0" style={{ borderColor: "var(--ds-color-border)" }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonForm({ fields = 4, className }: { fields?: number; className?: string }) {
  return (
    <div className={cn("space-y-4", className)} aria-busy aria-label={navText("common.loadingForm", "Loading form")}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Skeleton className="mb-2 h-3 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
      <Skeleton className="h-9 w-28" />
    </div>
  );
}
