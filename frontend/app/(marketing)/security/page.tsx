"use client";

import {
  MarketingCard,
  MarketingHero,
  MarketingLayout,
  MarketingLinkButton,
  MarketingMedia,
  MarketingSection,
  MarketingSectionHeader,
} from "@/components/marketing";
import { MARKETING_IMAGES } from "@/lib/marketing/assets";
import { MARKETING_ROUTES } from "@/lib/marketing/siteConfig";
import { SECURITY_PAGE } from "@/lib/marketing/stage4Content";
import { marketingText } from "@/lib/marketing/text";

const PILLAR_IMAGES = [
  MARKETING_IMAGES.securityRbac,
  MARKETING_IMAGES.securityAuth,
  MARKETING_IMAGES.securityAudit,
  MARKETING_IMAGES.securityOverview,
] as const;

export default function SecurityPage() {
  return (
    <MarketingLayout>
      <MarketingHero
        eyebrow={SECURITY_PAGE.eyebrow}
        title={SECURITY_PAGE.title}
        description={SECURITY_PAGE.description}
        primaryCta={{ href: MARKETING_ROUTES.requestAccess, label: marketingText("cta.requestAccess") }}
        secondaryCta={{ href: MARKETING_ROUTES.contact, label: marketingText("cta.contactUs") }}
        visual={
          <MarketingMedia
            label={marketingText("mockup.securityOverview")}
            src={MARKETING_IMAGES.securityHero}
            aspect="wide"
          />
        }
      />

      <MarketingSection id="pillars" tone="mist">
        <MarketingSectionHeader
          eyebrow={marketingText("security.pillarsEyebrow")}
          title={marketingText("security.pillarsTitle")}
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SECURITY_PAGE.pillars.map((item, index) => (
            <MarketingCard key={item.title} elevated padding={false} className="overflow-hidden">
              <MarketingMedia
                label={item.title}
                src={PILLAR_IMAGES[index] ?? MARKETING_IMAGES.securityOverview}
                aspect="video"
                className="rounded-none border-0 shadow-none"
              />
              <div className="p-6">
                <h3 className="text-sm font-semibold text-[var(--mkt-ink)]">{item.title}</h3>
                <p className="mkt-body mt-2 text-sm">{item.body}</p>
              </div>
            </MarketingCard>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection id="practices">
        <MarketingSectionHeader
          eyebrow={marketingText("security.practicesEyebrow")}
          title={marketingText("security.practicesTitle")}
          description={marketingText("security.practicesDescription")}
        />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {SECURITY_PAGE.practices.map((item) => (
            <MarketingCard key={item.title} elevated>
              <h3 className="text-sm font-semibold text-[var(--mkt-royal)]">{item.title}</h3>
              <p className="mkt-body mt-2 text-sm">{item.body}</p>
            </MarketingCard>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection id="get-access" tone="navy">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mkt-eyebrow text-[var(--mkt-royal)]">{marketingText("cta.nextStep")}</p>
          <h2 className="mkt-h1 mt-3 text-white">{marketingText("security.ctaTitle")}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#A3A3A3]">
            {marketingText("security.ctaDescription")}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <MarketingLinkButton href={MARKETING_ROUTES.requestAccess} size="lg">
              {marketingText("cta.requestAccess")}
            </MarketingLinkButton>
            <MarketingLinkButton
              href={MARKETING_ROUTES.contact}
              variant="secondary"
              size="lg"
              className="border-white/20 bg-white/10 text-white hover:bg-white/15"
            >
              {marketingText("cta.contact")}
            </MarketingLinkButton>
          </div>
        </div>
      </MarketingSection>
    </MarketingLayout>
  );
}
