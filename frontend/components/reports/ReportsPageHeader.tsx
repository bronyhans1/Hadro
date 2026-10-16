"use client";

import { PageHeader } from "@/components/ui/PageHeader";

interface ReportsPageHeaderProps {
  title: string;
  subtitle: string;
}

/** @deprecated Prefer PageHeader — kept as a thin alias for existing imports. */
export function ReportsPageHeader({ title, subtitle }: ReportsPageHeaderProps) {
  return <PageHeader title={title} subtitle={subtitle} />;
}
