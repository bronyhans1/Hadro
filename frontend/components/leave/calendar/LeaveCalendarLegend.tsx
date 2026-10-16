"use client";

import { LEAVE_TYPES, LEAVE_TYPE_COLORS, leaveTypeLabel } from "@/lib/leave/leaveTypes";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { translate } from "@/lib/i18n";

export function LeaveCalendarLegend() {
  return (
    <Card padding={false}>
      <CardHeader title={translate("leave.legend")} />
      <CardBody>
        <ul className="flex flex-wrap gap-3" role="list" aria-label={translate("leave.leaveTypeLegend")}>
          {LEAVE_TYPES.map((type) => {
            const colors = LEAVE_TYPE_COLORS[type.value];
            return (
              <li key={type.value} className="flex items-center gap-2 text-sm">
                <span
                  className="h-3 w-3 shrink-0 rounded-sm border"
                  style={{
                    background: colors.bg,
                    borderColor: colors.border,
                  }}
                  aria-hidden
                />
                <span style={{ color: "var(--ds-color-text-primary)" }}>{leaveTypeLabel(type.value)}</span>
              </li>
            );
          })}
        </ul>
      </CardBody>
    </Card>
  );
}
