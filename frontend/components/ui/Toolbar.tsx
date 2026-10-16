import React from "react";
import { cn } from "@/lib/design-system/cn";
import { translate } from "@/lib/i18n";

interface ToolbarProps {
  children: React.ReactNode;
  className?: string;
  label?: string;
  align?: "start" | "between" | "end";
}

const alignment = {
  start: "justify-start",
  between: "justify-between",
  end: "justify-end",
};

/** Canonical wrapping action row for management and report pages. */
export function Toolbar({
  children,
  className,
  label = translate("common.pageActions"),
  align = "between",
}: ToolbarProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-2",
        alignment[align],
        className
      )}
      role="toolbar"
      aria-label={label}
    >
      {children}
    </div>
  );
}
