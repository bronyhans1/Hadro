"use client";

import {
  DashboardMockup,
  MarketingCard,
  MarketingHero,
  MarketingLayout,
  MarketingLinkButton,
  MarketingSection,
  MarketingSectionHeader,
} from "@/components/marketing";
import { MARKETING_ROUTES } from "@/lib/marketing/siteConfig";
import { MARKETING_IMAGES } from "@/lib/marketing/assets";
import { WHY_PAGE } from "@/lib/marketing/stage4Content";
import { marketingText } from "@/lib/marketing/text";

export default function WhyHadroPage() {
  return (
    <MarketingLayout>
      <MarketingHero
        eyebrow={WHY_PAGE.eyebrow}
        title={WHY_PAGE.title}
        description={WHY_PAGE.description}
        primaryCta={{ href: MARKETING_ROUTES.requestAccess, label: marketingText("cta.requestAccess") }}
        secondaryCta={{ href: MARKETING_ROUTES.features, label: marketingText("cta.exploreFeatures") }}
        visual={
          <DashboardMockup title={marketingText("mockup.whyHero")} src={MARKETING_IMAGES.whyHero} />
        }
      />

      <MarketingSection id="pillars" tone="mist">
        <MarketingSectionHeader
          eyebrow={marketingText("why.differenceEyebrow")}
          title={marketingText("why.differenceTitle")}
        />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {WHY_PAGE.pillars.map((item) => (
            <MarketingCard key={item.title} elevated>
              <h3 className="text-sm font-semibold text-[var(--mkt-ink)]">{item.title}</h3>
              <p className="mkt-body mt-2 text-sm">{item.body}</p>
            </MarketingCard>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection id="problems">
        <MarketingSectionHeader
          eyebrow={marketingText("why.problemsEyebrow")}
          title={marketingText("why.problemsTitle")}
          description={marketingText("why.problemsDescription")}
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {WHY_PAGE.problems.map((item) => (
            <MarketingCard key={item.title}>
              <h3 className="text-sm font-semibold text-[var(--mkt-ink)]">{item.title}</h3>
              <p className="mkt-body mt-2 text-sm">{item.body}</p>
            </MarketingCard>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection id="differentiators" tone="mist">
        <MarketingSectionHeader
          eyebrow={marketingText("why.approachEyebrow")}
          title={marketingText("why.approachTitle")}
        />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {WHY_PAGE.differentiators.map((item) => (
            <MarketingCard key={item.title}>
              <h3 className="text-sm font-semibold text-[var(--mkt-royal)]">{item.title}</h3>
              <p className="mkt-body mt-2 text-sm">{item.body}</p>
            </MarketingCard>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <MarketingLinkButton href={MARKETING_ROUTES.solutions}>{marketingText("cta.viewSolutions")}</MarketingLinkButton>
          <MarketingLinkButton href={MARKETING_ROUTES.mobile} variant="secondary">
            {marketingText("cta.seeMobile")}
          </MarketingLinkButton>
        </div>
      </MarketingSection>

      <MarketingSection id="get-access" tone="navy">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mkt-eyebrow text-[var(--mkt-royal)]">{marketingText("cta.nextStep")}</p>
          <h2 className="mkt-h1 mt-3 text-white">{marketingText("why.ctaTitle")}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#A3A3A3]">
            {marketingText("why.ctaDescription")}
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
