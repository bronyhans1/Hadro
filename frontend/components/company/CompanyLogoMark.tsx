"use client";

import { cn } from "@/lib/design-system/cn";

type Size = "sm" | "md" | "lg";

const sizeClass: Record<Size, string> = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-10 w-10 text-xs",
  lg: "h-14 w-14 text-sm",
};

type Props = {
  name: string;
  logoUrl?: string | null;
  initials?: string | null;
  size?: Size;
  className?: string;
};

function deriveInitials(name: string): string {
  const cleaned = name.trim().replace(/\s+/g, " ");
  if (!cleaned) return "?";
  const words = cleaned.split(" ").filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Tenant company mark — logo or initials placeholder.
 * Never used in Sidebar / Login / Marketing (HADRO stays platform brand).
 */
export function CompanyLogoMark({
  name,
  logoUrl,
  initials,
  size = "md",
  className,
}: Props) {
  const label = (initials?.trim() || deriveInitials(name)).slice(0, 2);

  if (logoUrl?.trim()) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl.trim()}
        alt={`${name} logo`}
        className={cn(
          "shrink-0 rounded-lg object-cover ring-1 ring-[color:var(--ds-color-border)]",
          sizeClass[size],
          className
        )}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg font-semibold",
        "bg-[var(--ds-color-primary-subtle)] text-[var(--ds-color-primary)]",
        "ring-1 ring-[color:var(--ds-color-border)]",
        sizeClass[size],
        className
      )}
      title={name}
    >
      {label}
    </span>
  );
}
