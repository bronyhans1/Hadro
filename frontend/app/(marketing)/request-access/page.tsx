"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MarketingLayout,
  MarketingSection,
  MarketingSectionHeader,
  RequestAccessForm,
  RequestAccessNextSteps,
} from "@/components/marketing";
import { MARKETING, MARKETING_ROUTES } from "@/lib/marketing/siteConfig";
import { BRAND } from "@/lib/branding";
import { cn } from "@/lib/design-system/cn";
import { marketingText } from "@/lib/marketing/text";

/**
 * Stage 2 — public Request Access page.
 * Form submits to the existing onboarding backend and Platform Admin workflow.
 */
export default function RequestAccessPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <MarketingLayout>
      <MarketingSection container="narrow" tone="mist" reveal={false}>
        <p className="mkt-eyebrow">{marketingText("requestAccess.eyebrow")}</p>
        <h1 className="mkt-display mt-3">{marketingText("requestAccess.title")}</h1>
        <p className="mkt-body-lg mt-4 max-w-xl">
          {marketingText("requestAccess.description", { values: { brand: BRAND.appName } })}
        </p>

        <div
          className={cn(
            "mt-8",
            !submitted &&
              "rounded-[var(--mkt-radius-2xl)] border border-[var(--mkt-border)] bg-[var(--mkt-surface)] p-6 shadow-[var(--mkt-shadow-soft)] sm:p-8"
          )}
        >
          {!submitted ? (
            <MarketingSectionHeader
              eyebrow={marketingText("requestAccess.formEyebrow")}
              title={marketingText("requestAccess.formTitle")}
              description={marketingText("requestAccess.formDescription")}
              align="left"
              className="mb-6"
            />
          ) : null}
          <RequestAccessForm
            onSuccess={() => setSubmitted(true)}
            onReset={() => setSubmitted(false)}
          />
        </div>

        {!submitted ? <RequestAccessNextSteps className="mt-8" /> : null}

        <p className="mkt-caption mt-6 text-center">
          {marketingText("requestAccess.preferEmail")}{" "}
          <a
            href={`mailto:${MARKETING.contactEmail}`}
            className="font-medium text-[var(--mkt-royal)] underline-offset-2 hover:underline"
          >
            {MARKETING.contactEmail}
          </a>
          {" · "}
          <Link
            href={MARKETING_ROUTES.home}
            className="font-medium text-[var(--mkt-royal)] underline-offset-2 hover:underline"
          >
            {marketingText("cta.backToHome")}
          </Link>
        </p>
      </MarketingSection>
    </MarketingLayout>
  );
}
