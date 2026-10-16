import { cn } from "@/lib/design-system/cn";

type Props = {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  elevated?: boolean;
  glass?: boolean;
};

export function MarketingCard({
  children,
  className,
  padding = true,
  elevated = false,
  glass = false,
}: Props) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--mkt-radius-xl)] border transition-shadow duration-[var(--mkt-duration)] ease-[var(--mkt-ease)]",
        glass
          ? "mkt-glass"
          : "border-[var(--mkt-border)] bg-[var(--mkt-surface)] shadow-[var(--mkt-shadow-soft)]",
        elevated && "hover:shadow-[var(--mkt-shadow-lift)]",
        padding && "p-6 sm:p-8",
        className
      )}
    >
      {children}
    </div>
  );
}
