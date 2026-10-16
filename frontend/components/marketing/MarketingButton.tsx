import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/design-system/cn";

export type MarketingButtonVariant = "primary" | "secondary" | "ghost" | "link";
export type MarketingButtonSize = "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: MarketingButtonVariant;
  size?: MarketingButtonSize;
};

const variants: Record<MarketingButtonVariant, string> = {
  primary:
    "border-transparent bg-[var(--mkt-royal)] text-[#1C1C1C] hover:bg-[var(--mkt-royal-hover)] active:bg-[#b87a00]",
  secondary:
    "border-[var(--mkt-border-strong)] bg-[var(--mkt-surface)] text-[var(--mkt-ink)] hover:border-[var(--mkt-royal)] hover:bg-[var(--mkt-sky)]",
  ghost:
    "border-transparent bg-transparent text-[var(--mkt-ink)] hover:bg-[var(--mkt-sky)]",
  link:
    "h-auto border-transparent bg-transparent px-0 text-[var(--mkt-royal)] underline-offset-4 hover:underline",
};

const sizes: Record<MarketingButtonSize, string> = {
  md: "h-11 px-4 text-sm",
  lg: "h-[46px] px-6 text-sm",
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mkt-focus-ring)]";

export function MarketingButton({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[12px] border font-semibold tracking-[-0.01em] transition-[background-color,border-color,box-shadow,transform,opacity]",
        "duration-[var(--mkt-duration-fast)] ease-[var(--mkt-ease)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variant !== "link" && "active:translate-y-px",
        variant !== "link" && sizes[size],
        variants[variant],
        focusRing,
        className
      )}
      {...props}
    />
  );
}
