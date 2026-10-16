"use client";

import { m, useReducedMotion } from "motion/react";
import { cn } from "@/lib/design-system/cn";
import {
  marketingFadeUp,
  marketingMotionVariants,
  marketingViewport,
} from "@/lib/marketing/motion";

type SectionProps = {
  id?: string;
  children: React.ReactNode;
  className?: string;
  container?: "default" | "wide" | "narrow" | "none";
  tone?: "default" | "mist" | "navy" | "glass";
  reveal?: boolean;
};

const toneClass = {
  default: "",
  mist: "bg-[var(--mkt-mist)]",
  navy: "mkt-section--navy bg-[var(--mkt-navy)] text-[var(--mkt-white)] [&_.mkt-h2]:text-white [&_.mkt-h3]:text-white [&_.mkt-body]:text-[var(--mkt-gray)] [&_.mkt-body-lg]:text-[var(--mkt-gray)] [&_.mkt-eyebrow]:text-[var(--mkt-royal)]",
  glass: "",
} as const;

const containerClass = {
  default: "mkt-container",
  wide: "mkt-container-wide",
  narrow: "mkt-container-narrow",
  none: "",
} as const;

export function MarketingSection({
  id,
  children,
  className,
  container = "default",
  tone = "default",
  reveal = true,
}: SectionProps) {
  const reduced = useReducedMotion();
  const inner = (
    <div className={cn(container !== "none" && containerClass[container], className)}>
      {children}
    </div>
  );

  return (
    <section id={id} className={cn("mkt-section scroll-mt-28", toneClass[tone])}>
      {reveal ? (
        <m.div
          variants={marketingMotionVariants(reduced, marketingFadeUp)}
          initial="hidden"
          whileInView="visible"
          viewport={marketingViewport}
        >
          {inner}
        </m.div>
      ) : (
        inner
      )}
    </section>
  );
}

type HeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
};

export function MarketingSectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: HeaderProps) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow ? <p className="mkt-eyebrow">{eyebrow}</p> : null}
      <h2 className={cn("mkt-h2", eyebrow && "mt-3")}>{title}</h2>
      {description ? <p className="mkt-body-lg mt-3.5">{description}</p> : null}
    </div>
  );
}
