"use client";

import React from "react";
import { m, useReducedMotion } from "motion/react";
import { cn } from "@/lib/design-system/cn";
import { cardInteraction, cardReveal, motionVariants, transitions } from "@/lib/motion";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  hoverable?: boolean;
  padding?: boolean;
}

export function Card({ children, className = "", title, hoverable = false, padding = true }: CardProps) {
  const reduced = useReducedMotion();

  return (
    <m.div
      className={cn(
        "overflow-hidden rounded-xl border transition-[transform,box-shadow,border-color,background-color]",
        hoverable && "hover:shadow-[var(--ds-shadow-hover)]",
        className
      )}
      variants={motionVariants(reduced, cardReveal)}
      initial="hidden"
      whileInView="visible"
      whileHover={hoverable && !reduced ? cardInteraction.hover : undefined}
      viewport={{ once: true, amount: 0.08 }}
      transition={transitions.normal}
      style={{
        borderColor: "var(--ds-color-border)",
        background: "linear-gradient(180deg, var(--ds-color-surface), var(--ds-color-card))",
        boxShadow: "var(--ds-shadow-card)",
        transitionDuration: "var(--ds-duration-normal)",
      }}
    >
      {title ? <CardHeader title={title} /> : null}
      {padding ? <CardBody>{children}</CardBody> : children}
    </m.div>
  );
}

export function CardHeader({
  title,
  children,
  className,
}: {
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-center justify-between gap-3 border-b px-5 py-3.5", className)}
      style={{
        borderColor: "var(--ds-color-border)",
        background: "var(--ds-color-surface-muted)",
      }}
    >
      {title ? <h3 className="ds-h3 text-sm">{title}</h3> : children}
    </div>
  );
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn("flex items-center justify-end gap-2 border-t px-5 py-3.5", className)}
      style={{ borderColor: "var(--ds-color-border)" }}
    >
      {children}
    </div>
  );
}
