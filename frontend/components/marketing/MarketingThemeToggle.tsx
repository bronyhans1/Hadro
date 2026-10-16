"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useMarketingThemeSync } from "@/lib/marketing/useMarketingThemeSync";
import { marketingText } from "@/lib/marketing/text";
import { cn } from "@/lib/design-system/cn";

type Props = {
  className?: string;
};

/**
 * Compact theme control for marketing nav.
 * Cycles System → Light → Dark → System.
 * Icon reflects preference (not only resolved appearance) so Dark→System
 * is never a silent no-op when the OS is already dark.
 */
export function MarketingThemeToggle({ className }: Props) {
  const { preference, resolvedDark, ready, cycleTheme, label } = useMarketingThemeSync();

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-[var(--mkt-radius-md)] border border-[var(--mkt-border)] bg-[var(--mkt-surface)] text-[var(--mkt-ink)] shadow-[var(--mkt-shadow-soft)] transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--mkt-duration-fast)] ease-[var(--mkt-ease)]",
        "hover:border-[var(--mkt-royal)]/25 hover:bg-[var(--mkt-sky)]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mkt-focus-ring)]",
        "disabled:opacity-60",
        className
      )}
      aria-label={marketingText("theme.button", { values: { label } })}
      title={marketingText("theme.title", { values: { label } })}
      disabled={!ready}
    >
      <span className="sr-only">
        {marketingText("theme.current", {
          values: { label, resolved: resolvedDark ? marketingText("theme.dark") : marketingText("theme.light") },
        })}
      </span>
      {preference === "system" ? (
        <Monitor className="h-4 w-4" aria-hidden strokeWidth={1.75} />
      ) : preference === "dark" ? (
        <Moon className="h-4 w-4" aria-hidden strokeWidth={1.75} />
      ) : (
        <Sun className="h-4 w-4" aria-hidden strokeWidth={1.75} />
      )}
    </button>
  );
}
