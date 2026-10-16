"use client";

import React from "react";
import { PageSection } from "@/components/ui/PageSection";

interface AttendanceSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  id?: string;
  className?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

/** Thin alias of PageSection for attendance module imports. */
export function AttendanceSection(props: AttendanceSectionProps) {
  return <PageSection {...props} />;
}
