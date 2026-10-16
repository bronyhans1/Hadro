"use client";

import { LazyMotion } from "motion/react";

const loadFeatures = () =>
  import("@/lib/motionFeatures").then((module) => module.default);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  );
}
