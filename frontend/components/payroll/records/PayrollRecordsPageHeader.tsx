"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { translate } from "@/lib/i18n";

export function PayrollRecordsPageHeader() {
  return (
    <PageHeader
      title={translate("navigation.payrollRecords")}
      subtitle={translate("payroll.recordsSubtitle")}
    />
  );
}
