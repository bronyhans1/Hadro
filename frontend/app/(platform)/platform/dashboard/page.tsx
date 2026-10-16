"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  ClipboardList,
  Plus,
  Settings,
  Users,
  Network,
  type LucideIcon,
} from "lucide-react";
import { MainContent } from "@/components/layout/MainContent";
import { Card, CardBody } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { getActiveLocale, translate } from "@/lib/i18n";
import { toUserFacingApiError } from "@/lib/api/userFacingError";
import { Tooltip } from "@/components/ui/Tooltip";
import { PlatformHealthPanel } from "@/components/platform/PlatformHealthPanel";
import { useAuth } from "@/lib/auth/AuthContext";
import { getTimeGreeting } from "@/lib/dashboard/formatters";
import * as platformApi from "@/lib/api/platform.api";
import type { PlatformCompanyListItem, PlatformDashboardData } from "@/lib/api/platform.api";
import { safeApi } from "@/lib/api/safeApi";
import { isApiError } from "@/lib/types/api";
import { getAuditActionLabel } from "@/lib/audit/auditActionLabels";
import { categorizeAuditEvent, getAuditCategoryMeta } from "@/lib/audit/auditCategories";
import {
  formatBusinessDateTime,
  formatRelativeTimeAgo,
} from "@/lib/utils/businessDateTime";

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy aria-label={translate("platform.loadingDashboard")}>
      <SkeletonCard className="min-h-[120px]" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} className="min-h-[110px]" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} className="min-h-[160px]" />
        ))}
      </div>
      <SkeletonCard className="min-h-[140px]" />
      <div className="grid gap-6 xl:grid-cols-2">
        <SkeletonCard className="min-h-[220px]" />
        <SkeletonCard className="min-h-[220px]" />
      </div>
    </div>
  );
}

function statusBadgeVariant(status: PlatformCompanyListItem["status"]) {
  if (status === "active") return "success" as const;
  if (status === "inactive") return "neutral" as const;
  return "warning" as const;
}

function statusLabel(status: PlatformCompanyListItem["status"]) {
  if (status === "active") return translate("profile.accountStatus.active");
  if (status === "inactive") return translate("profile.accountStatus.inactive");
  return translate("profile.accountStatus.suspended");
}

export default function PlatformDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [kpisError, setKpisError] = useState<string | null>(null);
  const [companiesError, setCompaniesError] = useState<string | null>(null);
  const [data, setData] = useState<PlatformDashboardData | null>(null);
  const [companies, setCompanies] = useState<PlatformCompanyListItem[]>([]);

  async function load() {
    setLoading(true);
    setKpisError(null);
    setCompaniesError(null);
    try {
      const [dashRes, companiesRes] = await Promise.all([
        safeApi(platformApi.getPlatformDashboard()),
        safeApi(platformApi.getCompanies()),
      ]);

      if (isApiError(dashRes)) {
        setKpisError(toUserFacingApiError(dashRes.error, translate("platform.unableLoadStatistics")));
        setData(null);
      } else {
        setData(dashRes.data);
      }

      if (!isApiError(companiesRes)) {
        setCompanies(companiesRes.data ?? []);
      } else {
        setCompanies([]);
        setCompaniesError(toUserFacingApiError(companiesRes.error, translate("platform.unableLoadCompanies")));
      }
    } catch (e) {
      setKpisError(e instanceof Error ? toUserFacingApiError(e.message, translate("platform.failedLoadDashboard")) : translate("platform.failedLoadDashboard"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const firstName =
    user?.firstName?.trim() || user?.email?.split("@")[0] || "there";
  const greeting = getTimeGreeting();

  const recentCompanies = useMemo(() => {
    return [...companies]
      .sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [companies]);

  if (loading && !data && !kpisError && !companiesError) {
    return (
      <MainContent title={translate("navigation.dashboard")} subtitle={translate("platform.dashboardSubtitle")}>
        <DashboardSkeleton />
      </MainContent>
    );
  }

  const totals = data?.totals;
  const activity = data?.recent_activity ?? [];

  return (
    <MainContent>
      <div className="space-y-6">
        <header
          className="rounded-2xl border px-5 py-5 sm:px-6 sm:py-6"
          style={{
            borderColor: "var(--ds-color-border)",
            background:
              "linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(37, 99, 235, 0.02) 42%, var(--ds-color-surface) 100%)",
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Platform Console
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl" style={{ color: "var(--text-primary)" }}>
            {greeting}, {firstName}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Welcome to the HADRO Platform Console.
            <br className="hidden sm:block" />{" "}
            Manage companies, monitor activity, and administer the platform.
          </p>
        </header>

        <section aria-labelledby="platform-quick-actions">
          <h2 id="platform-quick-actions" className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Quick Actions
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <QuickAction
              href="/platform/companies/new"
              title={translate("navigation.provisionCompany")}
              description={translate("platform.createOrganization")}
              icon={Plus}
              primary
            />
            <QuickAction
              href="/platform/companies"
              title={translate("platform.manageCompanies")}
              description={translate("platform.viewAdministerTenants")}
              icon={Building2}
            />
            <QuickAction
              href="/platform/audit"
              title={translate("navigation.auditCenter")}
              description={translate("platform.investigateActivity")}
              icon={ClipboardList}
            />
            <QuickAction
              href="/platform/settings"
              title={translate("navigation.systemSettings")}
              description={translate("platform.configureSupport")}
              icon={Settings}
            />
          </div>
        </section>

        <section aria-labelledby="platform-kpis">
          <h2 id="platform-kpis" className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            {translate("platform.platformStatistics")}
          </h2>
          {kpisError && !data ? (
            <ErrorState message={kpisError} onRetry={() => void load()} />
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              <KpiGroup
                title={translate("navigation.companies")}
                icon={Building2}
                rows={[
                  { label: translate("platform.totalCompanies"), value: totals?.companies ?? 0 },
                  { label: translate("platform.activeCompanies"), value: totals?.companies_active ?? 0 },
                  { label: translate("platform.inactiveCompanies"), value: totals?.companies_inactive ?? 0 },
                ]}
              />
              <KpiGroup
                title={translate("platform.users")}
                icon={Users}
                rows={[
                  { label: translate("platform.activeUsers"), value: totals?.users_active ?? 0 },
                  { label: translate("platform.inactiveUsers"), value: totals?.users_inactive ?? 0 },
                ]}
              />
              <KpiGroup
                title={translate("platform.organization")}
                icon={Network}
                rows={[
                  { label: translate("navigation.branches"), value: totals?.branches ?? 0 },
                  { label: translate("navigation.departments"), value: totals?.departments ?? 0 },
                ]}
              />
            </div>
          )}
        </section>

        <section aria-labelledby="platform-health">
          <Card title={translate("platform.platformHealth")}>
            <h2 id="platform-health" className="sr-only">
              {translate("platform.platformHealth")}
            </h2>
            <PlatformHealthPanel
              businessTimezone={user?.businessTimeZone}
              authSessionActive={Boolean(user)}
            />
          </Card>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card title={translate("dashboard.recentActivity")}>
            {kpisError && !activity.length ? (
              <EmptyState
                title={translate("platform.unableLoadWidget")}
                description={translate("platform.activityWidgetHint")}
                compact
              />
            ) : !activity.length ? (
              <EmptyState
                title={translate("platform.noRecentActivity")}
                description={translate("platform.activityWillAppear")}
                compact
              />
            ) : (
              <ul className="space-y-2">
                {activity.map((a) => {
                  const category = getAuditCategoryMeta(
                    categorizeAuditEvent(a.action, a.entity_type)
                  );
                  const Icon = category.icon;
                  const exactTime = formatBusinessDateTime(a.created_at);
                  return (
                    <li
                      key={a.id}
                      className="flex items-start gap-3 rounded-lg border p-3"
                      style={{ borderColor: "var(--border-soft)" }}
                    >
                      <span
                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          background: "var(--surface-muted)",
                          color: "var(--text-muted)",
                        }}
                        title={category.label}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                        <span className="sr-only">{category.label}</span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {getAuditActionLabel(a.action)}
                        </p>
                        <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                          {a.company_name ?? translate("audit.unknownCompany")}
                        </p>
                      </div>
                      <Tooltip content={exactTime}>
                        <p
                          className="shrink-0 whitespace-nowrap text-xs"
                          style={{ color: "var(--text-muted)" }}
                          tabIndex={0}
                        >
                          {formatRelativeTimeAgo(a.created_at)}
                        </p>
                      </Tooltip>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title={translate("platform.recentlyAddedCompanies")} padding={false}>
            <CardBody>
              {companiesError ? (
                <EmptyState
                  title={translate("platform.unableLoadWidget")}
                  description={companiesError}
                  compact
                />
              ) : !recentCompanies.length ? (
                <EmptyState
                  title={translate("platform.noCompaniesProvisioned")}
                  description={translate("platform.provisionFirstOrg")}
                  compact
                  action={
                    <Link href="/platform/companies/new">
                      <Button type="button" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" aria-hidden />}>
                        {translate("navigation.provisionCompany")}
                      </Button>
                    </Link>
                  }
                />
              ) : (
                <div className="space-y-2">
                  {recentCompanies.map((c) => (
                    <div
                      key={c.company_id}
                      className="rounded-lg border p-3"
                      style={{ borderColor: "var(--border-soft)" }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                            {c.company_name}
                          </p>
                          <p className="mt-0.5 truncate text-xs" style={{ color: "var(--text-muted)" }}>
                            {c.admin_emails?.length ? c.admin_emails[0] : translate("platform.noAdministratorEmail")}
                          </p>
                        </div>
                        <Badge variant={statusBadgeVariant(c.status)}>{statusLabel(c.status)}</Badge>
                      </div>
                      <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                        {c.created_at ? (
                          <Tooltip content={formatBusinessDateTime(c.created_at)}>
                            <span tabIndex={0}>{translate("platform.createdRelative", { values: { when: formatRelativeTimeAgo(c.created_at) } })}</span>
                          </Tooltip>
                        ) : (
                          translate("platform.createdDateUnavailable")
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
            <div
              className="flex justify-end border-t px-4 py-3"
              style={{ borderColor: "var(--border-soft)" }}
            >
              <Link href="/platform/companies">
                <Button type="button" variant="secondary" size="sm">
                  {translate("platform.viewAllCompanies")}
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </MainContent>
  );
}

function QuickAction({
  href,
  title,
  description,
  icon: Icon,
  primary = false,
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border p-4 transition-[border-color,box-shadow,background-color]"
      style={{
        borderColor: primary ? "color-mix(in srgb, var(--ds-color-primary) 35%, var(--border-soft))" : "var(--border-soft)",
        background: primary
          ? "color-mix(in srgb, var(--ds-color-primary) 6%, var(--surface))"
          : "var(--surface)",
      }}
    >
      <span
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg"
        style={{
          background: primary
            ? "color-mix(in srgb, var(--ds-color-primary) 14%, transparent)"
            : "var(--surface-muted)",
          color: primary ? "var(--ds-color-primary)" : "var(--text-muted)",
        }}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <p className="mt-3 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        {title}
      </p>
      <p className="mt-0.5 text-xs leading-snug" style={{ color: "var(--text-muted)" }}>
        {description}
      </p>
    </Link>
  );
}

function KpiGroup({
  title,
  icon: Icon,
  rows,
}: {
  title: string;
  icon: LucideIcon;
  rows: Array<{ label: string; value: number }>;
}) {
  return (
    <Card padding={false}>
      <div
        className="flex items-center gap-2 border-b px-4 py-3"
        style={{ borderColor: "var(--border-soft)" }}
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: "var(--surface-muted)", color: "var(--text-muted)" }}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h3>
      </div>
      <CardBody className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-3">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {row.label}
            </p>
            <p className="text-xl font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
              {row.value.toLocaleString(getActiveLocale())}
            </p>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
