"use client";

import type { ManualOvertimeOperationalItem } from "@/lib/payroll/manualOvertimeOverviewUtils";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { cn } from "@/lib/design-system/cn";
import { translate } from "@/lib/i18n";

interface ManualOvertimeOperationalPanelProps {
  items: ManualOvertimeOperationalItem[];
}

export function ManualOvertimeOperationalPanel({ items }: ManualOvertimeOperationalPanelProps) {
  return (
    <Card padding={false}>
      <CardBody className="p-3 sm:p-4">
        <dl
          className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5"
          aria-label={translate("payroll.manualOtOperationsAria")}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                "rounded-md border px-3 py-2",
                item.attention && "border-l-[3px]"
              )}
              style={{
                borderColor: item.attention
                  ? "var(--ds-color-warning-border)"
                  : "var(--ds-color-border)",
                borderLeftColor: item.attention ? "var(--ds-color-warning)" : undefined,
                background: item.attention
                  ? "var(--ds-color-warning-subtle)"
                  : "var(--ds-color-surface-muted)",
              }}
            >
              <dt className="text-xs font-medium" style={{ color: "var(--ds-color-text-muted)" }}>
                {item.label}
              </dt>
              <dd className="mt-0.5 flex items-start justify-between gap-2">
                <span className="text-sm leading-snug" style={{ color: "var(--ds-color-text-primary)" }}>
                  {item.value}
                </span>
                {item.attention ? (
                  <Badge variant="warning" className="shrink-0">
                    {translate("leave.review")}
                  </Badge>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      </CardBody>
    </Card>
  );
}
