"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { translate } from "@/lib/i18n";

export function LeaveBalancePageHeader() {
  return (
    <PageHeader
      title={translate("navigation.leaveBalance")}
      subtitle={translate("leave.balanceSubtitle")}
    />
  );
}
