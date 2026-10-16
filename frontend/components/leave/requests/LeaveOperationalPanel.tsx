"use client";

import type { LeaveOperationalItem } from "@/lib/leave/leaveRequestsUtils";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { translate } from "@/lib/i18n";
import { cn } from "@/lib/design-system/cn";

interface LeaveOperationalPanelProps {
  items: LeaveOperationalItem[];
}

export function LeaveOperationalPanel({ items }: LeaveOperationalPanelProps) {
  return (
    <Card padding={false} className="h-fit">
      <CardHeader title={translate("leave.operationalPanel")} />
      <CardBody>
        <ul className="space-y-2" role="list" aria-label={translate("leave.operationsSummaryAria")}>
          {items.map((item) => (
            <li
              key={item.id}
              className={cn(
                "rounded-lg border px-4 py-3",
                item.attention && "border-l-[3px]"
              )}
              style={{
                borderColor: item.attention ? "var(--ds-color-warning-border)" : "var(--ds-color-border)",
                borderLeftColor: item.attention ? "var(--ds-color-warning)" : undefined,
                background: item.attention ? "var(--ds-color-warning-subtle)" : "var(--ds-color-surface-muted)",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--ds-color-text-primary)" }}>
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
                    {item.value}
                  </p>
                </div>
                {item.attention ? <Badge variant="warning">{translate("leave.review")}</Badge> : null}
              </div>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
