"use client";

import {
  DashboardMockup,
  DEFAULT_MARKETING_METRICS,
  DEFAULT_PRODUCT_WORKFLOW,
  FaqAccordion,
  IndustryCard,
  MarketingCard,
  MarketingHero,
  MarketingLayout,
  MarketingLinkButton,
  MarketingSection,
  MarketingSectionHeader,
  MetricsStrip,
  PhoneMockup,
  ProductWorkflow,
  ShowcaseBlock,
  TestimonialCard,
} from "@/components/marketing";
import {
  LANDING_INDUSTRIES,
  MARKETING_ROUTES,
  SIGNATURE_CAPABILITIES,
} from "@/lib/marketing/siteConfig";
import { signatureCapabilityImage, MARKETING_IMAGES } from "@/lib/marketing/assets";

/**
 * Stage 0 foundation review surface.
 * Not a public marketing page — used to validate reusable building blocks
 * before Stage 1 homepage work begins.
 */
export default function MarketingFoundationPreviewPage() {
  return (
    <MarketingLayout previewMode>
      <div className="border-b border-[var(--mkt-border)] bg-[var(--mkt-navy)] px-4 py-3 text-center text-xs font-semibold tracking-wide text-[#F5F5F5]">
        Stage 0 — Marketing Foundation preview · Not a production marketing page
      </div>

      <MarketingHero
        eyebrow="Marketing Foundation"
        title="Reusable building blocks for the HADRO public website."
        description="This preview validates layout, typography, motion-ready sections, mockups, and shared components. Homepage storytelling begins in Stage 1."
        primaryCta={{ href: MARKETING_ROUTES.home, label: "Current homepage" }}
        secondaryCta={{ href: MARKETING_ROUTES.login, label: "Sign in" }}
        visual={<DashboardMockup title="Dashboard mockup shell" />}
      />

      <MarketingSection tone="mist">
        <MarketingSectionHeader
          eyebrow="Design tokens"
          title="Production-quality structure with placeholder media"
          description="Spacing, type scale, glass surfaces, and section rhythm are intentional. Placeholder imagery can be swapped without redesigning layouts."
        />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            ["Typography", "Display, H1–H3, body, eyebrow, caption"],
            ["Surfaces", "Mist, glass, navy, elevated cards"],
            ["Motion", "Fade-up reveals with reduced-motion fallback"],
          ].map(([title, body]) => (
            <MarketingCard key={title} elevated>
              <p className="mkt-h3">{title}</p>
              <p className="mkt-body mt-3 text-sm">{body}</p>
            </MarketingCard>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection>
        <MarketingSectionHeader
          eyebrow="Signature showcase"
          title="Problem → Solution → Visual → Value"
          description="Flagship capability pattern for GPS, QR, Live Earnings, and Multi-Branch."
        />
        <div className="mt-8 space-y-12">
          {SIGNATURE_CAPABILITIES.slice(0, 2).map((cap, index) => (
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
      </MarketingSection>

      <MarketingSection tone="mist">
        <ProductWorkflow steps={DEFAULT_PRODUCT_WORKFLOW} />
      </MarketingSection>

      <MarketingSection>
        <MetricsStrip
          eyebrow="Platform highlights"
          title="Configurable metrics strip"
          metrics={DEFAULT_MARKETING_METRICS}
          tone="navy"
        />
      </MarketingSection>

      <MarketingSection tone="mist">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <MarketingSectionHeader
              eyebrow="Ecosystem"
              title="Web and mobile mockup shells"
              description="Use DashboardMockup and PhoneMockup as product centerpieces across marketing pages."
            />
            <div className="mt-8">
              <MarketingLinkButton href={MARKETING_ROUTES.requestAccess} variant="secondary">
                Request access route reserved
              </MarketingLinkButton>
            </div>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 sm:items-end">
            <DashboardMockup className="sm:col-span-1" />
            <PhoneMockup />
          </div>
        </div>
      </MarketingSection>

      <MarketingSection>
        <MarketingSectionHeader
          eyebrow="Industries"
          title="V1 industry set"
          description="Includes Hotels and Government. Cards are disabled until Solutions pages ship."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {LANDING_INDUSTRIES.map((item) => (
            <IndustryCard key={item.id} id={item.id} label={item.label} disabled />
          ))}
        </div>
      </MarketingSection>

      <MarketingSection tone="mist">
        <MarketingSectionHeader eyebrow="Social proof" title="Testimonial card" />
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <TestimonialCard
            quote="HADRO gave us one place to manage attendance and payroll visibility across branches."
            name="Ama Mensah"
            role="HR Director"
            organization="Placeholder Organization"
            logoSrc={MARKETING_IMAGES.testimonialCompany1}
          />
          <TestimonialCard
            quote="Live earnings reduced the number of payroll questions we receive every month."
            name="Kwesi Boateng"
            role="Operations Manager"
            organization="Placeholder Logistics Co."
            logoSrc={MARKETING_IMAGES.testimonialCompany2}
          />
        </div>
      </MarketingSection>

      <MarketingSection>
        <MarketingSectionHeader eyebrow="FAQ" title="Accessible accordion pattern" />
        <div className="mt-8 max-w-3xl">
          <FaqAccordion
            items={[
              {
                question: "What is HADRO?",
                answer:
                  "HADRO is an Intelligent Workforce Management spanning web administration and mobile employee self-service.",
              },
              {
                question: "When does homepage storytelling begin?",
                answer:
                  "Stage 1 rebuilds the homepage using these foundation components after this Stage 0 review is approved.",
              },
            ]}
          />
        </div>
      </MarketingSection>
    </MarketingLayout>
  );
}
