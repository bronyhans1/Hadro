"use client";

import { m, useReducedMotion } from "motion/react";
import { MarketingMedia } from "./MarketingMedia";
import { MARKETING_IMAGES } from "@/lib/marketing/assets";
import { marketingText } from "@/lib/marketing/text";
import {
  marketingFadeUp,
  marketingMotionVariants,
  marketingViewport,
} from "@/lib/marketing/motion";
import { cn } from "@/lib/design-system/cn";

type Props = {
  className?: string;
};

/**
 * Homepage Business Problems illustration.
 *
 * Replace the art by overwriting:
 *   frontend/public/marketing/features/business-problems.webp
 *
 * Path is centralized as MARKETING_IMAGES.businessProblems — no React changes needed.
 */
export function BusinessProblemsVisual({ className }: Props) {
  const reduced = useReducedMotion();

  return (
    <m.div
      className={cn("business-problems-placeholder w-full", className)}
      variants={marketingMotionVariants(reduced, marketingFadeUp)}
      initial="hidden"
      whileInView="visible"
      viewport={marketingViewport}
    >
      {/* Replace file only: /public/marketing/features/business-problems.webp */}
      <MarketingMedia
        src={MARKETING_IMAGES.businessProblems}
        label={marketingText("mockup.problemsIllustration")}
        aspect="photo"
        variant="showcase"
        className="business-problems-visual !aspect-[5/4]"
        /* Slight left bias: keeps woman primary, reveals stressed coworker more */
        imgClassName="business-problems-visual__img"
      >
        {/* Soft cool brand wash — ~6% blue, preserves skin tones */}
        <div className="business-problems-visual__brand" aria-hidden />

        <div className="business-problems-visual__caption">
          <p className="mkt-caption">{marketingText("home.problemsCaption")}</p>
        </div>
      </MarketingMedia>
    </m.div>
  );
}
