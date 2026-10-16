"use client";

import {
  IndustryCard,
  MarketingCard,
  MarketingHero,
  MarketingLayout,
  MarketingLinkButton,
  MarketingMedia,
  MarketingSection,
  MarketingSectionHeader,
} from "@/components/marketing";
import { MARKETING_IMAGES } from "@/lib/marketing/assets";
import { LANDING_INDUSTRIES, MARKETING_ROUTES } from "@/lib/marketing/siteConfig";
import { SOLUTIONS_HUB } from "@/lib/marketing/solutionsContent";
import { marketingText } from "@/lib/marketing/text";

const HUB_PILLARS = [
  {
    get title() { return marketingText("solutions.pillarChallenges"); },
    get body() { return marketingText("solutions.pillarChallengesBody"); },
  },
  {
    get title() { return marketingText("solutions.pillarResponse"); },
    get body() { return marketingText("solutions.pillarResponseBody"); },
  },
  {
    get title() { return marketingText("solutions.pillarNext"); },
    get body() { return marketingText("solutions.pillarNextBody"); },
  },
];

/**
 * Stage 3 — Solutions hub. Links to industry-specific solution pages.
 */
export default function SolutionsPage() {
  return (
    <MarketingLayout>
      <MarketingHero
        eyebrow={SOLUTIONS_HUB.eyebrow}
        title={SOLUTIONS_HUB.title}
        description={SOLUTIONS_HUB.description}
        primaryCta={{ href: MARKETING_ROUTES.requestAccess, label: marketingText("cta.requestAccess") }}
        secondaryCta={{ href: MARKETING_ROUTES.home, label: marketingText("cta.backToHome") }}
        visual={
          <MarketingMedia
            label={marketingText("mockup.industrySolutions")}
            src={MARKETING_IMAGES.solutionsHero}
            aspect="wide"
          />
        }
      />

      <MarketingSection id="industries" tone="mist">
        <MarketingSectionHeader
          eyebrow={marketingText("solutions.industriesEyebrow")}
          title={marketingText("solutions.industriesTitle")}
          description={marketingText("solutions.industriesDescription")}
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {LANDING_INDUSTRIES.map((item) => (
            <IndustryCard key={item.id} id={item.id} label={item.label} />
          ))}
        </div>
      </MarketingSection>

      <MarketingSection id="approach">
        <MarketingSectionHeader
          eyebrow={marketingText("solutions.approachEyebrow")}
          title={marketingText("solutions.approachTitle")}
          description={marketingText("solutions.approachDescription")}
        />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {HUB_PILLARS.map((item) => (
            <MarketingCard key={item.title} elevated>
              <h3 className="text-sm font-semibold text-[var(--mkt-ink)]">{item.title}</h3>
              <p className="mkt-body mt-2 text-sm">{item.body}</p>
            </MarketingCard>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection id="get-access" tone="navy">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mkt-eyebrow text-[var(--mkt-royal)]">{marketingText("cta.nextStep")}</p>
          <h2 className="mkt-h1 mt-3 text-white">{marketingText("solutions.ctaTitle")}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#A3A3A3]">
            {marketingText("solutions.ctaDescription")}
          </p>
          <div className="mt-8">
            <MarketingLinkButton href={MARKETING_ROUTES.requestAccess} size="lg">
              {marketingText("cta.requestAccess")}
            </MarketingLinkButton>
          </div>
        </div>
      </MarketingSection>
    </MarketingLayout>
  );
}
