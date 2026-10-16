"use client";

import React from "react";
import { PageSection } from "@/components/ui/PageSection";

interface PayrollSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  id?: string;
  className?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

/** Thin alias of PageSection for payroll module imports. */
export function PayrollSection(props: PayrollSectionProps) {
  return <PageSection {...props} />;
}
