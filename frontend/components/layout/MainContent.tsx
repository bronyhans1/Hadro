import React from "react";
import { cn } from "@/lib/design-system/cn";

interface MainContentProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  /** Optional actions rendered to the right of the page title (e.g. primary CTA). */
  actions?: React.ReactNode;
  className?: string;
}

export function MainContent({
  children,
  title,
  subtitle,
  actions,
  className = "",
}: MainContentProps) {
  return (
    <main
      className={cn("app-main-content min-h-screen pt-[var(--header-height)]", className)}
      style={{ marginLeft: "var(--sidebar-width)" }}
    >
      <div className="app-main-inner" style={{ background: "var(--app-bg)", color: "var(--text-primary)" }}>
        {title ? (
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="ds-h1">{title}</h1>
              {subtitle ? (
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {subtitle}
                </p>
              ) : null}
            </div>
            {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
          </div>
        ) : null}
        {children}
      </div>
    </main>
  );
}
