"use client";

import React from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { translate } from "@/lib/i18n";

interface PayrollPageHeaderProps {
  actions?: React.ReactNode;
}

export function PayrollPageHeader({ actions }: PayrollPageHeaderProps) {
  return (
    <PageHeader
      title={translate("payroll.overviewTitle")}
      subtitle={translate("payroll.overviewSubtitle")}
      actions={actions}
    />
  );
}
