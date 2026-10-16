"use client";

import React from "react";
import { cn } from "@/lib/design-system/cn";
import { Toolbar } from "./Toolbar";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Canonical page header for management and workspace pages.
 * Use instead of MainContent title or ad-hoc h1 markup.
 */
export function PageHeader({ title, subtitle, actions, className, children }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="ds-h1 text-2xl">{title}</h1>
        {subtitle ? (
          <p
            className="ds-body-sm mt-1 max-w-2xl"
            style={{ color: "var(--ds-color-text-secondary)" }}
          >
            {subtitle}
          </p>
        ) : null}
        {children}
      </div>
      {actions ? (
        <Toolbar className="shrink-0" label={`${title} actions`} align="end">
          {actions}
        </Toolbar>
      ) : null}
    </header>
  );
}
