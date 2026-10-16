"use client";

import React from "react";
import { m, useReducedMotion } from "motion/react";
import { cn } from "@/lib/design-system/cn";
import { fadeUp, motionVariants } from "@/lib/motion";

export interface PageSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  id?: string;
  className?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

/**
 * Canonical section block used across dashboard, payroll, leave, reports, and settings.
 */
export function PageSection({
  title,
  description,
  children,
  id,
  className,
  icon,
  action,
}: PageSectionProps) {
  const reduced = useReducedMotion();
  const headingId =
    id ?? `page-section-${title.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}`;

  return (
    <m.section
      className={cn("space-y-4", className)}
      aria-labelledby={headingId}
      variants={motionVariants(reduced, fadeUp)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.05 }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            id={headingId}
            className="ds-h2 flex items-center gap-2 text-base font-semibold"
            style={{ color: "var(--ds-color-text-primary)" }}
          >
            {icon ? (
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(37, 99, 235, 0.12), rgba(37, 99, 235, 0.06))",
                  color: "var(--ds-color-primary)",
                }}
                aria-hidden
              >
                {icon}
              </span>
            ) : null}
            {title}
          </h2>
          {description ? (
            <p className="ds-caption mt-1" style={{ color: "var(--ds-color-text-muted)" }}>
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </m.section>
  );
}
