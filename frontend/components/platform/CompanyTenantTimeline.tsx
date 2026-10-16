"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tooltip } from "@/components/ui/Tooltip";
import type { CompanyTimelineItem } from "@/lib/platform/companyWorkspace";
import {
  formatBusinessDateTime,
  formatRelativeTimeAgo,
} from "@/lib/utils/businessDateTime";
import { Building2 } from "lucide-react";
import { translate } from "@/lib/i18n";

type Props = {
  items: CompanyTimelineItem[];
  recentFeed: ReactNode;
  businessTz?: string;
};

export function CompanyTenantTimeline({ items, recentFeed, businessTz }: Props) {
  const hasAnyDate = items.some((i) => i.at);

  return (
    <div className="space-y-6">
      <Card title={translate("platform.companyTimeline")}>
        <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
          {translate("platform.lifecycleHelp")}
        </p>
        {!hasAnyDate ? (
          <EmptyState
            title={translate("platform.noTimelineYet")}
            description={translate("platform.timelineWillAppear")}
            icon={<Building2 className="h-5 w-5" />}
            compact
          />
        ) : (
          <ol className="relative space-y-0 border-l pl-5" style={{ borderColor: "var(--border-soft)" }}>
            {items.map((item) => (
              <li key={item.id} className="relative pb-5 last:pb-0">
                <span
                  className="absolute -left-[1.4rem] top-1 flex h-3 w-3 rounded-full border-2"
                  style={{
                    borderColor: "var(--ds-color-primary)",
                    background: item.at ? "var(--ds-color-primary)" : "var(--ds-color-surface)",
                  }}
                  aria-hidden
                />
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {item.label}
                </p>
                {item.at ? (
                  <Tooltip content={formatBusinessDateTime(item.at, businessTz)}>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }} tabIndex={0}>
                      {formatRelativeTimeAgo(item.at)}
                    </p>
                  </Tooltip>
                ) : (
                  <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    Not recorded yet
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card title={translate("platform.recentActivityFeed")}>{recentFeed}</Card>
    </div>
  );
}
