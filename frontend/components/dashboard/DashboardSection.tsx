"use client";

import React from "react";
import { PageSection } from "@/components/ui/PageSection";

interface DashboardSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

/** Thin alias of PageSection for dashboard module imports. */
export function DashboardSection(props: DashboardSectionProps) {
  return <PageSection {...props} />;
}
