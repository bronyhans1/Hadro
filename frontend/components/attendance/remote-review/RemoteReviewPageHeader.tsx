"use client";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { RefreshCw } from "lucide-react";
import { translate } from "@/lib/i18n";

interface RemoteReviewPageHeaderProps {
  onRefresh: () => void;
  loading?: boolean;
}

export function RemoteReviewPageHeader({ onRefresh, loading }: RemoteReviewPageHeaderProps) {
  return (
    <PageHeader
      title={translate("attendance.remoteAttendanceReview")}
      subtitle={translate("attendance.remoteAttendanceReviewSubtitle")}
      actions={
        <Button
          type="button"
          variant="secondary"
          onClick={onRefresh}
          loading={loading}
          leftIcon={<RefreshCw className="h-4 w-4" aria-hidden />}
        >
          {translate("attendance.refresh")}
        </Button>
      }
    />
  );
}
