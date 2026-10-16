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
import { industryImage } from "@/lib/marketing/assets";
import {
  LANDING_INDUSTRIES,
  MARKETING_ROUTES,
} from "@/lib/marketing/siteConfig";
import {
  getIndustrySolution,
  type IndustrySolution,
  resolveRecommendedFeatures,
} from "@/lib/marketing/solutionsContent";
import { marketingText } from "@/lib/marketing/text";

type Props = {
  solution: IndustrySolution;
};

/**
 * Shared industry solution page shell — challenges, solutions, recommended features, benefits, CTA.
 */
export function SolutionIndustryPage({ solution }: Props) {
  // Re-read catalog getters on the client. The server serializes them as English
  // before the visitor's locale is known.
  const localized = getIndustrySolution(solution.id) ?? solution;
  const recommendedFeatures = resolveRecommendedFeatures(localized);
  const related = LANDING_INDUSTRIES.filter((item) => item.id !== localized.id).slice(0, 5);

  return (
    <MarketingLayout>
      <MarketingHero
        eyebrow={marketingText("solutions.solutionEyebrow", { values: { label: localized.label } })}
        title={localized.headline}
        description={localized.description}
        primaryCta={{ href: MARKETING_ROUTES.requestAccess, label: marketingText("cta.requestAccess") }}
        secondaryCta={{ href: MARKETING_ROUTES.solutions, label: marketingText("solutions.allSolutions") }}
        visual={
          <MarketingMedia
            label={marketingText("mockup.industryWorkforce", { values: { label: localized.label } })}
            src={industryImage(solution.id)}
            aspect="wide"
          />
        }
      />

      <MarketingSection id="challenges" tone="mist">
        <MarketingSectionHeader
          eyebrow={marketingText("solutions.challengesEyebrow")}
          title={marketingText("solutions.struggleTitle", { values: { label: localized.label.toLowerCase() } })}
          description={marketingText("solutions.challengesDescription")}
        />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {localized.challenges.map((item) => (
            <MarketingCard key={item.title}>
              <h3 className="text-sm font-semibold text-[var(--mkt-ink)]">{item.title}</h3>
              <p className="mkt-body mt-2 text-sm">{item.body}</p>
            </MarketingCard>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection id="how-we-help">
        <MarketingSectionHeader
          eyebrow={marketingText("solutions.howEyebrow")}
          title={marketingText("solutions.howTitle")}
          description={marketingText("solutions.howDescription")}
        />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {localized.solutions.map((item) => (
            <MarketingCard key={item.title} elevated>
              <h3 className="text-sm font-semibold text-[var(--mkt-ink)]">{item.title}</h3>
              <p className="mkt-body mt-2 text-sm">{item.body}</p>
            </MarketingCard>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection id="recommended-features" tone="mist">
        <MarketingSectionHeader
          eyebrow={marketingText("solutions.recommendedEyebrow")}
          title={marketingText("solutions.capabilitiesTitle", { values: { label: localized.label.toLowerCase() } })}
          description={marketingText("solutions.recommendedDescription")}
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recommendedFeatures.map((item) => (
            <MarketingCard key={item.id}>
              <h3 className="text-sm font-semibold text-[var(--mkt-ink)]">{item.title}</h3>
              <p className="mkt-body mt-2 text-sm">{item.body}</p>
            </MarketingCard>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection id="benefits">
        <MarketingSectionHeader
          eyebrow={marketingText("solutions.benefitsEyebrow")}
          title={marketingText("solutions.benefitsTitle")}
          description={marketingText("solutions.benefitsDescription")}
        />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {localized.benefits.map((item) => (
            <MarketingCard key={item.title} elevated>
              <h3 className="text-sm font-semibold text-[var(--mkt-royal)]">{item.title}</h3>
              <p className="mkt-body mt-2 text-sm">{item.body}</p>
            </MarketingCard>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection id="related" tone="mist">
        <MarketingSectionHeader
          eyebrow={marketingText("solutions.moreEyebrow")}
          title={marketingText("solutions.relatedTitle")}
          align="left"
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {related.map((item) => (
            <IndustryCard key={item.id} id={item.id} label={item.label} />
          ))}
        </div>
        <div className="mt-8">
          <MarketingLinkButton href={MARKETING_ROUTES.solutions} variant="secondary">
            {marketingText("solutions.viewAll")}
          </MarketingLinkButton>
        </div>
      </MarketingSection>

      <MarketingSection id="get-access" tone="navy">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mkt-eyebrow text-[var(--mkt-royal)]">{marketingText("cta.nextStep")}</p>
          <h2 className="mkt-h1 mt-3 text-white">{localized.ctaTitle}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#A3A3A3]">
            {localized.ctaDescription}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <MarketingLinkButton href={MARKETING_ROUTES.requestAccess} size="lg">
              {marketingText("cta.requestAccess")}
            </MarketingLinkButton>
            <MarketingLinkButton
              href={MARKETING_ROUTES.home}
              variant="secondary"
              size="lg"
              className="border-white/20 bg-white/10 text-white hover:bg-white/15"
            >
              {marketingText("cta.backToHome")}
            </MarketingLinkButton>
          </div>
        </div>
      </MarketingSection>
    </MarketingLayout>
  );
}
