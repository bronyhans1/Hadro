"use client";

import {
  MarketingLayout,
  MarketingLinkButton,
  MarketingSection,
} from "@/components/marketing";
import { MARKETING_ROUTES } from "@/lib/marketing/siteConfig";
import { marketingText } from "@/lib/marketing/text";

/**
 * Marketing-styled 404 experience for public website visitors.
 */
export function MarketingNotFound() {
  return (
    <MarketingLayout>
      <MarketingSection container="narrow" tone="mist" reveal={false} className="pt-[clamp(4rem,10vw,7rem)]">
        <p className="mkt-eyebrow">{marketingText("notFound.eyebrow")}</p>
        <h1 className="mkt-display mt-4">{marketingText("notFound.title")}</h1>
        <p className="mkt-body-lg mt-5 max-w-xl">
          {marketingText("notFound.description")}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <MarketingLinkButton href={MARKETING_ROUTES.home} size="lg">
            {marketingText("cta.backToHome")}
          </MarketingLinkButton>
          <MarketingLinkButton href={MARKETING_ROUTES.solutions} variant="secondary" size="lg">
            {marketingText("cta.exploreSolutions")}
          </MarketingLinkButton>
          <MarketingLinkButton href={MARKETING_ROUTES.requestAccess} variant="secondary" size="lg">
            {marketingText("cta.requestAccess")}
          </MarketingLinkButton>
        </div>
      </MarketingSection>

      <MarketingSection container="narrow" reveal>
        <p className="mkt-caption">
          {marketingText("notFound.help")}{" "}
          <a href={MARKETING_ROUTES.support} className="font-medium text-[var(--mkt-royal)] underline-offset-2 hover:underline">
            {marketingText("cta.support")}
          </a>{" "}
          {marketingText("notFound.or")}{" "}
          <a href={MARKETING_ROUTES.contact} className="font-medium text-[var(--mkt-royal)] underline-offset-2 hover:underline">
            {marketingText("cta.contact")}
          </a>
          .
        </p>
      </MarketingSection>
    </MarketingLayout>
  );
}
