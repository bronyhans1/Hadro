"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { highlightSearchMatch } from "@/lib/audit/highlightSearchMatch";
import {
  auditDesktopTableClass,
  auditMobileCardsClass,
} from "@/lib/audit/auditMobileLayout";
import { getAuditCategoryMeta, type AuditCategoryId } from "@/lib/audit/auditCategories";
import { cn } from "@/lib/design-system/cn";
import { translate } from "@/lib/i18n";

export type PlatformAuditTimelineRow = {
  id: string;
  created_at: string;
  company_name?: string | null;
  actor_name?: string | null;
  actor_email?: string | null;
  categoryId: AuditCategoryId;
  categoryLabel: string;
  actionLabel: string;
  resourceLabel: string;
  detail: string | null;
};

interface PlatformAuditTimelineGroupProps {
  title: string;
  rows: PlatformAuditTimelineRow[];
  searchQuery: string;
  renderTimestamp: (iso: string) => ReactNode;
  onSelect: (id: string) => void;
}

export function PlatformAuditTimelineGroup({
  title,
  rows,
  searchQuery,
  renderTimestamp,
  onSelect,
}: PlatformAuditTimelineGroupProps) {
  return (
    <Card title={title} padding={false}>
      <div className={cn(auditDesktopTableClass(), "overflow-x-auto")}>
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
            {rows.map((row) => {
              const Icon = getAuditCategoryMeta(row.categoryId).icon;
              const actorName = row.actor_name?.trim() || row.actor_email?.trim() || translate("audit.unknown");
              return (
                <tr
                  key={row.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(row.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(row.id);
                    }
                  }}
                  className="cursor-pointer border-b transition-colors hover:bg-[var(--ds-color-surface-muted)]"
                  style={{ borderColor: "var(--ds-color-border)" }}
                >
                  <td className="px-4 py-3">{renderTimestamp(row.created_at)}</td>
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
                    <span className="inline-flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="sr-only">{row.categoryLabel}</span>
                      {row.categoryLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>
                    {highlightSearchMatch(row.actionLabel, searchQuery)}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3" style={{ color: "var(--text-primary)" }}>
                    {highlightSearchMatch(row.resourceLabel, searchQuery)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="info">{translate("platform.logged")}</Badge>
                  </td>
                  <td className="max-w-[260px] truncate px-4 py-3" style={{ color: "var(--text-muted)" }}>
                    {row.detail ? highlightSearchMatch(row.detail, searchQuery) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className={cn(auditMobileCardsClass(), "p-3")} aria-label={title}>
        <ul className="space-y-3">
          {rows.map((row) => {
            const Icon = getAuditCategoryMeta(row.categoryId).icon;
            const actorName = row.actor_name?.trim() || row.actor_email?.trim() || translate("audit.unknown");
            return (
              <li key={row.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => onSelect(row.id)}
                  className="w-full min-w-0 rounded-lg border text-left transition-colors hover:bg-[var(--ds-color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
                  style={{ borderColor: "var(--ds-color-border)" }}
                >
                  <CardBody className="space-y-3">
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold" style={{ color: "var(--ds-color-text-primary)" }}>
                          {highlightSearchMatch(row.actionLabel, searchQuery)}
                        </p>
                        <p className="mt-0.5 break-words text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
                          {renderTimestamp(row.created_at)}
                        </p>
                      </div>
                      <span
                        className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs"
                        style={{ background: "var(--ds-color-surface-muted)", color: "var(--ds-color-text-muted)" }}
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                        {row.categoryLabel}
                      </span>
                    </div>
                    <dl className="grid grid-cols-1 gap-y-2 text-xs sm:grid-cols-2 sm:gap-x-3">
                      <div className="min-w-0">
                        <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("common.company")}</dt>
                        <dd className="mt-0.5 break-words" style={{ color: "var(--ds-color-text-primary)" }}>
                          {highlightSearchMatch(row.company_name?.trim() || "—", searchQuery)}
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("audit.actor")}</dt>
                        <dd className="mt-0.5 break-words" style={{ color: "var(--ds-color-text-primary)" }}>
                          {highlightSearchMatch(actorName, searchQuery)}
                        </dd>
                      </div>
                      <div className="min-w-0 sm:col-span-2">
                        <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("audit.resource")}</dt>
                        <dd className="mt-0.5 break-words" style={{ color: "var(--ds-color-text-primary)" }}>
                          {highlightSearchMatch(row.resourceLabel, searchQuery)}
                        </dd>
                      </div>
                      <div className="min-w-0 sm:col-span-2">
                        <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("audit.details")}</dt>
                        <dd className="mt-0.5 break-words" style={{ color: "var(--ds-color-text-primary)" }}>
                          {row.detail ? highlightSearchMatch(row.detail, searchQuery) : "—"}
                        </dd>
                      </div>
                    </dl>
                  </CardBody>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </Card>
  );
}
