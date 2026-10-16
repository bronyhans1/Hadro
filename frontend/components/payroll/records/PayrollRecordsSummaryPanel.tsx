"use client";

import type { PayrollRecordsSummaryItem } from "@/lib/payroll/payrollRecordsOverviewUtils";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { translate } from "@/lib/i18n";

interface PayrollRecordsSummaryPanelProps {
  items: PayrollRecordsSummaryItem[];
}

export function PayrollRecordsSummaryPanel({ items }: PayrollRecordsSummaryPanelProps) {
  return (
    <Card padding={false} className="h-fit">
      <CardHeader title={translate("payroll.payrollSummary")} />
      <CardBody>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label={translate("payroll.payrollSummaryAria")}>
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border px-4 py-3"
              style={{
                borderColor: "var(--ds-color-border)",
                background: "var(--ds-color-surface-muted)",
              }}
            >
              <p className="text-sm font-medium" style={{ color: "var(--ds-color-text-primary)" }}>
                {item.label}
              </p>
              <p className="mt-0.5 text-sm tabular-nums" style={{ color: "var(--ds-color-text-muted)" }}>
                {item.value}
              </p>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
