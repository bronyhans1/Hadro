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
import { MARKETING, MARKETING_ROUTES } from "@/lib/marketing/siteConfig";
import { CONTACT_PAGE } from "@/lib/marketing/stage4Content";
import { marketingText } from "@/lib/marketing/text";

export default function ContactPage() {
  return (
    <MarketingLayout>
      <MarketingHero
        eyebrow={CONTACT_PAGE.eyebrow}
        title={CONTACT_PAGE.title}
        description={CONTACT_PAGE.description}
        primaryCta={{ href: MARKETING_ROUTES.requestAccess, label: marketingText("cta.requestAccess") }}
        secondaryCta={{ href: `mailto:${MARKETING.contactEmail}`, label: marketingText("support.emailTitle") }}
        visual={
          <MarketingMedia label={marketingText("mockup.contact")} src={MARKETING_IMAGES.contactHero} aspect="wide" />
        }
      />

      <MarketingSection id="channels" tone="mist">
        <MarketingSectionHeader
          eyebrow={marketingText("contact.pathsEyebrow")}
          title={marketingText("contact.pathsTitle")}
        />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {CONTACT_PAGE.channels.map((item) => (
            <MarketingCard key={item.title} elevated className="flex h-full flex-col">
              <h3 className="text-sm font-semibold text-[var(--mkt-ink)]">{item.title}</h3>
              <p className="mkt-body mt-2 flex-1 text-sm">{item.body}</p>
              <div className="mt-6">
                {item.href.startsWith("mailto:") || item.href.startsWith("http") ? (
                  <MarketingLinkButton
                    href={item.href}
                    variant="secondary"
                    external={item.href.startsWith("http")}
                  >
                    {item.cta}
                  </MarketingLinkButton>
                ) : (
                  <MarketingLinkButton href={item.href} variant="secondary">
                    {item.cta}
                  </MarketingLinkButton>
                )}
              </div>
            </MarketingCard>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection id="direct" container="narrow">
        <MarketingSectionHeader
          eyebrow={marketingText("contact.directEyebrow")}
          title={CONTACT_PAGE.email}
          description={marketingText("contact.directDescription")}
          align="center"
          className="mx-auto text-center"
        />
        <div className="mt-8 flex justify-center">
          <MarketingLinkButton href={`mailto:${CONTACT_PAGE.email}`} size="lg">
            {marketingText("cta.sendEmail")}
          </MarketingLinkButton>
        </div>
      </MarketingSection>

      <MarketingSection id="get-access" tone="navy">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mkt-eyebrow text-[var(--mkt-royal)]">{marketingText("contact.newOrgs")}</p>
          <h2 className="mkt-h1 mt-3 text-white">{marketingText("contact.startingTitle")}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#A3A3A3]">
            {marketingText("contact.startingDescription")}
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
