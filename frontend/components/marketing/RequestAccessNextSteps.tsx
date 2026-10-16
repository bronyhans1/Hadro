"use client";

import { MarketingCard } from "./MarketingCard";
import { marketingText } from "@/lib/marketing/text";

const NEXT_STEPS = [
  {
    get title() { return marketingText("requestAccess.reviewTitle"); },
    get body() { return marketingText("requestAccess.reviewBody"); },
  },
  {
    get title() { return marketingText("requestAccess.fitTitle"); },
    get body() { return marketingText("requestAccess.fitBody"); },
  },
  {
    get title() { return marketingText("requestAccess.guideTitle"); },
    get body() { return marketingText("requestAccess.guideBody"); },
  },
];

/** Reassuring post-submit journey for the Request Access page. */
export function RequestAccessNextSteps({ className }: { className?: string }) {
  return (
    <div className={className}>
      <p className="mkt-eyebrow">{marketingText("requestAccess.pathEyebrow")}</p>
      <h2 className="mkt-h3 mt-3 text-[var(--mkt-ink)]">{marketingText("requestAccess.pathTitle")}</h2>
      <p className="mkt-body mt-2 text-sm">
        {marketingText("requestAccess.pathDescription")}
      </p>
      <ol className="mt-6 grid gap-4 sm:grid-cols-3">
        {NEXT_STEPS.map((step, index) => (
          <li key={step.title} className="list-none">
            <MarketingCard className="h-full">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--mkt-royal)]">
                {marketingText("requestAccess.stepLabel", { values: { n: index + 1 } })}
              </p>
              <h3 className="mt-2 text-sm font-semibold text-[var(--mkt-ink)]">{step.title}</h3>
              <p className="mkt-body mt-2 text-sm">{step.body}</p>
            </MarketingCard>
          </li>
        ))}
      </ol>
    </div>
  );
}
