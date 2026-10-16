"use client";

import type { ReactNode } from "react";
import { Copy, ExternalLink, Mail, KeyRound } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import type { PlatformCompanyListItem } from "@/lib/api/platform.api";
import { CompanyLogoMark } from "@/components/company/CompanyLogoMark";
import {
  branchUsageLabel,
  companyStatusBadgeVariant,
  companyStatusLabel,
  lifecycleBadgeVariant,
  lifecycleLabel,
  mapStatusToLifecycle,
  platformStatusLabel,
} from "@/lib/platform/companyWorkspace";
import { translate } from "@/lib/i18n";
import {
  formatBusinessDateTime,
  formatRelativeTimeAgo,
} from "@/lib/utils/businessDateTime";

function SummaryCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Card padding={false}>
      <CardBody className="p-4">
        <div className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
          {label}
        </div>
        <div className="mt-2 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          {value}
        </div>
      </CardBody>
    </Card>
  );
}

function MetricRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b py-2.5 last:border-0" style={{ borderColor: "var(--border-soft)" }}>
      <span className="text-sm" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <span className="text-right text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

type Props = {
  company: PlatformCompanyListItem;
  businessTz: string;
  lastActivityAt: string | null;
  recentActivity: ReactNode;
  onViewActivity: () => void;
  onCopyAdminEmail: () => void;
  onOpenPortal: () => void;
  onResetPassword: () => void;
  onContactAdmin: () => void;
};

export function CompanyOpsOverview({
  company,
  businessTz,
  lastActivityAt,
  recentActivity,
  onViewActivity,
  onCopyAdminEmail,
  onOpenPortal,
  onResetPassword,
  onContactAdmin,
}: Props) {
  const lifecycle = mapStatusToLifecycle(company.status);
  const adminEmail = company.admin_emails?.[0]?.trim() || "";
  const adminLabel = adminEmail || "—";
  const adminName = company.administrator_name?.trim() || "";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CompanyLogoMark
          name={company.company_name}
          logoUrl={company.logo_url}
          initials={company.initials}
          size="lg"
        />
        <div className="min-w-0">
          <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            {company.company_name}
          </p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {company.location_label?.trim() || company.industry?.trim() || company.company_code}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label={translate("platform.companyStatus")}
          value={
            <Badge variant={companyStatusBadgeVariant(company.status)}>
              {companyStatusLabel(company.status)}
            </Badge>
          }
        />
        <SummaryCard
          label={translate("platform.createdDate")}
          value={
            company.created_at ? formatBusinessDateTime(company.created_at, businessTz) : "—"
          }
        />
        <SummaryCard label={translate("platform.companyCode")} value={company.company_code} />
        <SummaryCard
          label={translate("platform.administrator")}
          value={
            <div className="min-w-0">
              {adminName ? <div className="truncate">{adminName}</div> : null}
              <div className={`truncate ${adminName ? "text-sm font-normal" : ""}`} style={adminName ? { color: "var(--text-muted)" } : undefined}>
                {adminLabel}
              </div>
            </div>
          }
        />
        <SummaryCard label={translate("branches.branchUsage")} value={branchUsageLabel(company)} />
        <SummaryCard
          label={translate("platform.departmentCount")}
          value={<span className="text-sm font-normal" style={{ color: "var(--text-muted)" }}>—</span>}
        />
        <SummaryCard
          label={translate("platform.userCount")}
          value={<span className="text-sm font-normal" style={{ color: "var(--text-muted)" }}>—</span>}
        />
        <SummaryCard
          label={translate("platform.lastActivity")}
          value={
            lastActivityAt ? (
              <Tooltip content={formatBusinessDateTime(lastActivityAt, businessTz)}>
                <span tabIndex={0}>{formatRelativeTimeAgo(lastActivityAt)}</span>
              </Tooltip>
            ) : (
              translate("platform.noActivityYet")
            )
          }
        />
        <SummaryCard label={translate("platform.platformStatus")} value={platformStatusLabel(company.status)} />
        <SummaryCard
          label={translate("platform.storage")}
          value={<span className="text-sm font-normal" style={{ color: "var(--text-muted)" }}>{translate("platform.comingSoon")}</span>}
        />
        <SummaryCard
          label={translate("platform.subscription")}
          value={<span className="text-sm font-normal" style={{ color: "var(--text-muted)" }}>{translate("platform.comingSoon")}</span>}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title={translate("platform.lifecycle")}>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {translate("platform.lifecycleHelp")}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant={lifecycleBadgeVariant(lifecycle)}>{lifecycleLabel(lifecycle)}</Badge>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(["active", "suspended", "archived", "pending_activation"] as const).map((state) => {
              const active = state === lifecycle;
              return (
                <div
                  key={state}
                  className="rounded-lg border px-2.5 py-2 text-center text-xs font-medium"
                  style={{
                    borderColor: active ? "var(--ds-color-primary)" : "var(--border-soft)",
                    background: active
                      ? "color-mix(in srgb, var(--ds-color-primary) 8%, transparent)"
                      : "var(--surface-muted)",
                    color: active ? "var(--text-primary)" : "var(--text-muted)",
                  }}
                >
                  {lifecycleLabel(state)}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
            {translate("platform.lifecycleFuture")}
          </p>
        </Card>

        <Card title={translate("platform.supportCard")}>
          <div className="space-y-1">
            <MetricRow label={translate("platform.primaryAdministrator")} value={adminLabel} />
            <MetricRow label={translate("platform.administratorEmail")} value={adminEmail || "—"} />
            <MetricRow
              label={translate("platform.lastLogin")}
              value={
                <span style={{ color: "var(--text-muted)" }}>{translate("platform.notAvailable")}</span>
              }
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              leftIcon={<Copy className="h-3.5 w-3.5" aria-hidden />}
              disabled={!adminEmail}
              onClick={onCopyAdminEmail}
            >
              {translate("platform.copyAdminEmail")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              leftIcon={<ExternalLink className="h-3.5 w-3.5" aria-hidden />}
              onClick={onOpenPortal}
            >
              {translate("platform.openCompanyPortal")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              leftIcon={<KeyRound className="h-3.5 w-3.5" aria-hidden />}
              onClick={onResetPassword}
            >
              {translate("platform.resetAdminPassword")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              leftIcon={<Mail className="h-3.5 w-3.5" aria-hidden />}
              onClick={onContactAdmin}
            >
              {translate("platform.contactAdministrator")}
            </Button>
          </div>
        </Card>

        <Card title={translate("platform.platformLimits")}>
          <p className="mb-2 text-sm" style={{ color: "var(--text-muted)" }}>
            {translate("platform.readOnlyControls")}
          </p>
          <MetricRow
            label={translate("branches.branchLimit")}
            value={company.branch_limit === null ? translate("branches.unlimited") : String(company.branch_limit)}
          />
          <MetricRow label={translate("branches.currentBranches")} value={String(company.branches_count)} />
          <MetricRow
            label={translate("navigation.employees")}
            value={translate("platform.employeesCountValue", {
              values: { count: String(company.employees_count ?? 0) },
            })}
          />
          <MetricRow label={translate("platform.industry")} value={company.industry?.trim() || "—"} />
          <MetricRow label={translate("platform.location")} value={company.location_label?.trim() || "—"} />
          <MetricRow label={translate("platform.departmentCount")} value="—" />
          <MetricRow label={translate("platform.storage")} value={translate("platform.future")} />
        </Card>

        <Card title={translate("platform.subscription")}>
          <p className="mb-2 text-sm" style={{ color: "var(--text-muted)" }}>
            {translate("platform.billingFuture")}
          </p>
          <MetricRow label={translate("platform.currentPlan")} value={company.plan?.trim() || translate("platform.standardPlan")} />
          <MetricRow
            label={translate("platform.planOptions")}
            value={
              <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                {translate("platform.planOptionsValue")}
              </span>
            }
          />
          <MetricRow
            label={translate("attendance.status")}
            value={<Badge variant="info">{translate("attendance.active")}</Badge>}
          />
          <MetricRow
            label={translate("platform.renewal")}
            value={
              <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                {translate("platform.futureImplementation")}
              </span>
            }
          />
        </Card>
      </div>

      <Card title={translate("dashboard.recentActivity")}>
        {recentActivity}
        <div className="mt-4">
          <Button type="button" variant="secondary" size="sm" onClick={onViewActivity}>
            {translate("platform.viewCompanyTimeline")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
