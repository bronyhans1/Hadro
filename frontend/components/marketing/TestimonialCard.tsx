import { cn } from "@/lib/design-system/cn";
import { marketingText } from "@/lib/marketing/text";
import { MarketingCard } from "./MarketingCard";

type Props = {
  quote: string;
  name: string;
  role: string;
  organization?: string;
  /** Company logo / photo from MARKETING_IMAGES (optional). */
  logoSrc?: string;
  className?: string;
};

export function TestimonialCard({
  quote,
  name,
  role,
  organization,
  logoSrc,
  className,
}: Props) {
  return (
    <MarketingCard elevated className={cn("h-full", className)}>
      {logoSrc ? (
        <div className="mb-6 h-10 w-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt={
              organization
                ? marketingText("mockup.organizationLogo", { values: { organization } })
                : marketingText("mockup.companyLogo")
            }
            className="h-10 w-auto max-w-[160px] object-contain object-left"
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : null}
      <p className="text-lg font-medium leading-relaxed text-[var(--mkt-ink)]">“{quote}”</p>
      <div className="mt-8 border-t border-[var(--mkt-border)] pt-5">
        <p className="text-sm font-semibold text-[var(--mkt-ink)]">{name}</p>
        <p className="mkt-caption mt-1">
          {role}
          {organization ? ` · ${organization}` : ""}
        </p>
      </div>
    </MarketingCard>
  );
}
