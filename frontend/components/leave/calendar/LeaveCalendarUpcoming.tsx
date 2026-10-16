"use client";

import type { LeaveUpcomingGroup } from "@/lib/leave/leaveCalendarUtils";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { translate } from "@/lib/i18n";

interface LeaveCalendarUpcomingProps {
  groups: LeaveUpcomingGroup[];
}

export function LeaveCalendarUpcoming({ groups }: LeaveCalendarUpcomingProps) {
  return (
    <Card padding={false}>
      <CardHeader title={translate("leave.upcomingLeaveTitle")} />
      <CardBody className="space-y-5">
        {groups.map((group) => (
          <div key={group.id}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--ds-color-text-primary)" }}>
              {group.label}
            </h3>
            {group.items.length === 0 ? (
              <p className="mt-2 text-sm" style={{ color: "var(--ds-color-text-muted)" }}>
                {group.emptyLabel}
              </p>
            ) : (
              <ul className="mt-2 space-y-2" role="list">
                {group.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--ds-color-border)" }}
                  >
                    <span className="truncate font-medium" style={{ color: "var(--ds-color-text-primary)" }}>
                      {item.name}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="default">{item.leaveType}</Badge>
                      <span className="text-xs tabular-nums" style={{ color: "var(--ds-color-text-muted)" }}>
                        {item.dateLabel}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
