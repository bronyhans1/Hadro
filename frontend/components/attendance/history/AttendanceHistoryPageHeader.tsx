"use client";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { ClockPlus } from "lucide-react";
import { translate } from "@/lib/i18n";

interface AttendanceHistoryPageHeaderProps {
  canRecordManualAttendance: boolean;
  onManualAttendance: () => void;
}

export function AttendanceHistoryPageHeader({
  canRecordManualAttendance,
  onManualAttendance,
}: AttendanceHistoryPageHeaderProps) {
  return (
    <PageHeader
      title={translate("attendance.attendanceHistory")}
      subtitle={translate("attendance.attendanceHistorySubtitle")}
      actions={
        canRecordManualAttendance ? (
          <Button
            type="button"
            variant="primary"
            onClick={onManualAttendance}
            leftIcon={<ClockPlus className="h-4 w-4" aria-hidden />}
          >
            {translate("attendance.manualAttendance")}
          </Button>
        ) : undefined
      }
    />
  );
}
