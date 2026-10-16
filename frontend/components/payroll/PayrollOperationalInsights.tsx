"use client";

import type { PayrollInsightItem } from "@/lib/payroll/payrollOverviewUtils";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/design-system/cn";
import { translate } from "@/lib/i18n";

function insightVariant(tone: PayrollInsightItem["tone"]) {
  if (tone === "success") return "success" as const;
  if (tone === "warning") return "warning" as const;
  if (tone === "danger") return "danger" as const;
  if (tone === "info") return "info" as const;
  return "default" as const;
}

function isFeaturedInsight(item: PayrollInsightItem) {
  return item.id === "health-readiness";
}

interface PayrollOperationalInsightsProps {
  items: PayrollInsightItem[];
}

export function PayrollOperationalInsights({ items }: PayrollOperationalInsightsProps) {
  if (items.length === 0) return null;

  return (
    <aside aria-label={translate("payroll.operationalInsightsAria")}>
      <Card padding={false} className="xl:sticky xl:top-6">
        <CardHeader title={translate("payroll.operationalInsights")} />
        <CardBody className="space-y-2">
          {items.map((item) => {
            const featured = isFeaturedInsight(item);
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-start justify-between gap-3 rounded-lg border px-3",
                  featured ? "py-3" : "py-2"
                )}
                style={{
                  borderColor: featured
                    ? "var(--ds-color-border-strong, var(--ds-color-border))"
                    : "var(--ds-color-border)",
                  background: featured ? "var(--ds-color-surface-muted)" : "transparent",
                }}
              >
                <span
                  className={cn("text-xs", featured ? "font-semibold" : "font-medium")}
                  style={{
                    color: featured
                      ? "var(--ds-color-text-primary)"
                      : "var(--ds-color-text-muted)",
                  }}
                >
                  {item.label}
                </span>
                <Badge variant={insightVariant(item.tone)}>{item.value}</Badge>
              </div>
            );
          })}
        </CardBody>
      </Card>
    </aside>
  );
}
