import Link from "next/link";
import { cn } from "@/lib/design-system/cn";

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "link";
  size?: "md" | "lg";
  className?: string;
  external?: boolean;
  "aria-current"?: "page" | "step" | "location" | "date" | "time" | "true" | "false" | boolean;
};

const variants = {
  primary:
    "border-transparent bg-[var(--mkt-royal)] text-[#1C1C1C] hover:bg-[var(--mkt-royal-hover)] active:bg-[#b87a00]",
  secondary:
    "border-[var(--mkt-border-strong)] bg-[var(--mkt-surface)] text-[var(--mkt-ink)] hover:border-[var(--mkt-royal)] hover:bg-[var(--mkt-sky)]",
  ghost: "border-transparent bg-transparent text-[var(--mkt-ink)] hover:bg-[var(--mkt-sky)]",
  link: "h-auto border-transparent bg-transparent px-0 text-[var(--mkt-royal)] underline-offset-4 hover:underline",
} as const;

const sizes = {
  md: "h-11 px-4 text-sm",
  lg: "h-[46px] px-6 text-sm",
} as const;

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mkt-focus-ring)]";

export function MarketingLinkButton({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
  external,
  "aria-current": ariaCurrent,
}: Props) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-[12px] border font-semibold tracking-[-0.01em] transition-[background-color,border-color,box-shadow,transform,opacity]",
    "duration-[var(--mkt-duration-fast)] ease-[var(--mkt-ease)]",
    variant !== "link" && "active:translate-y-px",
    variant !== "link" && sizes[size],
    variants[variant],
    focusRing,
    className
  );

  if (external || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        className={classes}
        aria-current={ariaCurrent}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} aria-current={ariaCurrent}>
      {children}
    </Link>
  );
}
