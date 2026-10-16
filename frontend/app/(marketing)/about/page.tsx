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
import { ABOUT_PAGE } from "@/lib/marketing/stage4Content";
import { marketingText } from "@/lib/marketing/text";

export default function AboutPage() {
  return (
    <MarketingLayout>
      <MarketingHero
        eyebrow={ABOUT_PAGE.eyebrow}
        title={ABOUT_PAGE.title}
        description={ABOUT_PAGE.description}
        primaryCta={{ href: MARKETING_ROUTES.requestAccess, label: marketingText("cta.requestAccess") }}
        secondaryCta={{ href: MARKETING_ROUTES.contact, label: marketingText("cta.contact") }}
        visual={
          <MarketingMedia label={marketingText("mockup.team")} src={MARKETING_IMAGES.aboutTeam} aspect="wide" />
        }
      />

      <MarketingSection id="mission" tone="mist">
        <div className="grid items-center gap-8 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <MarketingSectionHeader eyebrow={marketingText("about.missionEyebrow")} title={marketingText("about.missionTitle")} />
            <p className="mkt-body-lg mt-5 max-w-3xl">{ABOUT_PAGE.mission}</p>
          </div>
          <div className="lg:col-span-6">
            <MarketingMedia
              label={marketingText("mockup.mission")}
              src={MARKETING_IMAGES.aboutMission}
              aspect="wide"
            />
          </div>
        </div>
      </MarketingSection>

      <MarketingSection id="beliefs">
        <MarketingSectionHeader
          eyebrow={marketingText("about.beliefsEyebrow")}
          title={marketingText("about.beliefsTitle")}
        />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {ABOUT_PAGE.beliefs.map((item) => (
            <MarketingCard key={item.title} elevated>
              <h3 className="text-sm font-semibold text-[var(--mkt-ink)]">{item.title}</h3>
              <p className="mkt-body mt-2 text-sm">{item.body}</p>
            </MarketingCard>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection id="explore" tone="mist">
        <MarketingSectionHeader
          eyebrow={marketingText("about.learnEyebrow")}
          title={marketingText("about.learnTitle")}
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <MarketingLinkButton href={MARKETING_ROUTES.why}>{marketingText("cta.whyHadro")}</MarketingLinkButton>
          <MarketingLinkButton href={MARKETING_ROUTES.solutions} variant="secondary">
            {marketingText("nav.solutions")}
          </MarketingLinkButton>
          <MarketingLinkButton href={MARKETING_ROUTES.security} variant="secondary">
            {marketingText("nav.security")}
          </MarketingLinkButton>
        </div>
      </MarketingSection>

      <MarketingSection id="get-access" tone="navy">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mkt-eyebrow text-[var(--mkt-royal)]">{marketingText("cta.nextStep")}</p>
          <h2 className="mkt-h1 mt-3 text-white">{marketingText("about.ctaTitle")}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#A3A3A3]">
            {marketingText("about.ctaDescription")}
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
