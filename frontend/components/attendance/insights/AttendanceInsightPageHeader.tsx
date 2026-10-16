"use client";

import { PageHeader } from "@/components/ui/PageHeader";

interface AttendanceInsightPageHeaderProps {
  title: string;
  subtitle: string;
}

export function AttendanceInsightPageHeader({ title, subtitle }: AttendanceInsightPageHeaderProps) {
  return <PageHeader title={title} subtitle={subtitle} />;
}
