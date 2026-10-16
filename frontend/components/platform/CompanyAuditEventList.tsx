"use client";

import Link from "next/link";
import { getAuditActionLabel } from "@/lib/audit/auditActionLabels";
import {
  categorizeAuditEvent,
  getAuditCategoryMeta,
} from "@/lib/audit/auditCategories";
import { presentAuditLog } from "@/lib/audit/auditPresentation";
import type { PlatformAuditLog } from "@/lib/api/platform.api";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  formatBusinessDateTime,
  formatRelativeTimeAgo,
} from "@/lib/utils/businessDateTime";
import { translate } from "@/lib/i18n";

type Props = {
  logs: PlatformAuditLog[];
  businessTz?: string;
  compact?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function CompanyAuditEventList({
  logs,
  businessTz = "Africa/Accra",
  compact = false,
  emptyTitle = translate("platform.noCompanyActivityYet"),
  emptyDescription = translate("platform.companyActivityWillAppear"),
}: Props) {
  if (!logs.length) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        compact={compact}
      />
    );
  }

  return (
    <div className={compact ? "space-y-2" : "overflow-x-auto"}>
      {compact ? (
        <ul className="space-y-2">
          {logs.map((log) => {
            const presented = presentAuditLog({
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
            });
            const category = getAuditCategoryMeta(
              categorizeAuditEvent(log.action, log.entity_type)
            );
            const Icon = category.icon;
            const exact = formatBusinessDateTime(log.created_at, businessTz);
            return (
              <li
                key={log.id}
                className="flex items-start gap-3 rounded-lg border p-3"
                style={{ borderColor: "var(--border-soft)" }}
              >
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: "var(--surface-muted)", color: "var(--text-muted)" }}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  <span className="sr-only">{category.label}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {getAuditActionLabel(log.action)}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    {log.actor_name?.trim() || log.actor_email?.trim() || translate("audit.unknownActor")}
                    {presented.detail ? ` · ${presented.detail}` : ""}
                  </p>
                </div>
                <Tooltip content={exact}>
                  <span
                    className="shrink-0 whitespace-nowrap text-xs"
                    style={{ color: "var(--text-muted)" }}
                    tabIndex={0}
                  >
                    {formatRelativeTimeAgo(log.created_at)}
                  </span>
                </Tooltip>
              </li>
            );
          })}
        </ul>
      ) : (
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr
              className="border-b text-xs uppercase tracking-wide"
              style={{ borderColor: "var(--ds-color-border)", color: "var(--text-muted)" }}
            >
              <th className="px-3 py-2.5 font-medium">{translate("platform.time")}</th>
              <th className="px-3 py-2.5 font-medium">{translate("platform.actor")}</th>
              <th className="px-3 py-2.5 font-medium">{translate("platform.category")}</th>
              <th className="px-3 py-2.5 font-medium">{translate("platform.action")}</th>
              <th className="px-3 py-2.5 font-medium">{translate("platform.resource")}</th>
              <th className="px-3 py-2.5 font-medium">{translate("attendance.status")}</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const presented = presentAuditLog({
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
              });
              const category = getAuditCategoryMeta(
                categorizeAuditEvent(log.action, log.entity_type)
              );
              const Icon = category.icon;
              return (
                <tr
                  key={log.id}
                  className="border-b"
                  style={{ borderColor: "var(--ds-color-border)" }}
                >
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <Tooltip content={formatBusinessDateTime(log.created_at, businessTz)}>
                      <span tabIndex={0} style={{ color: "var(--text-primary)" }}>
                        {formatRelativeTimeAgo(log.created_at)}
                      </span>
                    </Tooltip>
                  </td>
                  <td className="px-3 py-2.5" style={{ color: "var(--text-primary)" }}>
                    {log.actor_name?.trim() || log.actor_email?.trim() || translate("audit.unknown")}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {category.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5" style={{ color: "var(--text-primary)" }}>
                    {getAuditActionLabel(log.action)}
                  </td>
                  <td className="max-w-[200px] truncate px-3 py-2.5" style={{ color: "var(--text-primary)" }}>
                    {presented.targetLabel}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge variant="info">{translate("platform.logged")}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {!compact && logs.length > 0 ? (
        <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
          Showing company-scoped events.{" "}
          <Link
            href="/platform/audit"
            className="font-medium underline-offset-2 hover:underline"
            style={{ color: "var(--ds-color-primary)" }}
          >
            Open Platform Audit Center
          </Link>
        </p>
      ) : null}
    </div>
  );
}
