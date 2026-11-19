"use client";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { translate } from "@/lib/i18n";
import { CalendarPlus } from "lucide-react";

interface LeaveRequestsPageHeaderProps {
  canRequestLeave: boolean;
  onRequestLeave: () => void;
}

export function LeaveRequestsPageHeader({
  canRequestLeave,
  onRequestLeave,
}: LeaveRequestsPageHeaderProps) {
  return (
    <PageHeader
      title={translate("navigation.leaveRequests")}
      subtitle={translate("leave.requestsSubtitle")}
      actions={
        canRequestLeave ? (
          <Button
            type="button"
            variant="primary"
            className="w-full sm:w-auto"
            onClick={onRequestLeave}
            leftIcon={<CalendarPlus className="h-4 w-4" aria-hidden />}
          >
            {translate("leave.requestLeave")}
          </Button>
        ) : undefined
      }
    />
  );
}
