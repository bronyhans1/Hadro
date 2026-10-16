"use client";

import React from "react";
import { m, useReducedMotion } from "motion/react";
import { cn } from "@/lib/design-system/cn";
import { STATUS_TONE_STYLES, type StatusTone } from "@/lib/design-system/statusTones";
import { cardInteraction, cardReveal, motionVariants, transitions } from "@/lib/motion";
import { CountUp } from "./CountUp";

export type StatCardTone =
  | "success"
  | "working"
  | "completed"
  | "warning"
  | "danger"
  | "remote"
  | "leave"
  | "neutral";

const TONE_TO_STATUS: Record<StatCardTone, StatusTone> = {
  success: "success",
  working: "primary",
  completed: "violet",
  warning: "warning",
  danger: "danger",
  remote: "info",
  leave: "pink",
  neutral: "neutral",
};

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  className?: string;
  icon?: React.ReactNode;
  iconClassName?: string;
  iconContainerClassName?: string;
  animateValue?: boolean;
  tone?: StatCardTone;
}

export function StatCard({
  title,
  value,
  subtitle,
  className = "",
  icon,
  iconClassName = "",
  iconContainerClassName = "",
  animateValue = false,
  tone = "neutral",
}: StatCardProps) {
  const reduced = useReducedMotion();
  const toneStyle = STATUS_TONE_STYLES[TONE_TO_STATUS[tone]];

  return (
    <m.div
      className={cn(
        "group rounded-xl border p-5 transition-[transform,box-shadow,border-color,background-color]",
        "hover:shadow-[var(--ds-shadow-hover)]",
        className
      )}
      variants={motionVariants(reduced, cardReveal)}
      whileHover={reduced ? undefined : cardInteraction.hover}
      transition={transitions.normal}
      style={{
        borderColor: "var(--ds-color-border)",
        background: "linear-gradient(180deg, var(--ds-color-surface), var(--ds-color-card))",
        boxShadow: "var(--ds-shadow-card)",
        transitionDuration: "var(--ds-duration-normal)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <p className="ds-label">{title}</p>
          {subtitle ? (
            <p className="text-xs leading-snug" style={{ color: "var(--ds-color-text-muted)" }}>
              {subtitle}
            </p>
          ) : null}
        </div>
        {icon ? (
          <span
            className={cn(
              "flex size-[52px] shrink-0 items-center justify-center rounded-full border transition-transform group-hover:scale-105 sm:size-14",
              iconContainerClassName
            )}
            style={{
              borderColor: toneStyle.borderColor,
              background: toneStyle.background,
              transitionDuration: "var(--ds-duration-normal)",
            }}
            aria-hidden
          >
            <span
              className={cn(
                "[&>svg]:h-6 [&>svg]:w-6 sm:[&>svg]:h-7 sm:[&>svg]:w-7",
                iconClassName
              )}
              style={{ color: toneStyle.color }}
            >
              {icon}
            </span>
          </span>
        ) : null}
      </div>
      <p
        className="mt-5 text-3xl font-semibold tabular-nums tracking-tight sm:mt-6"
        style={{ color: "var(--ds-color-text-primary)" }}
      >
        {animateValue && typeof value === "number" ? <CountUp value={value} /> : value}
      </p>
    </m.div>
  );
}
