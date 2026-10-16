"use client";

import { PayrollPeriodTimeline } from "./PayrollPeriodTimeline";
import { Card, CardBody } from "@/components/ui/Card";
import { translate } from "@/lib/i18n";

interface PayrollTimelineSectionProps {
  periodId: string | null | undefined;
  onEventCountChange?: (count: number) => void;
}

export function PayrollTimelineSection({ periodId, onEventCountChange }: PayrollTimelineSectionProps) {
  if (!periodId) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm" style={{ color: "var(--ds-color-text-muted)" }}>
            {translate("payroll.timelineAwaitingPeriod")}
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card padding={false}>
      <CardBody>
        <PayrollPeriodTimeline periodId={periodId} onEventCountChange={onEventCountChange} />
      </CardBody>
    </Card>
  );
}
