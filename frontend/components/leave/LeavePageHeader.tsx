"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { translate } from "@/lib/i18n";

export function LeavePageHeader() {
  return (
    <PageHeader
      title={translate("leave.overviewTitle")}
      subtitle={translate("leave.overviewSubtitle")}
    />
  );
}
