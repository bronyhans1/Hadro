"use client";

import React from "react";
import { PageSection } from "@/components/ui/PageSection";

interface LeaveSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  id?: string;
  className?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

/** Thin alias of PageSection for leave module imports. */
export function LeaveSection(props: LeaveSectionProps) {
  return <PageSection {...props} />;
}
