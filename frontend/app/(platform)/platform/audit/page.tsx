"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { MainContent } from "@/components/layout/MainContent";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Drawer } from "@/components/ui/Drawer";
import { Input, Select, DateInput } from "@/components/ui/FormControls";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton, SkeletonCard, SkeletonTable } from "@/components/ui/Skeleton";
import { Tooltip } from "@/components/ui/Tooltip";
import { useAuth } from "@/lib/auth/AuthContext";
import * as platformApi from "@/lib/api/platform.api";
import type { PlatformAuditLog } from "@/lib/api/platform.api";
import { isApiError } from "@/lib/types/api";
import { safeApi } from "@/lib/api/safeApi";
import { toUserFacingApiError } from "@/lib/api/userFacingError";
import {
  parseAuditMetadata,
  presentAuditLog,
} from "@/lib/audit/auditPresentation";
import { getAuditActionLabel } from "@/lib/audit/auditActionLabels";
import { highlightSearchMatch } from "@/lib/audit/highlightSearchMatch";
import {
  AUDIT_CATEGORIES,
  categorizeAuditEvent,
  getAuditCategoryMeta,
  type AuditCategoryId,
} from "@/lib/audit/auditCategories";
import {
  formatBusinessDateTime,
  formatRelativeTimeAgo,
} from "@/lib/utils/businessDateTime";
import { translate } from "@/lib/i18n";

type SortOrder = "newest" | "oldest";

type PresentedRow = PlatformAuditLog & {
  categoryId: AuditCategoryId;
  categoryLabel: string;
  actionLabel: string;
  resourceLabel: string;
  detail: string | null;
  actorLabel: string;
  searchBlob: string;
};

type TimelineGroupId = "today" | "yesterday" | "earlier_week" | "last_week" | "older";

function timelineLabel(id: TimelineGroupId): string {
  switch (id) {
    case "today":
      return translate("attendance.today");
    case "yesterday":
      return translate("attendance.yesterday");
    case "earlier_week":
      return translate("audit.earlierThisWeek");
    case "last_week":
      return translate("audit.lastWeek");
    case "older":
      return translate("audit.older");
  }
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function timelineGroupId(iso: string, now = new Date()): TimelineGroupId {
  const ts = new Date(iso);
  if (Number.isNaN(ts.getTime())) return "older";
  const today = startOfLocalDay(now);
  const eventDay = startOfLocalDay(ts);
  const diffDays = Math.round((today.getTime() - eventDay.getTime()) / 86_400_000);
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "yesterday";
  const dayOfWeek = today.getDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  if (diffDays <= daysSinceMonday) return "earlier_week";
  if (diffDays <= daysSinceMonday + 7) return "last_week";
  return "older";
}

function actorDisplay(log: PlatformAuditLog): string {
  const name = log.actor_name?.trim();
  const email = log.actor_email?.trim();
  if (name && email) return `${name} (${email})`;
  return name || email || translate("audit.unknownActor");
}

function formatMetaValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const t = value.trim();
    return t || null;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function pickMetaField(meta: Record<string, unknown> | null, keys: string[]): string | null {
  if (!meta) return null;
  for (const key of keys) {
    if (key in meta) {
      const formatted = formatMetaValue(meta[key]);
      if (formatted) return formatted;
    }
  }
  return null;
}

function extractOldNewValues(meta: Record<string, unknown> | null): {
  oldValue: string | null;
  newValue: string | null;
} {
  return {
    oldValue: pickMetaField(meta, ["old_value", "previous_value", "before", "previous", "old"]),
    newValue: pickMetaField(meta, ["new_value", "after", "next_value", "new"]),
  };
}

function referenceId(log: PlatformAuditLog, meta: Record<string, unknown> | null): string | null {
  const fromMeta = pickMetaField(meta, ["reference_id", "ref_id", "request_id", "correlation_id"]);
  if (fromMeta) return fromMeta;
  const entity = typeof log.entity_id === "string" ? log.entity_id.trim() : "";
  return entity || null;
}

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div className="break-words text-sm whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>
        {value}
      </div>
    </div>
  );
}

function RelativeTimestamp({
  iso,
  businessTz,
}: {
  iso: string;
  businessTz: string;
}) {
  const exact = formatBusinessDateTime(iso, businessTz);
  const relative = formatRelativeTimeAgo(iso);
  return (
    <Tooltip content={exact}>
      <span className="whitespace-nowrap text-sm" style={{ color: "var(--text-primary)" }} tabIndex={0}>
        {relative}
      </span>
    </Tooltip>
  );
}

function AuditCenterSkeleton() {
  return (
    <div className="space-y-6" aria-busy aria-label={translate("audit.loadingAuditActivity")}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} className="min-h-[96px]" />
        ))}
      </div>
      <Card title={translate("audit.searchAndFilters")}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="mb-2 h-3 w-20" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      </Card>
      <SkeletonTable rows={8} cols={8} />
    </div>
  );
}

export default function PlatformAuditCenterPage() {
  const { user, isLoading: authLoading } = useAuth();
  const businessTz = user?.businessTimeZone ?? "Africa/Accra";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<PlatformAuditLog[]>([]);

  const [search, setSearch] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [actionType, setActionType] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [actorFilter, setActorFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await safeApi(platformApi.getPlatformAuditLogs(500));
      if (isApiError(res)) {
        setError(res.error);
        setLogs([]);
      } else {
        setLogs(res.data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : translate("audit.failedLoadLogs"));
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    load();
  }, [authLoading, load]);

  const presentedRows = useMemo<PresentedRow[]>(() => {
    return logs.map((log) => {
      const asAudit = {
        id: log.id,
        company_id: log.company_id,
        actor_id: log.actor_id,
        actor_name: log.actor_name,
        actor_email: log.actor_email,
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        metadata: log.metadata,
        created_at: log.created_at,
      };
      const presented = presentAuditLog(asAudit);
      const catId = categorizeAuditEvent(log.action, log.entity_type);
      const cat = getAuditCategoryMeta(catId);
      const actorLabel = actorDisplay(log);
      const companyName = log.company_name?.trim() || translate("audit.unknownCompany");
      const actionLabel = getAuditActionLabel(log.action);
      const searchBlob = [
        companyName,
        actorLabel,
        actionLabel,
        presented.actionLabel,
        presented.targetLabel,
        presented.detail ?? "",
        cat.label,
      ]
        .join(" ")
        .toLowerCase();

      return {
        ...log,
        categoryId: catId,
        categoryLabel: cat.label,
        actionLabel,
        resourceLabel: presented.targetLabel,
        detail: presented.detail,
        actorLabel,
        searchBlob,
      };
    });
  }, [logs]);

  const companyOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of presentedRows) {
      if (!map.has(row.company_id)) {
        map.set(row.company_id, row.company_name?.trim() || translate("audit.unknownCompany"));
      }
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [presentedRows]);

  const actionOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of presentedRows) {
      if (!map.has(row.action)) map.set(row.action, getAuditActionLabel(row.action));
    }
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [presentedRows]);

  const actorOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of presentedRows) {
      const key = row.actor_id || row.actorLabel;
      if (!map.has(key)) map.set(key, row.actorLabel);
    }
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [presentedRows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromMs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toMs = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;

    let rows = presentedRows.filter((row) => {
      if (q && !row.searchBlob.includes(q)) return false;
      if (companyId && row.company_id !== companyId) return false;
      if (actionType && row.action !== actionType) return false;
      if (categoryId && row.categoryId !== categoryId) return false;
      if (actorFilter) {
        const key = row.actor_id || row.actorLabel;
        if (key !== actorFilter) return false;
      }
      const ts = new Date(row.created_at).getTime();
      if (fromMs != null && !Number.isNaN(fromMs) && (Number.isNaN(ts) || ts < fromMs)) return false;
      if (toMs != null && !Number.isNaN(toMs) && (Number.isNaN(ts) || ts > toMs)) return false;
      return true;
    });

    rows = [...rows].sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? tb - ta : ta - tb;
    });

    return rows;
  }, [
    presentedRows,
    search,
    companyId,
    actionType,
    categoryId,
    actorFilter,
    dateFrom,
    dateTo,
    sortOrder,
  ]);

  const summary = useMemo(() => {
    const total = presentedRows.length;
    const todayStart = startOfLocalDay(new Date()).getTime();
    const todayCount = presentedRows.filter((r) => {
      const t = new Date(r.created_at).getTime();
      return !Number.isNaN(t) && t >= todayStart;
    }).length;
    const companiesWithActivity = new Set(presentedRows.map((r) => r.company_id)).size;
    const mostRecent = presentedRows.reduce<PresentedRow | null>((best, row) => {
      if (!best) return row;
      return new Date(row.created_at).getTime() > new Date(best.created_at).getTime() ? row : best;
    }, null);
    return { total, todayCount, companiesWithActivity, mostRecent };
  }, [presentedRows]);

  const groupedRows = useMemo(() => {
    const order: TimelineGroupId[] = ["today", "yesterday", "earlier_week", "last_week", "older"];
    const buckets = new Map<TimelineGroupId, PresentedRow[]>();
    for (const id of order) buckets.set(id, []);
    for (const row of filteredRows) {
      const gid = timelineGroupId(row.created_at);
      buckets.get(gid)!.push(row);
    }
    return order
      .map((id) => ({ id, label: timelineLabel(id), rows: buckets.get(id) ?? [] }))
      .filter((g) => g.rows.length > 0);
  }, [filteredRows]);

  const selectedRow = useMemo(
    () =>
      selectedId
        ? filteredRows.find((r) => r.id === selectedId) ??
          presentedRows.find((r) => r.id === selectedId) ??
          null
        : null,
    [selectedId, filteredRows, presentedRows]
  );

  const selectedMeta = useMemo(
    () => (selectedRow ? parseAuditMetadata(selectedRow.metadata) : null),
    [selectedRow]
  );

  const selectedOldNew = useMemo(() => extractOldNewValues(selectedMeta), [selectedMeta]);

  const clearFilters = () => {
    setSearch("");
    setCompanyId("");
    setActionType("");
    setCategoryId("");
    setDateFrom("");
    setDateTo("");
    setActorFilter("");
    setSortOrder("newest");
  };

  const hasActiveFilters =
    Boolean(search.trim()) ||
    Boolean(companyId) ||
    Boolean(actionType) ||
    Boolean(categoryId) ||
    Boolean(dateFrom) ||
    Boolean(dateTo) ||
    Boolean(actorFilter) ||
    sortOrder !== "newest";

  const searchQuery = search.trim();

  if (authLoading || loading) {
    return (
      <MainContent
        title={translate("audit.platformAuditCenter")}
        subtitle={translate("audit.platformAuditSubtitle")}
      >
        <AuditCenterSkeleton />
      </MainContent>
    );
  }

  if (error) {
    return (
      <MainContent
        title={translate("audit.platformAuditCenter")}
        subtitle={translate("audit.platformAuditSubtitle")}
      >
        <ErrorState message={toUserFacingApiError(error)} onRetry={load} />
      </MainContent>
    );
  }

  if (presentedRows.length === 0) {
    return (
      <MainContent
        title={translate("audit.platformAuditCenter")}
        subtitle={translate("audit.platformAuditSubtitle")}
      >
        <EmptyState
          title={translate("audit.noAuditYet")}
          description={translate("audit.auditWillAppear")}
          action={
            <Link href="/platform/dashboard">
              <Button type="button">{translate("common.returnToDashboard")}</Button>
            </Link>
          }
        />
      </MainContent>
    );
  }

  return (
    <MainContent
      title={translate("audit.platformAuditCenter")}
      subtitle={translate("audit.platformAuditSubtitle")}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: translate("audit.totalEvents"), value: String(summary.total) },
            { label: translate("audit.todaysEvents"), value: String(summary.todayCount) },
            { label: translate("audit.companiesWithActivity"), value: String(summary.companiesWithActivity) },
            {
              label: translate("audit.mostRecentEvent"),
              value: summary.mostRecent ? (
                <RelativeTimestamp iso={summary.mostRecent.created_at} businessTz={businessTz} />
              ) : (
                "—"
              ),
            },
          ].map((card) => (
            <Card key={card.label} padding={false}>
              <CardBody className="p-4">
                <div
                  className="text-xs font-medium uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}
                >
                  {card.label}
                </div>
                <div className="mt-2 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  {card.value}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <Card title={translate("audit.searchAndFilters")}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Input
              label={translate("common.search")}
              placeholder={translate("audit.platformSearchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" aria-hidden />}
            />
            <Select label={translate("common.company")} value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
              <option value="">{translate("audit.allCompanies")}</option>
              {companyOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Select label={translate("audit.action")} value={actionType} onChange={(e) => setActionType(e.target.value)}>
              <option value="">{translate("audit.allActions")}</option>
              {actionOptions.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </Select>
            <Select
              label={translate("audit.category")}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">{translate("audit.allCategories")}</option>
              {AUDIT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {getAuditCategoryMeta(c.id).label}
                </option>
              ))}
            </Select>
            <div className="space-y-2 md:col-span-2 xl:col-span-1">
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {translate("attendance.dateRange")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <DateInput
                  aria-label={translate("audit.dateRangeStart")}
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
                <DateInput
                  aria-label={translate("audit.dateRangeEnd")}
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
            <Select label={translate("audit.actor")} value={actorFilter} onChange={(e) => setActorFilter(e.target.value)}>
              <option value="">{translate("audit.allActors")}</option>
              {actorOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </Select>
            <Select
              label={translate("audit.sort")}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            >
              <option value="newest">{translate("audit.newestFirst")}</option>
              <option value="oldest">{translate("audit.oldestFirst")}</option>
            </Select>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button type="button" variant="secondary" onClick={clearFilters} disabled={!hasActiveFilters}>
              {translate("audit.clearFilters")}
            </Button>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              {translate("audit.showingEvents", {
                values: { shown: String(filteredRows.length), total: String(presentedRows.length) },
              })}
            </span>
          </div>
        </Card>

        {filteredRows.length === 0 ? (
          <EmptyState
            title={translate("audit.noRecordsMatch")}
            description={translate("audit.tryClearingFilters")}
            action={
              <Button type="button" variant="secondary" onClick={clearFilters}>
                {translate("audit.clearFilters")}
              </Button>
            }
          />
        ) : (
          <div className="space-y-6">
            {groupedRows.map((group) => (
              <Card key={group.id} title={group.label} padding={false}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[960px] border-collapse text-left text-sm">
                    <thead>
                      <tr
                        className="border-b text-xs uppercase tracking-wide"
                        style={{ borderColor: "var(--ds-color-border)", color: "var(--text-muted)" }}
                      >
                        <th className="px-4 py-3 font-medium">{translate("audit.time")}</th>
                        <th className="px-4 py-3 font-medium">{translate("common.company")}</th>
                        <th className="px-4 py-3 font-medium">{translate("audit.actor")}</th>
                        <th className="px-4 py-3 font-medium">{translate("audit.category")}</th>
                        <th className="px-4 py-3 font-medium">{translate("audit.action")}</th>
                        <th className="px-4 py-3 font-medium">{translate("audit.resource")}</th>
                        <th className="px-4 py-3 font-medium">{translate("attendance.status")}</th>
                        <th className="px-4 py-3 font-medium">{translate("audit.details")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((row) => {
                        const Icon = getAuditCategoryMeta(row.categoryId).icon;
                        const actorName = row.actor_name?.trim() || row.actor_email?.trim() || translate("audit.unknown");
                        return (
                          <tr
                            key={row.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedId(row.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSelectedId(row.id);
                              }
                            }}
                            className="cursor-pointer border-b transition-colors hover:bg-[var(--ds-color-surface-muted)]"
                            style={{ borderColor: "var(--ds-color-border)" }}
                          >
                            <td className="px-4 py-3">
                              <RelativeTimestamp iso={row.created_at} businessTz={businessTz} />
                            </td>
                            <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>
                              {highlightSearchMatch(row.company_name?.trim() || "—", searchQuery)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                                {highlightSearchMatch(actorName, searchQuery)}
                              </div>
                              {row.actor_name?.trim() && row.actor_email?.trim() ? (
                                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                                  {highlightSearchMatch(row.actor_email, searchQuery)}
                                </div>
                              ) : null}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className="inline-flex items-center gap-1.5"
                                style={{ color: "var(--text-primary)" }}
                              >
                                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                <span className="sr-only">{row.categoryLabel}</span>
                                {row.categoryLabel}
                              </span>
                            </td>
                            <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>
                              {highlightSearchMatch(row.actionLabel, searchQuery)}
                            </td>
                            <td
                              className="max-w-[200px] truncate px-4 py-3"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {highlightSearchMatch(row.resourceLabel, searchQuery)}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="info">{translate("platform.logged")}</Badge>
                            </td>
                            <td
                              className="max-w-[260px] truncate px-4 py-3"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {row.detail
                                ? highlightSearchMatch(row.detail, searchQuery)
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Drawer
        open={Boolean(selectedRow)}
        onClose={() => setSelectedId(null)}
        title={translate("audit.auditDetail")}
        description={translate("audit.investigationView")}
        size="md"
      >
        {selectedRow ? (
          (() => {
            const Icon = getAuditCategoryMeta(selectedRow.categoryId).icon;
            return (
              <div className="space-y-5">
                <DetailField label={translate("audit.action")} value={selectedRow.actionLabel} />
                <DetailField
                  label={translate("audit.category")}
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <Icon className="h-4 w-4" aria-hidden />
                      {selectedRow.categoryLabel}
                    </span>
                  }
                />
                <DetailField
                  label={translate("common.company")}
                  value={selectedRow.company_name?.trim() || "—"}
                />
                <DetailField label={translate("audit.performedBy")} value={selectedRow.actorLabel} />
                <DetailField
                  label={translate("audit.dateAndTime")}
                  value={
                    <span>
                      {formatRelativeTimeAgo(selectedRow.created_at)}
                      <span className="mt-1 block text-xs" style={{ color: "var(--text-muted)" }}>
                        {formatBusinessDateTime(selectedRow.created_at, businessTz)}
                      </span>
                    </span>
                  }
                />
                <DetailField label={translate("audit.resource")} value={selectedRow.resourceLabel} />
                <DetailField
                  label={translate("audit.description")}
                  value={selectedRow.detail || selectedRow.actionLabel}
                />
                <DetailField label={translate("audit.oldValue")} value={selectedOldNew.oldValue} />
                <DetailField label={translate("audit.newValue")} value={selectedOldNew.newValue} />
                <DetailField
                  label={translate("audit.referenceId")}
                  value={referenceId(selectedRow, selectedMeta)}
                />
                {selectedMeta && Object.keys(selectedMeta).length > 0 ? (
                  <DetailField
                    label={translate("audit.additionalDetails")}
                    value={
                      <pre
                        className="overflow-x-auto rounded-lg border p-3 text-xs"
                        style={{
                          borderColor: "var(--ds-color-border)",
                          background: "var(--ds-color-surface-muted)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {JSON.stringify(selectedMeta, null, 2)}
                      </pre>
                    }
                  />
                ) : null}
              </div>
            );
          })()
        ) : null}
      </Drawer>
    </MainContent>
  );
}
