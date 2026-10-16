"use client";

import type { LeaveBalanceAnalyticsItem } from "@/lib/leave/leaveBalanceUtils";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { translate } from "@/lib/i18n";

interface LeaveBalanceAnalyticsProps {
  items: LeaveBalanceAnalyticsItem[];
}

export function LeaveBalanceAnalytics({ items }: LeaveBalanceAnalyticsProps) {
  return (
    <Card padding={false}>
      <CardHeader title={translate("leave.leaveAnalytics")} />
      <CardBody>
        <ul className="space-y-3" role="list" aria-label={translate("leave.leaveAnalyticsAria")}>
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-1 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              style={{ borderColor: "var(--ds-color-border)", background: "var(--ds-color-surface-muted)" }}
            >
              <span className="text-sm font-medium" style={{ color: "var(--ds-color-text-primary)" }}>
                {item.label}
              </span>
              <span className="text-sm" style={{ color: "var(--ds-color-text-secondary)" }}>
                {item.value}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
          Analytics are derived from your current balance and leave request records. Leave trend charts
          are not shown because historical time-series data is not available from the existing APIs.
        </p>
      </CardBody>
    </Card>
  );
}
