"use client";

import { useEffect, useRef } from "react";
import { Check, CheckCircle2 } from "lucide-react";
import { m, useReducedMotion } from "motion/react";
import { MarketingButton } from "./MarketingButton";
import { MarketingLinkButton } from "./MarketingLinkButton";
import { MARKETING_ROUTES } from "@/lib/marketing/siteConfig";
import { BRAND } from "@/lib/branding";
import { cn } from "@/lib/design-system/cn";
import { marketingText } from "@/lib/marketing/text";
import {
  marketingFadeUp,
  marketingMotionVariants,
  marketingStagger,
} from "@/lib/marketing/motion";

const NEXT_STEP_KEYS = [
  "requestAccess.stepReview",
  "requestAccess.stepContact",
  "requestAccess.stepDemo",
  "requestAccess.stepOnboarding",
] as const;

type Props = {
  alreadyExists?: boolean;
  message?: string | null;
  onSubmitAnother: () => void;
  className?: string;
};

/**
 * Primary confirmation after a Request Access submission.
 * Replaces the form in-place so success is always in view.
 */
export function RequestAccessSuccessPanel({
  alreadyExists = false,
  message,
  onSubmitAnother,
  className,
}: Props) {
  const reduced = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    panelRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <m.div
      ref={panelRef}
      tabIndex={-1}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      initial="hidden"
      animate="visible"
      variants={marketingMotionVariants(reduced, marketingStagger)}
      className={cn(
        "rounded-[var(--mkt-radius-2xl)] border border-emerald-200/80 bg-gradient-to-b from-emerald-50 to-[var(--mkt-surface)] outline-none",
        "px-6 pt-6 pb-4 shadow-[var(--mkt-shadow-soft)] sm:px-8 sm:pt-8 sm:pb-5",
        alreadyExists && "border-[var(--mkt-border-strong)] from-[var(--mkt-sky)]",
        className
      )}
    >
      <m.div variants={marketingMotionVariants(reduced, marketingFadeUp)} className="flex flex-col items-start gap-4 sm:flex-row sm:gap-5">
        <span
          className={cn(
            "inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full",
            alreadyExists
              ? "bg-[var(--mkt-surface)] text-[var(--mkt-royal)] ring-1 ring-[var(--mkt-border-strong)]"
              : "bg-emerald-100 text-emerald-700"
          )}
          aria-hidden
        >
          <CheckCircle2 className="h-8 w-8" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--mkt-ink)] sm:text-2xl">
            {alreadyExists ? marketingText("requestAccess.alreadyTitle") : marketingText("requestAccess.sentTitle")}
          </h2>
          {alreadyExists ? (
            <>
              <p className="mt-3 text-base text-[var(--mkt-ink)]/90">
                {marketingText("requestAccess.thanks", { values: { brand: BRAND.appName } })}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--mkt-gray)]">
                {message?.trim() || marketingText("requestAccess.alreadyExists")}
              </p>
            </>
          ) : (
            <>
              <p className="mt-3 text-base text-[var(--mkt-ink)]/90">
                {marketingText("requestAccess.thanks", { values: { brand: BRAND.appName } })}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--mkt-gray)]">
                {marketingText("requestAccess.receivedDetail")}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--mkt-gray)]">
                {marketingText("requestAccess.followUp")}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--mkt-gray)]">
                {marketingText("requestAccess.inbox")}
              </p>
            </>
          )}
        </div>
      </m.div>

      <m.div
        variants={marketingMotionVariants(reduced, marketingFadeUp)}
        className="mt-8 border-t border-[var(--mkt-border)] pt-6"
      >
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--mkt-royal)]">
          {marketingText("requestAccess.nextEyebrow")}
        </p>
        <ul className="mt-4 space-y-3">
          {NEXT_STEP_KEYS.map((key) => (
            <li key={key} className="flex items-start gap-3 text-sm text-[var(--mkt-ink)]">
              <span
                className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
                aria-hidden
              >
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
              <span>{marketingText(key)}</span>
            </li>
          ))}
        </ul>
      </m.div>

      <m.div
        variants={marketingMotionVariants(reduced, marketingFadeUp)}
        className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
      >
        <MarketingButton type="button" size="lg" onClick={onSubmitAnother} className="w-full sm:w-auto">
          {marketingText("cta.submitAnother")}
        </MarketingButton>
        <MarketingLinkButton
          href={MARKETING_ROUTES.home}
          variant="secondary"
          size="lg"
          className="w-full sm:w-auto"
        >
          {marketingText("cta.returnToHome")}
        </MarketingLinkButton>
      </m.div>
    </m.div>
  );
}
