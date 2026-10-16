"use client";

import {
  FaqAccordion,
  MarketingCard,
  MarketingHero,
  MarketingLayout,
  MarketingLinkButton,
  MarketingSection,
  MarketingSectionHeader,
} from "@/components/marketing";
import { MARKETING, MARKETING_ROUTES } from "@/lib/marketing/siteConfig";
import { SUPPORT_PAGE } from "@/lib/marketing/stage4Content";
import { marketingText } from "@/lib/marketing/text";

export default function SupportPage() {
  return (
    <MarketingLayout>
      <MarketingHero
        eyebrow={SUPPORT_PAGE.eyebrow}
        title={SUPPORT_PAGE.title}
        description={SUPPORT_PAGE.description}
        primaryCta={{ href: `mailto:${SUPPORT_PAGE.email}`, label: marketingText("cta.emailSupport") }}
        secondaryCta={{ href: MARKETING_ROUTES.requestAccess, label: marketingText("cta.requestAccess") }}
      />

      <MarketingSection id="help" tone="mist">
        <MarketingSectionHeader
          eyebrow={marketingText("support.quickEyebrow")}
          title={marketingText("support.quickTitle")}
        />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <MarketingCard elevated className="flex h-full flex-col">
            <h3 className="text-sm font-semibold text-[var(--mkt-ink)]">{marketingText("support.onboardingTitle")}</h3>
            <p className="mkt-body mt-2 flex-1 text-sm">
              {marketingText("support.onboardingBody")}
            </p>
            <div className="mt-6">
              <MarketingLinkButton href={MARKETING_ROUTES.requestAccess} variant="secondary">
                {marketingText("cta.requestAccess")}
              </MarketingLinkButton>
            </div>
          </MarketingCard>
          <MarketingCard elevated className="flex h-full flex-col">
            <h3 className="text-sm font-semibold text-[var(--mkt-ink)]">{marketingText("support.productTitle")}</h3>
            <p className="mkt-body mt-2 flex-1 text-sm">
              {marketingText("support.productBody")}
            </p>
            <div className="mt-6">
              <MarketingLinkButton href={MARKETING_ROUTES.features} variant="secondary">
                {marketingText("cta.browseFeatures")}
              </MarketingLinkButton>
            </div>
          </MarketingCard>
          <MarketingCard elevated className="flex h-full flex-col">
            <h3 className="text-sm font-semibold text-[var(--mkt-ink)]">{marketingText("support.emailTitle")}</h3>
            <p className="mkt-body mt-2 flex-1 text-sm">
              {marketingText("support.emailBody", { values: { email: SUPPORT_PAGE.email } })}
            </p>
            <div className="mt-6">
              <MarketingLinkButton href={`mailto:${SUPPORT_PAGE.email}`} variant="secondary" external>
                {SUPPORT_PAGE.email}
              </MarketingLinkButton>
            </div>
          </MarketingCard>
        </div>
      </MarketingSection>

      <MarketingSection id="faq" container="narrow">
        <MarketingSectionHeader eyebrow={marketingText("support.faqEyebrow")} title={marketingText("support.faqTitle")} />
        <div className="mt-8">
          <FaqAccordion items={[...SUPPORT_PAGE.faqs]} />
        </div>
      </MarketingSection>

      <MarketingSection id="legal" tone="mist">
        <MarketingSectionHeader
          eyebrow={marketingText("support.legalEyebrow")}
          title={marketingText("support.legalTitle")}
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <MarketingLinkButton href={MARKETING.legal.privacy} variant="secondary">
            {marketingText("footer.privacy")}
          </MarketingLinkButton>
          <MarketingLinkButton href={MARKETING.legal.terms} variant="secondary">
            {marketingText("footer.terms")}
          </MarketingLinkButton>
          <MarketingLinkButton href={MARKETING_ROUTES.contact} variant="secondary">
            {marketingText("cta.contact")}
          </MarketingLinkButton>
        </div>
      </MarketingSection>
    </MarketingLayout>
  );
}
