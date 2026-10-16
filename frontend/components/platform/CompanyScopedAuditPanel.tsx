"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, DateInput } from "@/components/ui/FormControls";
import { CompanyAuditEventList } from "@/components/platform/CompanyAuditEventList";
import type { PlatformAuditLog } from "@/lib/api/platform.api";
import { getAuditActionLabel } from "@/lib/audit/auditActionLabels";
import {
  AUDIT_CATEGORIES,
  categorizeAuditEvent,
  getAuditCategoryMeta,
} from "@/lib/audit/auditCategories";
import { translate } from "@/lib/i18n";

type Props = {
  companyName: string;
  logs: PlatformAuditLog[];
  businessTz?: string;
};

export function CompanyScopedAuditPanel({ companyName, logs, businessTz }: Props) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [actionType, setActionType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const actionOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const log of logs) {
      if (!map.has(log.action)) map.set(log.action, getAuditActionLabel(log.action));
    }
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [logs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromMs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toMs = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;

    return logs.filter((log) => {
      if (actionType && log.action !== actionType) return false;
      if (categoryId && categorizeAuditEvent(log.action, log.entity_type) !== categoryId) {
        return false;
      }
      const ts = new Date(log.created_at).getTime();
      if (fromMs != null && !Number.isNaN(fromMs) && (Number.isNaN(ts) || ts < fromMs)) return false;
      if (toMs != null && !Number.isNaN(toMs) && (Number.isNaN(ts) || ts > toMs)) return false;
      if (q) {
        const blob = [
          getAuditActionLabel(log.action),
          log.actor_name,
          log.actor_email,
          log.entity_type,
          categorizeAuditEvent(log.action, log.entity_type),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [logs, search, categoryId, actionType, dateFrom, dateTo]);

  const hasFilters =
    Boolean(search.trim()) ||
    Boolean(categoryId) ||
    Boolean(actionType) ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  function clearFilters() {
    setSearch("");
    setCategoryId("");
    setActionType("");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <Card title={translate("audit.companyAudit")} padding={false}>
      <CardBody className="space-y-4 p-4">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {translate("audit.companyAuditPrefix")}
          <span className="font-medium">{companyName}</span>
          {translate("audit.companyAuditSuffix")}
        </p>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input
            label={translate("common.search")}
            placeholder={translate("audit.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" aria-hidden />}
          />
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
          <Select label={translate("audit.action")} value={actionType} onChange={(e) => setActionType(e.target.value)}>
            <option value="">{translate("audit.allActions")}</option>
            {actionOptions.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </Select>
          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {translate("audit.dateFilter")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <DateInput
                aria-label={translate("audit.fromDate")}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <DateInput
                aria-label={translate("audit.toDate")}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" size="sm" onClick={clearFilters} disabled={!hasFilters}>
            {translate("audit.clearFilters")}
          </Button>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {translate("audit.showingEvents", {
              values: { shown: String(filtered.length), total: String(logs.length) },
            })}
          </span>
        </div>

        <CompanyAuditEventList
          logs={filtered}
          businessTz={businessTz}
          emptyTitle={translate("audit.noRecordsMatch")}
          emptyDescription={translate("platform.companyAuditFiltersEmpty")}
        />
      </CardBody>
    </Card>
  );
}
