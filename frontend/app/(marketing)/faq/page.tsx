"use client";

import {
  FaqAccordion,
  MarketingHero,
  MarketingLayout,
  MarketingLinkButton,
  MarketingMedia,
  MarketingSection,
  MarketingSectionHeader,
} from "@/components/marketing";
import { MARKETING_IMAGES } from "@/lib/marketing/assets";
import { MARKETING_ROUTES } from "@/lib/marketing/siteConfig";
import { FAQ_CATEGORIES, FAQ_PAGE } from "@/lib/marketing/faqContent";
import { marketingText } from "@/lib/marketing/text";

export default function FaqPage() {
  return (
    <MarketingLayout>
      <MarketingHero
        eyebrow={FAQ_PAGE.eyebrow}
        title={FAQ_PAGE.title}
        description={FAQ_PAGE.description}
        primaryCta={{ href: MARKETING_ROUTES.requestAccess, label: marketingText("cta.requestAccess") }}
        secondaryCta={{ href: MARKETING_ROUTES.contact, label: marketingText("cta.contact") }}
        visual={
          <MarketingMedia
            label={marketingText("mockup.faqs")}
            src={MARKETING_IMAGES.faqHero}
            aspect="wide"
            fit="contain"
            imgClassName="object-center"
          />
        }
      />

      {FAQ_CATEGORIES.map((category, index) => (
        <MarketingSection
          key={category.id}
          id={category.id}
          tone={index % 2 === 0 ? "mist" : "default"}
          container="narrow"
        >
          <MarketingSectionHeader
            eyebrow={marketingText("faq.eyebrow")}
            title={category.title}
            description={category.description}
            align="left"
          />
          <div className="mt-8">
            <FaqAccordion items={category.items} />
          </div>
        </MarketingSection>
      ))}

      <MarketingSection id="get-access" tone="navy">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mkt-eyebrow text-[var(--mkt-royal)]">{marketingText("faq.stillExploring")}</p>
          <h2 className="mkt-h1 mt-3 text-white">{marketingText("faq.ctaTitle")}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#A3A3A3]">
            {marketingText("faq.ctaDescription")}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <MarketingLinkButton href={MARKETING_ROUTES.requestAccess} size="lg">
              {marketingText("cta.requestAccess")}
            </MarketingLinkButton>
            <MarketingLinkButton
              href={MARKETING_ROUTES.support}
              variant="secondary"
              size="lg"
              className="border-white/20 bg-white/10 text-white hover:bg-white/15"
            >
              {marketingText("cta.visitSupport")}
            </MarketingLinkButton>
          </div>
        </div>
      </MarketingSection>
    </MarketingLayout>
  );
}
