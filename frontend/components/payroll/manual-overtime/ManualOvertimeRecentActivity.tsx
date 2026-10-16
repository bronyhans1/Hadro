"use client";

import type { ManualOvertimeActivityItem } from "@/lib/payroll/manualOvertimeOverviewUtils";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { translate } from "@/lib/i18n";

interface ManualOvertimeRecentActivityProps {
  items: ManualOvertimeActivityItem[];
}

export function ManualOvertimeRecentActivity({ items }: ManualOvertimeRecentActivityProps) {
  return (
    <Card padding={false}>
      <CardHeader title={translate("payroll.recentActivityTitle")} />
      <CardBody>
        {items.length === 0 ? (
          <EmptyState message={translate("payroll.noRecentManualOt")} />
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--ds-color-border)" }} role="list">
            {items.map((item) => (
              <li key={item.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-semibold" style={{ color: "var(--ds-color-text-primary)" }}>
                    {item.title}
                  </p>
                  {item.meta ? (
                    <span className="text-xs tabular-nums" style={{ color: "var(--ds-color-text-muted)" }}>
                      {item.meta}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm" style={{ color: "var(--ds-color-text-muted)" }}>
                  {item.description}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
