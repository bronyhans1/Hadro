"use client";

import {
  MarketingCard,
  MarketingHero,
  MarketingLayout,
  MarketingLinkButton,
  MarketingMedia,
  MarketingSection,
  MarketingSectionHeader,
  PhoneMockup,
  StoreBadges,
} from "@/components/marketing";
import { MARKETING_IMAGES } from "@/lib/marketing/assets";
import { MARKETING_ROUTES } from "@/lib/marketing/siteConfig";
import { MOBILE_PAGE } from "@/lib/marketing/stage4Content";
import { marketingText } from "@/lib/marketing/text";

const HIGHLIGHT_IMAGES: Record<string, { src: string; imgClassName: string }> = {
  clock: {
    src: MARKETING_IMAGES.mobileAttendance,
    imgClassName: "object-[center_28%]",
  },
  gps: {
    src: MARKETING_IMAGES.mobileGps,
    imgClassName: "object-[center_26%]",
  },
  leave: {
    src: MARKETING_IMAGES.mobileLeave,
    imgClassName: "object-[center_24%]",
  },
  earnings: {
    src: MARKETING_IMAGES.mobileLiveEarnings,
    imgClassName: "object-[center_26%]",
  },
  notifications: {
    src: MARKETING_IMAGES.mobileNotifications,
    imgClassName: "object-[center_24%]",
  },
  history: {
    src: MARKETING_IMAGES.mobileHome,
    imgClassName: "object-[center_28%]",
  },
};

export default function MobilePage() {
  return (
    <MarketingLayout>
      <MarketingHero
        eyebrow={MOBILE_PAGE.eyebrow}
        title={MOBILE_PAGE.title}
        description={MOBILE_PAGE.description}
        actions={<StoreBadges />}
        visual={<PhoneMockup title={marketingText("mockup.employeeApp")} src={MARKETING_IMAGES.heroMobile} />}
      />

      <MarketingSection id="highlights" tone="mist">
        <MarketingSectionHeader
          eyebrow={marketingText("mobile.experienceEyebrow")}
          title={marketingText("mobile.experienceTitle")}
          description={marketingText("mobile.experienceDescription")}
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MOBILE_PAGE.highlights.map((item) => {
            const media = HIGHLIGHT_IMAGES[item.id];
            return (
              <MarketingCard key={item.id} elevated padding={false} className="overflow-hidden">
                <MarketingMedia
                  label={item.title}
                  src={media?.src ?? MARKETING_IMAGES.mobileHome}
                  aspect="video"
                  fit="contain"
                  className="rounded-none border-0 shadow-none"
                  imgClassName={media?.imgClassName ?? "object-[center_26%]"}
                />
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-[var(--mkt-ink)]">{item.title}</h3>
                  <p className="mkt-body mt-2 text-sm">{item.body}</p>
                </div>
              </MarketingCard>
            );
          })}
        </div>
      </MarketingSection>

      <MarketingSection id="ecosystem">
        <div className="grid items-center gap-8 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <MarketingSectionHeader
              eyebrow={marketingText("mobile.ecosystemEyebrow")}
              title={marketingText("mobile.ecosystemTitle")}
              description={marketingText("mobile.ecosystemDescription")}
              align="left"
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <MarketingLinkButton href={MARKETING_ROUTES.features}>{marketingText("cta.exploreFeatures")}</MarketingLinkButton>
              <MarketingLinkButton href={MARKETING_ROUTES.solutions} variant="secondary">
                {marketingText("cta.industrySolutions")}
              </MarketingLinkButton>
            </div>
          </div>
          <div className="lg:col-span-6">
            <PhoneMockup
              title={marketingText("mobile.employeesTitle")}
              src={MARKETING_IMAGES.mobileEmployees}
              className="mx-auto"
            />
          </div>
        </div>
      </MarketingSection>

      <MarketingSection id="download" tone="mist">
        <MarketingSectionHeader
          eyebrow={marketingText("mobile.downloadEyebrow")}
          title={marketingText("mobile.downloadTitle")}
          description={marketingText("mobile.downloadDescription")}
          align="center"
          className="mx-auto"
        />
        <div className="mt-8">
          <StoreBadges />
        </div>
      </MarketingSection>

      <MarketingSection id="get-access" tone="navy">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mkt-eyebrow text-[var(--mkt-royal)]">{marketingText("cta.nextStep")}</p>
          <h2 className="mkt-h1 mt-3 text-white">{marketingText("mobile.ctaTitle")}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#A3A3A3]">
            {marketingText("mobile.ctaDescription")}
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
