import { cn } from "@/lib/design-system/cn";
import { MarketingLinkButton } from "./MarketingLinkButton";

type Props = {
  eyebrow?: string;
  title: string;
  description: string;
  primaryCta?: { href: string; label: string; external?: boolean };
  secondaryCta?: { href: string; label: string; external?: boolean };
  /** Optional custom actions (e.g. store badges) — replaces primary/secondary when set. */
  actions?: React.ReactNode;
  visual?: React.ReactNode;
  className?: string;
};

/**
 * Production-quality hero shell. Placeholder visuals are OK; layout quality is not optional.
 */
export function MarketingHero({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
  actions,
  visual,
  className,
}: Props) {
  return (
    <section className={cn("mkt-section mkt-section--hero mkt-hero", className)}>
      <div className="mkt-container grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="min-w-0 lg:col-span-6">
          {eyebrow ? <p className="mkt-eyebrow">{eyebrow}</p> : null}
          <h1 className={cn("mkt-display", eyebrow && "mt-3")}>{title}</h1>
          <p className="mkt-body-lg mt-4 max-w-xl">{description}</p>
          {actions ? (
            <div className="mt-7">{actions}</div>
          ) : primaryCta || secondaryCta ? (
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {primaryCta ? (
                <MarketingLinkButton href={primaryCta.href} size="lg" external={primaryCta.external}>
                  {primaryCta.label}
                </MarketingLinkButton>
              ) : null}
              {secondaryCta ? (
                <MarketingLinkButton
                  href={secondaryCta.href}
                  variant="secondary"
                  size="lg"
                  external={secondaryCta.external}
                >
                  {secondaryCta.label}
                </MarketingLinkButton>
              ) : null}
            </div>
          ) : null}
        </div>
        {visual ? (
          <div className="mkt-hero-visual min-w-0 lg:col-span-6">{visual}</div>
        ) : null}
      </div>
    </section>
  );
}
