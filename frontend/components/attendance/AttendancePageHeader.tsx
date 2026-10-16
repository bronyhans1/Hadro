"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { translate } from "@/lib/i18n";

export function AttendancePageHeader() {
  return (
    <PageHeader
      title={translate("attendance.attendanceOverview")}
      subtitle={translate("attendance.attendanceOverviewSubtitle")}
    />
  );
}
