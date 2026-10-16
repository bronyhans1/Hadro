"use client";

import React from "react";
import { m, useReducedMotion } from "motion/react";
import { cn } from "@/lib/design-system/cn";
import {
  cardReveal,
  fadeIn,
  fadeUp,
  motionVariants,
  pageTransition,
  staggerContainer,
  tableReveal,
} from "@/lib/motion";

interface MotionProps {
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}

export function MotionPage({ children, className }: MotionProps) {
  const reduced = useReducedMotion();
  return (
    <m.div
      className={className}
      variants={pageTransition}
      initial={reduced ? false : "hidden"}
      animate="visible"
    >
      {children}
    </m.div>
  );
}

export function MotionFade({ children, className }: MotionProps) {
  const reduced = useReducedMotion();
  return (
    <m.div
      className={className}
      variants={motionVariants(reduced, fadeIn)}
      initial="hidden"
      animate="visible"
    >
      {children}
    </m.div>
  );
}

export function MotionSection({ children, className }: MotionProps) {
  const reduced = useReducedMotion();
  return (
    <m.section
      className={className}
      variants={motionVariants(reduced, fadeUp)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.08 }}
    >
      {children}
    </m.section>
  );
}

export function MotionCard({ children, className }: MotionProps) {
  const reduced = useReducedMotion();
  return (
    <m.div
      className={className}
      variants={motionVariants(reduced, cardReveal)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.08 }}
    >
      {children}
    </m.div>
  );
}

export function MotionTable({ children, className }: MotionProps) {
  const reduced = useReducedMotion();
  return (
    <m.div
      className={className}
      variants={motionVariants(reduced, tableReveal)}
      initial="hidden"
      animate="visible"
    >
      {children}
    </m.div>
  );
}

export function MotionStagger({
  children,
  className,
  "aria-label": ariaLabel,
}: MotionProps) {
  const reduced = useReducedMotion();
  return (
    <m.div
      className={cn(className)}
      aria-label={ariaLabel}
      variants={reduced ? undefined : staggerContainer}
      initial={reduced ? false : "hidden"}
      animate="visible"
    >
      {children}
    </m.div>
  );
}
