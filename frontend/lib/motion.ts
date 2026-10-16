import type { Transition, Variants } from "motion/react";

/**
 * HADRO motion language.
 * Components should consume these tokens instead of defining local timings.
 * Motion is limited to opacity and transforms to avoid layout work.
 */
export const transitions = {
  instant: { duration: 0 },
  fast: { duration: 0.15, ease: [0.22, 1, 0.36, 1] },
  normal: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
  slow: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  slower: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  spring: { type: "spring", stiffness: 320, damping: 26 },
  springSoft: { type: "spring", stiffness: 220, damping: 22 },
  springBouncy: { type: "spring", stiffness: 360, damping: 18 },
  number: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
} satisfies Record<string, Transition>;

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.normal },
  exit: { opacity: 0, transition: transitions.fast },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: transitions.normal },
  exit: { opacity: 0, y: 4, transition: transitions.fast },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -6 },
  visible: { opacity: 1, y: 0, transition: transitions.normal },
  exit: { opacity: 0, y: -4, transition: transitions.fast },
};

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: transitions.normal },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.02,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: transitions.normal },
};

export const cardReveal = fadeUp;
export const tableReveal = fadeUp;
export const listAnimation = staggerContainer;
export const loadingAnimation = fadeIn;

export const emptyIconReveal: Variants = {
  hidden: { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0, transition: transitions.slow },
};

export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.normal },
  exit: { opacity: 0, transition: transitions.fast },
};

/** Keeps the modal presence boundary mounted while child exit animations finish. */
export const modalPresence: Variants = {
  visible: { opacity: 1 },
  exit: { opacity: 1, transition: transitions.fast },
};

export const modalAnimation: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: transitions.normal },
  exit: { opacity: 0, scale: 0.96, transition: transitions.fast },
};

/** Keeps the drawer presence boundary mounted while child exit animations finish. */
export const drawerPresence: Variants = {
  visible: { opacity: 1 },
  exit: { opacity: 1, transition: transitions.fast },
};

export const drawerBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.normal },
  exit: { opacity: 0, transition: transitions.fast },
};

export const drawerPanel: Variants = {
  hidden: { opacity: 0, x: "100%" },
  visible: { opacity: 1, x: 0, transition: transitions.normal },
  exit: { opacity: 0, x: "100%", transition: transitions.fast },
};

export const dropdownAnimation: Variants = {
  hidden: { opacity: 0, y: -4, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: transitions.fast },
  exit: { opacity: 0, y: -2, scale: 0.98, transition: transitions.fast },
};

export const tooltipAnimation: Variants = {
  hidden: { opacity: 0, y: 3 },
  visible: { opacity: 1, y: 0, transition: transitions.fast },
  exit: { opacity: 0, transition: transitions.fast },
};

export const toastAnimation: Variants = {
  hidden: { opacity: 0, y: -8, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: transitions.normal },
  exit: { opacity: 0, y: -4, scale: 0.98, transition: transitions.fast },
};

export const buttonInteraction = {
  hover: { y: -1 },
  tap: { scale: 0.98, y: 0 },
};

export const cardInteraction = {
  hover: { y: -2 },
};

export const badgePop: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: transitions.springSoft },
  exit: { opacity: 0, scale: 0.9, transition: transitions.fast },
};

export const bellInteraction = {
  hover: { scale: 1.05, rotate: -4 },
  tap: { scale: 0.98, rotate: 0 },
};

export const greetingWave: Variants = {
  initial: { rotate: 0 },
  animate: {
    rotate: [0, 12, -8, 10, -5, 0],
    transition: { duration: 0.95, ease: "easeInOut" },
  },
};

export const reducedFade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.fast },
  exit: { opacity: 0, transition: transitions.instant },
};

export function motionVariants(reduced: boolean | null, variants: Variants): Variants {
  return reduced ? reducedFade : variants;
}
