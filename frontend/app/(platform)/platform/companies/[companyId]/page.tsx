"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { safeApi } from "@/lib/api/safeApi";
import { toUserFacingApiError } from "@/lib/api/userFacingError";
import {
  ArrowLeft,
  Building2,
  ClipboardList,
  ExternalLink,
  Settings2,
  Trash2,
} from "lucide-react";
import { MainContent } from "@/components/layout/MainContent";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/FormControls";
import { translate } from "@/lib/i18n";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton, SkeletonCard, SkeletonTable } from "@/components/ui/Skeleton";
import { Tooltip } from "@/components/ui/Tooltip";
import { CompanyAuditEventList } from "@/components/platform/CompanyAuditEventList";
import { CompanyOpsOverview } from "@/components/platform/CompanyOpsOverview";
import { PlatformCompanyProfileEditor } from "@/components/platform/PlatformCompanyProfileEditor";
import { CompanyScopedAuditPanel } from "@/components/platform/CompanyScopedAuditPanel";
import { CompanyTenantTimeline } from "@/components/platform/CompanyTenantTimeline";
import { useAuth } from "@/lib/auth/AuthContext";
import { isPlatformAdmin } from "@/lib/auth/roles";
import { useToast } from "@/components/ui/ToastProvider";
import * as platformApi from "@/lib/api/platform.api";
import type { PlatformAuditLog, PlatformCompanyListItem } from "@/lib/api/platform.api";
import { isApiError } from "@/lib/types/api";
import {
  formatBusinessDateTime,
  formatRelativeTimeAgo,
} from "@/lib/utils/businessDateTime";
import {
  COMPANY_WORKSPACE_TABS,
  companyWorkspaceTabLabel,
  branchUsageLabel,
  buildCompanyTimeline,
  companyStatusBadgeVariant,
  companyStatusLabel,
  parseCompanyWorkspaceTab,
  type CompanyWorkspaceTabId,
} from "@/lib/platform/companyWorkspace";
import { cn } from "@/lib/design-system/cn";

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

function ComingSoonPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <EmptyState title={title} description={description} icon={<Building2 className="h-5 w-5" />} />
  );
}

function WorkspaceLoadingShell() {
  return (
    <MainContent title={translate("platform.companyWorkspace")} subtitle={translate("platform.loadingOrganization")}>
      <div className="space-y-6" aria-busy aria-label={translate("platform.loadingCompanyWorkspace")}>
        <SkeletonCard className="min-h-[140px]" />
        <Skeleton className="h-10 w-full max-w-3xl" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="min-h-[96px]" />
          ))}
        </div>
        <SkeletonTable rows={5} cols={5} />
      </div>
    </MainContent>
  );
}

function CompanyWorkspaceContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();
  const canManage = isPlatformAdmin(user?.roles);
  const businessTz = user?.businessTimeZone ?? "Africa/Accra";

  const companyId = typeof params.companyId === "string" ? params.companyId : "";
  const activeTab = parseCompanyWorkspaceTab(searchParams.get("tab"));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<PlatformCompanyListItem | null>(null);
  const [auditLogs, setAuditLogs] = useState<PlatformAuditLog[]>([]);

  const [branchLimitDraft, setBranchLimitDraft] = useState("");
  const [branchLimitSaving, setBranchLimitSaving] = useState(false);
  const [statusDraft, setStatusDraft] = useState<PlatformCompanyListItem["status"]>("active");
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const setTab = useCallback(
    (tab: CompanyWorkspaceTabId) => {
      const next = new URLSearchParams(searchParams.toString());
      if (tab === "overview") next.delete("tab");
      else next.set("tab", tab);
      const qs = next.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    },
    [router, searchParams]
  );

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const [companiesRes, auditRes] = await Promise.all([
        safeApi(platformApi.getCompanies()),
        safeApi(platformApi.getPlatformAuditLogs(500)),
      ]);

      if (isApiError(companiesRes)) {
        setError(companiesRes.error ?? translate("platform.failedLoadCompany"));
        setCompany(null);
        setAuditLogs([]);
        return;
      }

      const found = (companiesRes.data ?? []).find((c) => c.company_id === companyId) ?? null;
      if (!found) {
        setError(translate("platform.companyNotFound"));
        setCompany(null);
      } else {
        setCompany(found);
        setBranchLimitDraft(found.branch_limit === null ? "" : String(found.branch_limit));
        setStatusDraft(found.status);
      }

      if (!isApiError(auditRes)) {
        setAuditLogs((auditRes.data ?? []).filter((l) => l.company_id === companyId));
      } else {
        setAuditLogs([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : translate("platform.failedLoadCompanyWorkspace"));
      setCompany(null);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (!canManage) return;
    void load();
  }, [canManage, load]);

  const companyLogsNewestFirst = useMemo(() => {
    return [...auditLogs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [auditLogs]);

  const recentActivity = useMemo(
    () => companyLogsNewestFirst.slice(0, 12),
    [companyLogsNewestFirst]
  );

  const lastActivity = companyLogsNewestFirst[0] ?? null;
  const timelineItems = useMemo(
    () => (company ? buildCompanyTimeline(company, companyLogsNewestFirst) : []),
    [company, companyLogsNewestFirst]
  );

  async function copyAdminEmail() {
    const email = company?.admin_emails?.[0]?.trim();
    if (!email) {
      toast.warning(translate("platform.noAdministratorEmailAvailable"));
      return;
    }
    try {
      await navigator.clipboard.writeText(email);
      toast.success(translate("platform.administratorEmailCopied"));
    } catch {
      toast.error(translate("platform.unableCopyEmail"));
    }
  }

  async function saveBranchLimit() {
    if (!company) return;
    setBranchLimitSaving(true);
    try {
      const parsed = branchLimitDraft.trim() === "" ? null : Number(branchLimitDraft.trim());
      if (parsed !== null && (!Number.isInteger(parsed) || parsed < 0)) {
        toast.error(translate("platform.branchLimitWholeNumber"));
        return;
      }
      const res = await safeApi(platformApi.patchCompany(company.company_id, { branch_limit: parsed }));
      if (isApiError(res)) {
        toast.error(res.error ?? translate("platform.failedUpdateBranchLimit"));
        return;
      }
      toast.success(translate("platform.branchLimitUpdated"));
      setCompany((prev) => (prev ? { ...prev, branch_limit: parsed } : prev));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : translate("platform.failedUpdateBranchLimit"));
    } finally {
      setBranchLimitSaving(false);
    }
  }

  async function confirmStatusChange() {
    if (!company) return;
    setStatusSaving(true);
    try {
      const res = await safeApi(platformApi.patchCompany(company.company_id, { status: statusDraft }));
      if (isApiError(res)) {
        toast.error(res.error ?? translate("platform.failedUpdateStatus"));
        return;
      }
      toast.success(
        statusDraft === "active"
          ? translate("platform.companyActivated")
          : statusDraft === "suspended"
            ? translate("platform.companySuspended")
            : translate("platform.companyStatusUpdated")
      );
      setCompany((prev) => (prev ? { ...prev, status: statusDraft } : prev));
      setStatusModalOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : translate("platform.failedUpdateStatus"));
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleDelete() {
    if (!company) return;
    setDeleteSubmitting(true);
    try {
      const res = await safeApi(platformApi.deleteCompany(company.company_id, deleteConfirmName));
      if (isApiError(res)) {
        toast.error(res.error ?? translate("platform.failedDeleteCompany"));
        return;
      }
      toast.success(translate("platform.companyDeleted"));
      router.replace("/platform/companies");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : translate("platform.failedDeleteCompany"));
    } finally {
      setDeleteSubmitting(false);
    }
  }

  function quickToggleStatus() {
    if (!company) return;
    const next: PlatformCompanyListItem["status"] =
      company.status === "active" ? "suspended" : "active";
    setStatusDraft(next);
    setStatusModalOpen(true);
  }

  if (!canManage) {
    return (
      <MainContent title={translate("platform.companyWorkspace")} subtitle={translate("platform.manageIndividualOrganization")}>
        <ErrorState message={translate("platform.platformAdminsOnly")} />
      </MainContent>
    );
  }

  if (loading) {
    return <WorkspaceLoadingShell />;
  }

  if (error || !company) {
    return (
      <MainContent title={translate("platform.companyWorkspace")} subtitle={translate("platform.manageIndividualOrganization")}>
        <ErrorState
          message={error ?? translate("platform.companyNotFound")}
          onRetry={() => void load()}
        />
        <div className="mt-4">
          <Link href="/platform/companies">
            <Button type="button" variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden />}>
              {translate("platform.backToCompanies")}
            </Button>
          </Link>
        </div>
      </MainContent>
    );
  }

  return (
    <MainContent>
      <div className="space-y-6">
        {/* Header */}
        <header
          className="rounded-2xl border px-5 py-5 sm:px-6"
          style={{
            borderColor: "var(--ds-color-border)",
            background:
              "linear-gradient(135deg, rgba(37, 99, 235, 0.06) 0%, rgba(37, 99, 235, 0.01) 40%, var(--ds-color-surface) 100%)",
          }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                {translate("platform.companyWorkspace")}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1
                  className="text-2xl font-semibold tracking-tight sm:text-3xl"
                  style={{ color: "var(--text-primary)" }}
                >
                  {company.company_name}
                </h1>
                <Badge variant={companyStatusBadgeVariant(company.status)}>
                  {companyStatusLabel(company.status)}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: "var(--text-muted)" }}>
                <span>
                  {translate("platform.codeLabel")}: <span className="font-medium" style={{ color: "var(--text-primary)" }}>{company.company_code}</span>
                </span>
                <span>
                  {translate("platform.administrator")}:{" "}
                  <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                    {company.admin_emails?.length ? company.admin_emails.join(", ") : "—"}
                  </span>
                </span>
                <span>
                  {translate("platform.createdLabel")}:{" "}
                  {company.created_at ? (
                    <Tooltip content={formatBusinessDateTime(company.created_at, businessTz)}>
                      <span tabIndex={0} className="font-medium" style={{ color: "var(--text-primary)" }}>
                        {formatRelativeTimeAgo(company.created_at)}
                      </span>
                    </Tooltip>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setTab("settings")}
                leftIcon={<Settings2 className="h-3.5 w-3.5" aria-hidden />}
              >
                {translate("platform.manageCompany")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<ExternalLink className="h-3.5 w-3.5" aria-hidden />}
                onClick={() =>
                  toast.info(translate("platform.portalFuture"))
                }
              >
                {translate("platform.openCompanyPortal")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setTab("audit")}
                leftIcon={<ClipboardList className="h-3.5 w-3.5" aria-hidden />}
              >
                {translate("platform.auditTab")}
              </Button>
              <Link href="/platform/companies">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<ArrowLeft className="h-3.5 w-3.5" aria-hidden />}
                >
                  {translate("platform.backToCompanies")}
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={quickToggleStatus}>
              {company.status === "active" ? translate("platform.suspendCompany") : translate("platform.activateCompany")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="danger"
              leftIcon={<Trash2 className="h-3.5 w-3.5" aria-hidden />}
              onClick={() => {
                setDeleteConfirmName("");
                setDeleteOpen(true);
              }}
            >
              {translate("platform.deleteCompany")}
            </Button>
          </div>
        </header>

        {/* Tabs */}
        <div
          className="overflow-x-auto border-b"
          style={{ borderColor: "var(--ds-color-border)" }}
          role="tablist"
          aria-label={translate("platform.companyWorkspaceSections")}
        >
          <div className="flex min-w-max gap-1">
            {COMPANY_WORKSPACE_TABS.map((tab) => {
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  id={`company-tab-${tab.id}`}
                  onClick={() => setTab(tab.id)}
                  className={cn(
                    "whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                    selected
                      ? "border-[var(--ds-color-primary)] text-[var(--text-primary)]"
                      : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {companyWorkspaceTabLabel(tab.id)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div role="tabpanel" aria-labelledby={`company-tab-${activeTab}`}>
          {activeTab === "overview" ? (
            <CompanyOpsOverview
              company={company}
              businessTz={businessTz}
              lastActivityAt={lastActivity?.created_at ?? null}
              onViewActivity={() => setTab("activity")}
              onCopyAdminEmail={() => void copyAdminEmail()}
              onOpenPortal={() =>
                toast.info(translate("platform.portalFuture"))
              }
              onResetPassword={() =>
                toast.info(translate("platform.passwordResetFuture"))
              }
              onContactAdmin={() =>
                toast.info(translate("platform.contactWorkflowsFuture"))
              }
              recentActivity={
                <CompanyAuditEventList
                  logs={recentActivity}
                  businessTz={businessTz}
                  compact
                  emptyTitle={translate("platform.noRecentCompanyActivity")}
                  emptyDescription={translate("platform.companyActivityRecorded")}
                />
              }
            />
          ) : null}

          {activeTab === "users" ? (
            <Card title={translate("platform.users")}>
              <ComingSoonPanel
                title={translate("platform.userDirectoryStays")}
                description={translate("platform.userDirectoryHelp")}
              />
            </Card>
          ) : null}

          {activeTab === "branches" ? (
            <Card title={translate("navigation.branches")}>
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <SummaryCard label={translate("branches.currentBranches")} value={String(company.branches_count)} />
                <SummaryCard
                  label={translate("branches.branchLimit")}
                  value={company.branch_limit === null ? translate("branches.unlimited") : String(company.branch_limit)}
                />
              </div>
              <ComingSoonPanel
                title={translate("branches.branchOpsStay")}
                description={translate("branches.branchOpsDescription")}
              />
            </Card>
          ) : null}

          {activeTab === "departments" ? (
            <Card title={translate("navigation.departments")}>
              <ComingSoonPanel
                title={translate("platform.departmentManagementStays")}
                description={translate("platform.departmentManagementHelp")}
              />
            </Card>
          ) : null}

          {activeTab === "activity" ? (
            <CompanyTenantTimeline
              items={timelineItems}
              businessTz={businessTz}
              recentFeed={
                <CompanyAuditEventList
                  logs={companyLogsNewestFirst}
                  businessTz={businessTz}
                  compact
                />
              }
            />
          ) : null}

          {activeTab === "audit" ? (
            <CompanyScopedAuditPanel
              companyName={company.company_name}
              logs={companyLogsNewestFirst}
              businessTz={businessTz}
            />
          ) : null}

          {activeTab === "settings" ? (
            <div className="space-y-6">
              <PlatformCompanyProfileEditor
                companyId={company.company_id}
                companyNameFallback={company.company_name}
                onProfileUpdated={(p) => {
                  setCompany((prev) =>
                    prev
                      ? {
                          ...prev,
                          company_name: p.name || prev.company_name,
                          logo_url: p.logo_url,
                          initials: p.initials,
                          industry: p.industry,
                          location_label: p.location_label,
                        }
                      : prev
                  );
                }}
              />

              <Card title={translate("platform.general")}>
                <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
                  Platform-visible tenant settings. Day-to-day policy editing remains in the company portal.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: translate("platform.companyCode"), value: company.company_code },
                    { label: translate("platform.timezone"), value: translate("platform.configuredInCompanyPortal") },
                    { label: translate("platform.currency"), value: translate("platform.configuredInCompanyPortal") },
                    { label: translate("platform.businessHours"), value: translate("platform.configuredInCompanyPortal") },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="rounded-lg border p-3"
                      style={{ borderColor: "var(--border-soft)" }}
                    >
                      <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                        {row.label}
                      </p>
                      <p className="mt-1 text-sm" style={{ color: "var(--text-primary)" }}>
                        {row.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 border-t pt-4" style={{ borderColor: "var(--border-soft)" }}>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {translate("platform.accountStatus")}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                    {translate("platform.accountStatusHelp")}
                  </p>
                  <div className="mt-4 flex flex-wrap items-end gap-3">
                    <div className="min-w-[200px]">
                      <Select
                        label={translate("attendance.status")}
                        value={statusDraft}
                        onChange={(e) =>
                          setStatusDraft(e.target.value as PlatformCompanyListItem["status"])
                        }
                        disabled={statusSaving}
                      >
                        <option value="active">{translate("profile.accountStatus.active")}</option>
                        <option value="inactive">{translate("profile.accountStatus.inactive")}</option>
                        <option value="suspended">{translate("profile.accountStatus.suspended")}</option>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      disabled={statusSaving || statusDraft === company.status}
                      onClick={() => setStatusModalOpen(true)}
                    >
                      {translate("platform.updateStatus")}
                    </Button>
                  </div>
                </div>

                <div className="mt-5 border-t pt-4" style={{ borderColor: "var(--border-soft)" }}>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {translate("platform.branchLimit")}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                    {translate("platform.currentUsage", { values: { usage: branchUsageLabel(company) } })}
                  </p>
                  <div className="mt-4 flex flex-wrap items-end gap-3">
                    <div className="min-w-[220px]">
                      <Input
                        label={translate("platform.limitBlank")}
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={branchLimitDraft}
                        onChange={(e) => setBranchLimitDraft(e.target.value)}
                        placeholder={translate("platform.unlimited")}
                      />
                    </div>
                    <Button type="button" loading={branchLimitSaving} onClick={() => void saveBranchLimit()}>
                      {translate("platform.saveLimit")}
                    </Button>
                  </div>
                </div>
              </Card>

              <Card title={translate("navigation.attendance")}>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {translate("platform.attendanceHelp")}
                </p>
                <p className="mt-3 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {translate("platform.configuredInPortal")}
                </p>
              </Card>

              <Card title={translate("navigation.leave")}>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {translate("platform.leaveHelp")}
                </p>
                <p className="mt-3 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {translate("platform.configuredInPortal")}
                </p>
              </Card>

              <Card title={translate("navigation.payroll")}>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {translate("platform.payrollHelp")}
                </p>
                <p className="mt-3 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {translate("platform.configuredInPortal")}
                </p>
              </Card>

              <Card title={translate("navigation.notifications")}>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {translate("platform.notificationsHelp")}
                </p>
                <p className="mt-3 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {translate("platform.configuredInPortal")}
                </p>
              </Card>
            </div>
          ) : null}

          {activeTab === "danger" ? (
            <div className="space-y-4">
              <Card title={translate("platform.dangerZone")}>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {translate("platform.dangerZoneHelp")}
                </p>
              </Card>

              {company.status === "active" ? (
                <Card title={translate("platform.suspendCompany")}>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {translate("platform.suspendCompanyHelp")}
                  </p>
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="warning"
                      onClick={() => {
                        setStatusDraft("suspended");
                        setStatusModalOpen(true);
                      }}
                    >
                      {translate("platform.suspendCompany")}
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card title={translate("platform.activateCompany")}>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Restore sign-in access for users in this organization.
                  </p>
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="success"
                      onClick={() => {
                        setStatusDraft("active");
                        setStatusModalOpen(true);
                      }}
                    >
                      {translate("platform.activateCompany")}
                    </Button>
                  </div>
                </Card>
              )}

              <Card title={translate("platform.deleteCompany")}>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {translate("platform.deleteCompanyHelp")}
                </p>
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="danger"
                    leftIcon={<Trash2 className="h-4 w-4" aria-hidden />}
                    onClick={() => {
                      setDeleteConfirmName("");
                      setDeleteOpen(true);
                    }}
                  >
                    {translate("platform.deleteCompany")}
                  </Button>
                </div>
              </Card>

              <Card title={translate("platform.transferOwnership")}>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {translate("platform.ownershipTransferFuture")}
                </p>
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled
                    onClick={() =>
                      toast.info(translate("platform.ownershipTransferFuture"))
                    }
                  >
                    {translate("platform.transferOwnership")}
                  </Button>
                </div>
              </Card>
            </div>
          ) : null}
        </div>
      </div>

      <Modal
        open={statusModalOpen}
        onClose={() => !statusSaving && setStatusModalOpen(false)}
        title={translate("platform.confirmCompanyStatus")}
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: "var(--text-primary)" }}>
            {translate("platform.confirmStatusChange", {
              values: {
                name: company.company_name,
                from: companyStatusLabel(company.status),
                to: companyStatusLabel(statusDraft),
              },
            })}
          </p>
          <div className="flex justify-end gap-2 border-t pt-3" style={{ borderColor: "var(--border-soft)" }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStatusModalOpen(false)}
              disabled={statusSaving}
            >
              {translate("common.cancel")}
            </Button>
            <Button type="button" loading={statusSaving} onClick={() => void confirmStatusChange()}>
              {translate("platform.confirm")}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => !deleteSubmitting && setDeleteOpen(false)}
        title={translate("platform.deleteCompanyTitle")}
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {translate("platform.typeCompanyName", { values: { name: company.company_name } })}
          </p>
          <Input
            value={deleteConfirmName}
            onChange={(e) => setDeleteConfirmName(e.target.value)}
            placeholder={translate("platform.companyNamePlaceholder")}
            aria-label={translate("platform.confirmCompanyName")}
          />
          <div className="flex justify-end gap-2 border-t pt-3" style={{ borderColor: "var(--border-soft)" }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteSubmitting}
            >
              {translate("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deleteSubmitting}
              disabled={deleteConfirmName.trim() !== company.company_name}
              leftIcon={<Trash2 className="h-4 w-4" aria-hidden />}
              onClick={() => void handleDelete()}
            >
              {translate("platform.deleteCompany")}
            </Button>
          </div>
        </div>
      </Modal>
    </MainContent>
  );
}

export default function CompanyWorkspacePage() {
  return (
    <Suspense fallback={<WorkspaceLoadingShell />}>
      <CompanyWorkspaceContent />
    </Suspense>
  );
}
