"use client";

import { Activity, Inbox } from "lucide-react";
import type { TimelineEvent } from "@/lib/api/timeline.api";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatBusinessFriendlyDateTime } from "@/lib/utils/businessDateTime";
import { presentPayrollTimelineEvent, presentTimelineModule, translate } from "@/lib/i18n";

interface DashboardRecentActivityProps {
  events: TimelineEvent[];
  loading?: boolean;
  error?: string | null;
  businessTimeZone: string;
}

function eventBadgeVariant(
  eventType: string
): "info" | "success" | "warning" | "neutral" | "approved" | "locked" | "draft" | "pending" | "closed" {
  const t = eventType.toLowerCase();
  if (t.includes("approved")) return "approved";
  if (t.includes("locked")) return "locked";
  if (t.includes("closed")) return "closed";
  if (t.includes("submitted") || t.includes("review")) return "pending";
  if (t.includes("reopen")) return "warning";
  if (t.includes("created")) return "info";
  return "neutral";
}

export function DashboardRecentActivity({
  events,
  loading,
  error,
  businessTimeZone,
}: DashboardRecentActivityProps) {
  return (
    <Card padding={false}>
      <CardHeader title={translate("dashboard.recentActivity")} />
      <CardBody>
        {loading ? (
          <div className="space-y-3" aria-busy aria-label={translate("dashboard.loadingActivity")}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            title={translate("dashboard.unableLoadWidget")}
            description={error}
            icon={<Inbox className="h-5 w-5" />}
          />
        ) : events.length === 0 ? (
          <EmptyState
            title={translate("dashboard.noRecentActivity")}
            description={translate("dashboard.timelineWillAppear")}
            icon={<Inbox className="h-5 w-5" />}
          />
        ) : (
          <ul className="space-y-3" role="list">
            {events.map((event) => {
              const copy = presentPayrollTimelineEvent(event);
              return (
              <li
                key={event.id}
                className="rounded-xl border px-4 py-3.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                style={{ borderColor: "var(--ds-color-border)", background: "var(--ds-color-surface)" }}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-xl"
                        style={{
                          background: "rgba(37, 99, 235, 0.08)",
                          color: "var(--ds-color-primary)",
                        }}
                        aria-hidden
                      >
                        <Activity className="h-4 w-4" />
                      </span>
                      <p className="text-sm font-semibold" style={{ color: "var(--ds-color-text-primary)" }}>
                        {copy.title}
                      </p>
                      <Badge variant={eventBadgeVariant(event.event_type)}>{presentTimelineModule(event.module)}</Badge>
                    </div>
                    <p className="mt-1 text-sm" style={{ color: "var(--ds-color-text-secondary)" }}>
                      {copy.description}
                    </p>
                    <p className="mt-1 ds-caption">
                      {event.performed_by_name ?? translate("dashboard.systemActor")}
                    </p>
                  </div>
                  <time
                    className="whitespace-nowrap ds-caption tabular-nums"
                    style={{ color: "var(--ds-color-text-muted)" }}
                    dateTime={event.occurred_at}
                  >
                    {formatBusinessFriendlyDateTime(event.occurred_at, businessTimeZone)}
                  </time>
                </div>
              </li>
              );
            })}
          </ul>
        )}
      </CardBody>
      <CardFooter>
        <p className="ds-caption">
          {translate("dashboard.newestEventsFirst")}
        </p>
      </CardFooter>
    </Card>
  );
}
