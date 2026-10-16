"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import * as timelineApi from "@/lib/api/timeline.api";
import type { TimelineEvent } from "@/lib/api/timeline.api";
import { isApiError } from "@/lib/types/api";
import { safeApi } from "@/lib/api/safeApi";
import { toUserFacingApiError } from "@/lib/api/userFacingError";
import { formatPeriodStatusLabel } from "@/lib/payroll/payrollPeriodStatus";
import { getActiveLocale, presentPayrollTimelineEvent, translate, translateLabel } from "@/lib/i18n";

type PayrollPeriodTimelineProps = {
  periodId: string | null | undefined;
  onEventCountChange?: (count: number) => void;
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(getActiveLocale());
}

function formatStatusChip(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  const s = value.toLowerCase();
  if (
    s === "review" ||
    s === "processing" ||
    s === "approved" ||
    s === "locked" ||
    s === "closed" ||
    s === "archived" ||
    s === "draft"
  ) {
    return formatPeriodStatusLabel(s);
  }
  return value;
}

function TimelineIcon() {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border"
      style={{ borderColor: "var(--ds-color-border)", background: "var(--ds-color-surface-muted)" }}
      aria-hidden
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </span>
  );
}

function MetadataChips({ metadata }: { metadata: Record<string, unknown> | null }) {
  if (!metadata) return null;
  const reasonCode = typeof metadata.reason === "string" ? metadata.reason : "";
  const reason = reasonCode
    ? translateLabel(
        `payroll.reopenReasons.${reasonCode}`,
        typeof metadata.reason_label === "string" ? metadata.reason_label : reasonCode
      )
    : null;
  const previous = formatStatusChip(metadata.previous_status);
  const current = formatStatusChip(metadata.current_status);

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {reason ? <Badge variant="info">{translate("payroll.reasonColon")} {reason}</Badge> : null}
      {previous ? <Badge variant="default">{translate("payroll.previousColon")} {previous}</Badge> : null}
      {current ? <Badge variant="success">{translate("payroll.currentColon")} {current}</Badge> : null}
    </div>
  );
}

function TimelineEntry({ event }: { event: TimelineEvent }) {
  const actor = event.performed_by_name ?? translate("payroll.system");
  const copy = presentPayrollTimelineEvent(event);

  return (
    <li className="flex gap-3">
      <TimelineIcon />
      <div className="min-w-0 flex-1 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-sm font-semibold" style={{ color: "var(--ds-color-text-primary)" }}>
            {copy.title}
          </p>
          <time className="text-xs tabular-nums" style={{ color: "var(--ds-color-text-muted)" }} dateTime={event.occurred_at}>
            {formatTimestamp(event.occurred_at)}
          </time>
        </div>
        <p className="mt-1 text-sm" style={{ color: "var(--ds-color-text-muted)" }}>
          {copy.description}
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
          {actor}
        </p>
        <MetadataChips metadata={event.metadata} />
      </div>
    </li>
  );
}

export function PayrollPeriodTimeline({ periodId, onEventCountChange }: PayrollPeriodTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!periodId) {
      setEvents([]);
      onEventCountChange?.(0);
      return;
    }
    const entityId = periodId;
    let cancelled = false;
    async function load(id: string) {
      setLoading(true);
      setError(null);
      try {
        const res = await safeApi(timelineApi.listTimeline({
          module: "payroll",
          entity_type: "payroll_period",
          entity_id: id,
          limit: 50,
        }));
        if (cancelled) return;
        if (isApiError(res)) {
          setError(res.error);
          setEvents([]);
          onEventCountChange?.(0);
          return;
        }
        const loaded = res.data?.events ?? [];
        const sorted = [...loaded].sort(
          (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
        );
        setEvents(sorted);
        onEventCountChange?.(sorted.length);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : translate("payroll.loadingTimeline"));
          setEvents([]);
          onEventCountChange?.(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load(entityId);
    return () => {
      cancelled = true;
    };
  }, [periodId, onEventCountChange]);

  if (!periodId) return null;

  return (
    <div aria-live="polite">
      {loading ? (
        <p className="text-sm" style={{ color: "var(--ds-color-text-muted)" }}>
          {translate("payroll.periodTimeline.loading")}
        </p>
      ) : error ? (
        <p className="text-sm text-[var(--ds-color-danger-text)]">{error}</p>
      ) : events.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--ds-color-text-muted)" }}>
          {translate("payroll.periodTimeline.empty")}
        </p>
      ) : (
        <ul className="space-y-0" role="list">
          {events.map((event) => (
            <TimelineEntry key={event.id} event={event} />
          ))}
        </ul>
      )}
    </div>
  );
}
