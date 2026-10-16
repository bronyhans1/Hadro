import type { Transition, Variants } from "motion/react";

/**
 * Marketing motion guidelines.
 * Prefer opacity + transform only. Always respect reduced motion via motionVariants.
 */
export const marketingTransitions = {
  instant: { duration: 0 },
  fast: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
  normal: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  slow: { duration: 0.48, ease: [0.22, 1, 0.36, 1] },
  springSoft: { type: "spring", stiffness: 220, damping: 24 },
} satisfies Record<string, Transition>;

export const marketingFadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: marketingTransitions.normal },
};

export const marketingFadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: marketingTransitions.normal },
};

export const marketingStagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

export const marketingReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: marketingTransitions.fast },
};

export function marketingMotionVariants(
  reduced: boolean | null,
  variants: Variants
): Variants {
  return reduced ? marketingReduced : variants;
}

/**
 * Viewport reveal defaults for marketing sections.
 * `amount: "some"` reveals when any part of the section enters the viewport.
 * A ratio such as 0.18 can never be reached when a stacked section is taller
 * than the viewport divided by that ratio, which left those sections at
 * opacity 0 (a blank band) on phones, tablets, and short laptop windows.
 */
export const marketingViewport = {
  once: true,
  amount: "some",
  margin: "0px 0px -8% 0px",
} as const;
