"use client";

import React from "react";
import { cn } from "@/lib/design-system/cn";
import { MotionStagger } from "./Motion";
import { Skeleton } from "./Skeleton";
import { StatCard, type StatCardTone } from "./StatCard";

export interface StatGridItem {
  key?: React.Key;
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  tone?: StatCardTone;
  animateValue?: boolean;
}

interface StatGridProps {
  items: StatGridItem[];
  loading?: boolean;
  loadingCount?: number;
  ariaLabel: string;
  className?: string;
}

/** Shared KPI layout, loading state, motion, and accessibility contract. */
export function StatGrid({
  items,
  loading = false,
  loadingCount = 6,
  ariaLabel,
  className,
}: StatGridProps) {
  const gridClassName = cn(
    "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
    className
  );

  if (loading) {
    return (
      <div
        className={gridClassName}
        aria-busy="true"
        aria-live="polite"
        aria-label={`Loading ${ariaLabel}`}
      >
        {Array.from({ length: loadingCount }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border p-4"
            style={{
              borderColor: "var(--ds-color-border)",
              background: "var(--ds-color-surface)",
            }}
          >
            <Skeleton className="mb-2 h-3 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <MotionStagger className={gridClassName} aria-label={ariaLabel}>
      {items.map((item) => (
        <StatCard
          key={item.key ?? item.title}
          title={item.title}
          value={item.value}
          subtitle={item.subtitle}
          icon={item.icon}
          tone={item.tone}
          animateValue={item.animateValue}
        />
      ))}
    </MotionStagger>
  );
}
