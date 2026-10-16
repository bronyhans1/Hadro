"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { translate } from "@/lib/i18n";

export function ManualOvertimePageHeader() {
  return (
    <PageHeader
      title={translate("navigation.manualOvertime")}
      subtitle={translate("payroll.manualOvertimeSubtitle")}
    />
  );
}
