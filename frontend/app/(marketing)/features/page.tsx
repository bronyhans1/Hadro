"use client";

import {
  DashboardMockup,
  MarketingCard,
  MarketingHero,
  MarketingLayout,
  MarketingLinkButton,
  MarketingMedia,
  MarketingSection,
  MarketingSectionHeader,
  ShowcaseBlock,
} from "@/components/marketing";
import {
  coreFeatureImage,
  MARKETING_IMAGES,
  signatureCapabilityImage,
} from "@/lib/marketing/assets";
import { MARKETING_ROUTES } from "@/lib/marketing/siteConfig";
import { FEATURES_PAGE } from "@/lib/marketing/stage4Content";
import { marketingText } from "@/lib/marketing/text";

export default function FeaturesPage() {
  return (
    <MarketingLayout>
      <MarketingHero
        eyebrow={FEATURES_PAGE.eyebrow}
        title={FEATURES_PAGE.title}
        description={FEATURES_PAGE.description}
        primaryCta={{ href: MARKETING_ROUTES.requestAccess, label: marketingText("cta.requestAccess") }}
        secondaryCta={{ href: MARKETING_ROUTES.why, label: marketingText("cta.whyHadro") }}
        visual={
          <DashboardMockup
            title={marketingText("mockup.featureOverview")}
            src={MARKETING_IMAGES.featuresOverview}
          />
        }
      />

      <MarketingSection id="core" tone="mist">
        <MarketingSectionHeader
          eyebrow={marketingText("features.coreEyebrow")}
          title={marketingText("features.coreTitle")}
          description={marketingText("features.coreDescription")}
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {FEATURES_PAGE.core.map((item) => (
            <MarketingCard key={item.title} elevated padding={false} className="overflow-hidden">
              <MarketingMedia
                label={item.title}
                src={coreFeatureImage(item.screenshotKey)}
                aspect="video"
                className="rounded-none border-0 shadow-none"
              />
              <div className="p-6 sm:p-8">
                <h3 className="text-sm font-semibold text-[var(--mkt-ink)]">{item.title}</h3>
                <p className="mkt-body mt-2 text-sm">{item.body}</p>
              </div>
            </MarketingCard>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection id="signature">
        <MarketingSectionHeader
          eyebrow={marketingText("features.signatureEyebrow")}
          title={marketingText("features.signatureTitle")}
          description={marketingText("features.signatureDescription")}
        />
        <div className="mt-8 space-y-12">
          {FEATURES_PAGE.signature.map((item, index) => (
            <ShowcaseBlock
              key={item.id}
              title={item.title}
              problem={item.problem}
              solution={item.solution}
              benefit={item.benefit}
              visualLabel={item.title}
              visualSrc={signatureCapabilityImage(item.id)}
              reverse={index % 2 === 1}
            />
          ))}
        </div>
      </MarketingSection>

      <MarketingSection id="explore" tone="mist">
        <MarketingSectionHeader
          eyebrow={marketingText("features.contextEyebrow")}
          title={marketingText("features.contextTitle")}
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <MarketingLinkButton href={MARKETING_ROUTES.solutions}>{marketingText("cta.industrySolutions")}</MarketingLinkButton>
          <MarketingLinkButton href={MARKETING_ROUTES.mobile} variant="secondary">
            {marketingText("cta.mobileApp")}
          </MarketingLinkButton>
          <MarketingLinkButton href={MARKETING_ROUTES.security} variant="secondary">
            {marketingText("nav.security")}
          </MarketingLinkButton>
        </div>
      </MarketingSection>

      <MarketingSection id="get-access" tone="navy">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mkt-eyebrow text-[var(--mkt-royal)]">{marketingText("cta.nextStep")}</p>
          <h2 className="mkt-h1 mt-3 text-white">{marketingText("features.ctaTitle")}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#A3A3A3]">
            {marketingText("features.ctaDescription")}
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
