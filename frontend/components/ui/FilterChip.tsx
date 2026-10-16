"use client";

import React from "react";
import { Button, type ButtonProps } from "./Button";
import { cn } from "@/lib/design-system/cn";

export interface FilterChipProps
  extends Omit<ButtonProps, "variant" | "size" | "children"> {
  children: React.ReactNode;
  selected?: boolean;
}

/** Canonical preset/filter control with an explicit selected state. */
export function FilterChip({
  children,
  selected = false,
  className,
  ...props
}: FilterChipProps) {
  return (
    <Button
      type="button"
      variant={selected ? "primary" : "filter"}
      size="sm"
      aria-pressed={selected}
      className={cn(
        "rounded-full px-3.5",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
