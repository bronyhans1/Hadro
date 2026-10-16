"use client";

import React from "react";

interface ReportsFilterSubsectionProps {
  title: string;
  children: React.ReactNode;
}

export function ReportsFilterSubsection({ title, children }: ReportsFilterSubsectionProps) {
  return (
    <div className="space-y-2">
      <p
        className="text-xs font-semibold uppercase tracking-wide"
        style={{ color: "var(--ds-color-text-muted)" }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}
