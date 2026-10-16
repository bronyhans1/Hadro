"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "motion/react";
import { transitions } from "@/lib/motion";
import { getActiveLocale } from "@/lib/i18n";

interface CountUpProps {
  value: number;
  className?: string;
}

/** Animates a numeric value once when it first mounts with loaded data. */
export function CountUp({ value, className }: CountUpProps) {
  const reduced = useReducedMotion();
  const animated = useRef(false);
  const [displayValue, setDisplayValue] = useState(reduced ? value : 0);

  useEffect(() => {
    if (animated.current) {
      setDisplayValue(value);
      return;
    }

    animated.current = true;
    if (reduced) {
      setDisplayValue(value);
      return;
    }

    const controls = animate(0, value, {
      ...transitions.number,
      onUpdate: (latest) => setDisplayValue(Math.round(latest)),
    });
    return () => controls.stop();
  }, [reduced, value]);

  return <span className={className}>{displayValue.toLocaleString(getActiveLocale())}</span>;
}
