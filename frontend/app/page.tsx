"use client";

import type { LucideIcon } from "lucide-react";
import { MapPinned, UserCheck, Wallet } from "lucide-react";
import {
  BusinessProblemsVisual,
  DashboardMockup,
  DEFAULT_MARKETING_METRICS,
  DEFAULT_PRODUCT_WORKFLOW,
  MarketingCard,
  MarketingHero,
  MarketingLayout,
  MarketingLinkButton,
  MarketingMedia,
  MarketingSection,
  MarketingSectionHeader,
  MetricsStrip,
  ProductWorkflow,
  ShowcaseBlock,
} from "@/components/marketing";
import { MARKETING_ROUTES, SIGNATURE_CAPABILITIES } from "@/lib/marketing/siteConfig";
import { MARKETING_IMAGES, signatureCapabilityImage } from "@/lib/marketing/assets";
import { BRAND } from "@/lib/branding";
import { marketingText } from "@/lib/marketing/text";

const BUSINESS_PROBLEMS: ReadonlyArray<{
  title: string;
  body: string;
  icon: LucideIcon;
}> = [
  {
    get title() { return marketingText("home.problemAttendance"); },
    get body() { return marketingText("home.problemAttendanceBody"); },
    icon: UserCheck,
  },
  {
    get title() { return marketingText("home.problemPayroll"); },
    get body() { return marketingText("home.problemPayrollBody"); },
    icon: Wallet,
  },
  {
    get title() { return marketingText("home.problemRemote"); },
    get body() { return marketingText("home.problemRemoteBody"); },
    icon: MapPinned,
  },
];

const WHY_POINTS = [
  {
    get title() { return marketingText("home.whyConnected"); },
    get body() { return marketingText("home.whyConnectedBody"); },
  },
  {
    get title() { return marketingText("home.whyWorkplaces"); },
    get body() { return marketingText("home.whyWorkplacesBody"); },
  },
  {
    get title() { return marketingText("home.whyWebMobile"); },
    get body() { return marketingText("home.whyWebMobileBody"); },
  },
];

/**
 * Public homepage — gateway into the marketing website.
 * Deeper product, industry, mobile, security, and FAQ stories live on dedicated pages.
 */
export default function HomePage() {
  return (
    <MarketingLayout>
      <MarketingHero
        eyebrow={BRAND.compactEyebrow}
        title={marketingText("home.title")}
        description={marketingText("home.description")}
        primaryCta={{ href: MARKETING_ROUTES.requestAccess, label: marketingText("cta.requestAccess") }}
        secondaryCta={{ href: MARKETING_ROUTES.why, label: marketingText("cta.explorePlatform") }}
        visual={<DashboardMockup title={marketingText("mockup.heroDashboard")} src={MARKETING_IMAGES.heroDashboard} />}
      />

      <MarketingSection>
        <MetricsStrip
          metrics={DEFAULT_MARKETING_METRICS}
          tone="navy"
          title={marketingText("metrics.title")}
          eyebrow={marketingText("metrics.eyebrow")}
        />
      </MarketingSection>

      <MarketingSection id="problems" tone="mist">
        <MarketingSectionHeader
          eyebrow={marketingText("home.problemsEyebrow")}
          title={marketingText("home.problemsTitle")}
          description={marketingText("home.problemsDescription")}
        />

        {/* ~52% content / ~48% illustration; tops align with first card; sticky art on lg+ */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.083fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
          <div className="order-2 grid gap-5 lg:order-1">
            {BUSINESS_PROBLEMS.map((item) => {
              const Icon = item.icon;
              return (
                <MarketingCard
                  key={item.title}
                  elevated
                  className="mkt-problem-card"
                >
                  <div className="flex items-start gap-4">
                    <span
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--mkt-radius-md)] bg-[var(--mkt-sky)] text-[var(--mkt-royal)]"
                      aria-hidden
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="mkt-h3">{item.title}</h3>
                      <p className="mkt-body mt-2 text-sm">{item.body}</p>
                    </div>
                  </div>
                </MarketingCard>
              );
            })}
          </div>

          <div className="order-1 self-start lg:order-2 lg:sticky lg:top-[5.75rem]">
            {/* Pull 24px toward content so columns feel connected */}
            <BusinessProblemsVisual className="lg:-translate-x-6" />
          </div>
        </div>
      </MarketingSection>

      <MarketingSection id="why">
        <MarketingSectionHeader
          eyebrow={marketingText("home.whyEyebrow")}
          title={marketingText("home.whyTitle")}
          description={marketingText("home.whyDescription")}
        />
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {WHY_POINTS.map((item) => (
            <MarketingCard key={item.title} glass>
              <h3 className="mkt-h3">{item.title}</h3>
              <p className="mkt-body mt-2 text-sm">{item.body}</p>
            </MarketingCard>
          ))}
        </div>
        <div className="mt-6">
          <MarketingLinkButton href={MARKETING_ROUTES.why} variant="secondary">
            {marketingText("cta.whyHadro")}
          </MarketingLinkButton>
        </div>
      </MarketingSection>

      <MarketingSection id="dashboard" tone="mist">
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <MarketingSectionHeader
              eyebrow={marketingText("home.visibilityEyebrow")}
              title={marketingText("home.visibilityTitle")}
              description={marketingText("home.visibilityDescription")}
            />
          </div>
          <div className="lg:col-span-7">
            <DashboardMockup
              title={marketingText("mockup.operationalDashboard")}
              src={MARKETING_IMAGES.dashboardOverview}
            />
          </div>
        </div>
      </MarketingSection>

      <MarketingSection id="capabilities">
        <MarketingSectionHeader
          eyebrow={marketingText("home.capabilitiesEyebrow")}
          title={marketingText("home.capabilitiesTitle")}
          description={marketingText("home.capabilitiesDescription")}
          align="center"
          className="mb-8"
        />
        <div className="space-y-12 lg:space-y-16">
          {SIGNATURE_CAPABILITIES.map((cap, index) => (
            <ShowcaseBlock
              key={cap.id}
              title={cap.title}
              problem={cap.problem}
              solution={cap.solution}
              benefit={cap.benefit}
              visualSrc={signatureCapabilityImage(cap.id)}
              reverse={index % 2 === 1}
            />
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <MarketingLinkButton href={MARKETING_ROUTES.features} variant="secondary">
            {marketingText("cta.exploreAllFeatures")}
          </MarketingLinkButton>
        </div>
      </MarketingSection>

      <MarketingSection id="workflow" tone="mist">
        <div className="mb-6">
          <MarketingMedia
            label={marketingText("mockup.workflow")}
            src={MARKETING_IMAGES.workflowOverview}
            aspect="panorama"
            fit="contain"
            variant="showcase"
          />
        </div>
        <ProductWorkflow steps={DEFAULT_PRODUCT_WORKFLOW} />
      </MarketingSection>

      <MarketingSection id="explore-solutions" tone="navy">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mkt-eyebrow text-[var(--mkt-royal)]">{marketingText("home.exploreEyebrow")}</p>
          <h2 className="mkt-h1 mt-3 text-white">{marketingText("home.exploreTitle")}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#A3A3A3]">
            {marketingText("home.exploreDescription")}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <MarketingLinkButton href={MARKETING_ROUTES.solutions} size="lg">
              {marketingText("cta.exploreSolutions")}
            </MarketingLinkButton>
            <MarketingLinkButton
              href={MARKETING_ROUTES.requestAccess}
              variant="secondary"
              size="lg"
              className="border-white/20 bg-white/10 text-white hover:bg-white/15"
            >
              {marketingText("cta.requestAccess")}
            </MarketingLinkButton>
          </div>
        </div>
      </MarketingSection>
    </MarketingLayout>
  );
}
