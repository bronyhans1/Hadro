"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MainContent } from "@/components/layout/MainContent";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAuth } from "@/lib/auth/AuthContext";
import { isPlatformAdmin } from "@/lib/auth/roles";
import * as platformApi from "@/lib/api/platform.api";
import { isApiError } from "@/lib/types/api";
import type { PlatformCompanyListItem } from "@/lib/api/platform.api";
import { useToast } from "@/components/ui/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { Building2, Eye, Plus, Trash2 } from "lucide-react";
import { Input, Select } from "@/components/ui/FormControls";
import { Modal } from "@/components/ui/Modal";
import { translate } from "@/lib/i18n";
import { formatBusinessDateTime, formatRelativeTimeAgo } from "@/lib/utils/businessDateTime";
import { Tooltip } from "@/components/ui/Tooltip";
import { safeApi } from "@/lib/api/safeApi";
import { toUserFacingApiError } from "@/lib/api/userFacingError";
import {
  branchUsageLabel,
  companyStatusBadgeVariant,
  companyStatusLabel,
} from "@/lib/platform/companyWorkspace";
import { CompanyLogoMark } from "@/components/company/CompanyLogoMark";

type StatusFilter = "all" | "active" | "inactive" | "suspended";

export default function PlatformCompaniesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const canManage = isPlatformAdmin(user?.roles);

  const [companies, setCompanies] = useState<PlatformCompanyListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [deleteTarget, setDeleteTarget] = useState<PlatformCompanyListItem | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const [statusTarget, setStatusTarget] = useState<PlatformCompanyListItem | null>(null);
  const [statusNext, setStatusNext] = useState<PlatformCompanyListItem["status"]>("active");
  const [statusSaving, setStatusSaving] = useState(false);

  const loadCompanies = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await safeApi(platformApi.getCompanies());
      if (isApiError(res)) {
        setError(toUserFacingApiError(res.error, translate("platform.failedLoadCompanies")));
        setCompanies([]);
        return;
      }
      setCompanies(res.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? toUserFacingApiError(e.message, translate("platform.failedLoadCompanies")) : translate("platform.failedLoadCompanies"));
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canManage) return;
    void loadCompanies();
  }, [canManage, loadCompanies]);

  const filteredCompanies = useMemo(() => {
    const q = search.trim().toLowerCase();
    return companies.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!q) return true;
      const adminHaystack = (c.admin_emails ?? []).join(" ").toLowerCase();
      const adminName = (c.administrator_name ?? "").toLowerCase();
      const location = (c.location_label ?? "").toLowerCase();
      const industry = (c.industry ?? "").toLowerCase();
      return (
        c.company_name.toLowerCase().includes(q) ||
        c.company_code.toLowerCase().includes(q) ||
        adminHaystack.includes(q) ||
        adminName.includes(q) ||
        location.includes(q) ||
        industry.includes(q)
      );
    });
  }, [companies, search, statusFilter]);

  async function handleDeleteCompany() {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    setError(null);
    try {
      const targetCompanyId = deleteTarget.company_id;
      const res = await safeApi(platformApi.deleteCompany(targetCompanyId, deleteConfirmName));
      if (isApiError(res)) {
        const msg = toUserFacingApiError(res.error, translate("platform.failedDeleteCompany"));
        setError(msg);
        toast.error(msg);
        return;
      }
      setCompanies((prev) => prev.filter((c) => c.company_id !== targetCompanyId));
      setDeleteTarget(null);
      setDeleteConfirmName("");
      toast.success(translate("platform.companyDeleted"));
      await loadCompanies();
    } catch (e) {
      const msg = e instanceof Error ? toUserFacingApiError(e.message, translate("platform.failedDeleteCompany")) : translate("platform.failedDeleteCompany");
      setError(msg);
      toast.error(msg);
    } finally {
      setDeleteSubmitting(false);
    }
  }

  async function confirmStatusChange() {
    if (!statusTarget) return;
    setStatusSaving(true);
    try {
      const res = await safeApi(platformApi.patchCompany(statusTarget.company_id, { status: statusNext }));
      if (isApiError(res)) {
        toast.error(toUserFacingApiError(res.error, translate("platform.failedUpdateStatus")));
        return;
      }
      toast.success(
        statusNext === "active" ? translate("platform.companyActivated") : translate("platform.companySuspended")
      );
      setCompanies((prev) =>
        prev.map((c) =>
          c.company_id === statusTarget.company_id ? { ...c, status: statusNext } : c
        )
      );
      setStatusTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? toUserFacingApiError(e.message, translate("platform.failedUpdateStatus")) : translate("platform.failedUpdateStatus"));
    } finally {
      setStatusSaving(false);
    }
  }

  if (!canManage) {
    return (
      <MainContent
        title={translate("navigation.companies")}
        subtitle={translate("platform.companiesSubtitle")}
      >
        <ErrorState message={translate("platform.platformAdminOnly")} />
      </MainContent>
    );
  }

  return (
    <MainContent
      title={translate("navigation.companies")}
      subtitle={translate("platform.companiesSubtitle")}
      actions={
        <Link href="/platform/companies/new">
          <Button type="button" leftIcon={<Plus className="h-4 w-4" aria-hidden />}>
            {translate("navigation.provisionCompany")}
          </Button>
        </Link>
      }
    >
      <Card>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <Input
              id="company-search"
              label={translate("platform.searchCompanies")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={translate("platform.searchCompaniesPlaceholder")}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              id="company-status-filter"
              label={translate("attendance.status")}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="all">{translate("common.all")}</option>
              <option value="active">{translate("profile.accountStatus.active")}</option>
              <option value="inactive">{translate("profile.accountStatus.inactive")}</option>
              <option value="suspended">{translate("profile.accountStatus.suspended")}</option>
            </Select>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void loadCompanies()}
            loading={loading}
            className="lg:mb-0.5"
          >
            {translate("common.refresh")}
          </Button>
        </div>

        {error ? <div className="alert-error mb-4 px-3 py-2">{error}</div> : null}

        {loading && companies.length === 0 ? (
          <SkeletonTable rows={6} cols={6} className="min-h-[160px]" />
        ) : companies.length === 0 ? (
          <EmptyState
            title={translate("platform.noCompaniesYet")}
            description={translate("platform.createFirstOrganization")}
            icon={<Building2 className="h-5 w-5" />}
            action={
              <Link href="/platform/companies/new">
                <Button type="button" leftIcon={<Plus className="h-4 w-4" aria-hidden />}>
                  {translate("navigation.provisionCompany")}
                </Button>
              </Link>
            }
          />
        ) : filteredCompanies.length === 0 ? (
          <EmptyState
            title={translate("platform.noCompaniesMatch")}
            description={translate("platform.tryClearingCompanyFilters")}
            icon={<Building2 className="h-5 w-5" />}
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
              >
                {translate("platform.clearFilters")}
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr
                  className="border-b text-left"
                  style={{ borderColor: "var(--border-soft)", color: "var(--text-muted)" }}
                >
                  <th className="py-2 pr-4 font-medium">{translate("common.company")}</th>
                  <th className="py-2 pr-4 font-medium">{translate("platform.industry")}</th>
                  <th className="py-2 pr-4 font-medium">{translate("platform.plan")}</th>
                  <th className="py-2 pr-4 font-medium">{translate("platform.location")}</th>
                  <th className="py-2 pr-4 font-medium">{translate("navigation.employees")}</th>
                  <th className="py-2 pr-4 font-medium">{translate("navigation.branches")}</th>
                  <th className="py-2 pr-4 font-medium">{translate("platform.administrator")}</th>
                  <th className="py-2 pr-4 font-medium">{translate("platform.joined")}</th>
                  <th className="py-2 pr-4 font-medium">{translate("platform.lastActivity")}</th>
                  <th className="py-2 pr-4 font-medium">{translate("attendance.status")}</th>
                  <th className="py-2 pl-3 pr-0 font-medium">{translate("attendance.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((c) => {
                  const adminEmail =
                    c.administrator_email?.trim() || c.admin_emails?.[0]?.trim() || "";
                  const adminName = c.administrator_name?.trim() || "";
                  const joined = c.joined_at ?? c.created_at;
                  const lastActivity = c.last_activity_at ?? joined;
                  const employees = c.employees_count ?? 0;
                  return (
                    <tr
                      key={c.company_id}
                      className="border-b"
                      style={{ borderColor: "var(--border-soft)" }}
                    >
                      <td className="py-2.5 pr-4" style={{ color: "var(--text-primary)" }}>
                        <div className="flex items-center gap-2.5">
                          <CompanyLogoMark
                            name={c.company_name}
                            logoUrl={c.logo_url}
                            initials={c.initials}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <Link
                              href={`/platform/companies/${c.company_id}`}
                              className="font-medium underline-offset-2 hover:underline"
                              style={{ color: "var(--ds-color-primary)" }}
                            >
                              {c.company_name}
                            </Link>
                            <div
                              className="mt-0.5 font-mono text-xs"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {c.company_code}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4" style={{ color: "var(--text-muted)" }}>
                        {c.industry?.trim() || "—"}
                      </td>
                      <td className="py-2.5 pr-4" style={{ color: "var(--text-muted)" }}>
                        {c.plan?.trim() || translate("platform.standardPlan")}
                      </td>
                      <td className="max-w-[12rem] py-2.5 pr-4" style={{ color: "var(--text-muted)" }}>
                        <span className="line-clamp-2" title={c.location_label || undefined}>
                          {c.location_label?.trim() || "—"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-2.5 pr-4" style={{ color: "var(--text-muted)" }}>
                        {employees} {employees === 1 ? translate("permissions.roles.employee") : translate("navigation.employees")}
                      </td>
                      <td className="whitespace-nowrap py-2.5 pr-4" style={{ color: "var(--text-muted)" }}>
                        <Tooltip content={branchUsageLabel(c)}>
                          <span tabIndex={0}>
                            {translate("branches.count", { count: c.branches_count })}
                          </span>
                        </Tooltip>
                      </td>
                      <td className="py-2.5 pr-4" style={{ color: "var(--text-muted)" }}>
                        {adminName || adminEmail ? (
                          <div className="min-w-0">
                            {adminName ? (
                              <div className="truncate font-medium" style={{ color: "var(--text-primary)" }}>
                                {adminName}
                              </div>
                            ) : null}
                            {adminEmail ? (
                              <div className="truncate text-xs">{adminEmail}</div>
                            ) : null}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="whitespace-nowrap py-2.5 pr-4" style={{ color: "var(--text-muted)" }}>
                        {joined ? (
                          <Tooltip content={formatBusinessDateTime(joined)}>
                            <span tabIndex={0}>{formatRelativeTimeAgo(joined)}</span>
                          </Tooltip>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="whitespace-nowrap py-2.5 pr-4" style={{ color: "var(--text-muted)" }}>
                        {lastActivity ? (
                          <Tooltip content={formatBusinessDateTime(lastActivity)}>
                            <span tabIndex={0}>{formatRelativeTimeAgo(lastActivity)}</span>
                          </Tooltip>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge variant={companyStatusBadgeVariant(c.status)}>
                          {companyStatusLabel(c.status)}
                        </Badge>
                      </td>
                      <td className="py-2.5 pl-3 pr-0">
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/platform/companies/${c.company_id}`}>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              leftIcon={<Eye className="h-3.5 w-3.5" aria-hidden />}
                            >
                              {translate("platform.openWorkspace")}
                            </Button>
                          </Link>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setStatusTarget(c);
                              setStatusNext(c.status === "active" ? "suspended" : "active");
                            }}
                          >
                            {c.status === "active" ? translate("platform.suspend") : translate("platform.activate")}
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            leftIcon={<Trash2 className="h-3.5 w-3.5" aria-hidden />}
                            onClick={() => {
                              setDeleteTarget(c);
                              setDeleteConfirmName("");
                            }}
                          >
                            {translate("common.delete")}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => !deleteSubmitting && setDeleteTarget(null)}
        title={translate("platform.deleteCompanyTitle")}
      >
        {deleteTarget ? (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {translate("platform.typeCompanyName", { values: { name: deleteTarget.company_name } })}
            </p>
            <Input
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder={translate("platform.companyNamePlaceholder")}
            />
            <div className="flex justify-end gap-2 border-t pt-3" style={{ borderColor: "var(--border-soft)" }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteSubmitting}
              >
                {translate("common.cancel")}
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => void handleDeleteCompany()}
                loading={deleteSubmitting}
                disabled={deleteConfirmName.trim() !== deleteTarget.company_name}
                leftIcon={<Trash2 className="h-4 w-4" aria-hidden />}
              >
                {translate("platform.deleteCompany")}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(statusTarget)}
        onClose={() => !statusSaving && setStatusTarget(null)}
        title={translate("platform.confirmCompanyStatus")}
      >
        {statusTarget ? (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--text-primary)" }}>
              {translate("platform.confirmStatusChange", {
                values: {
                  name: statusTarget.company_name,
                  from: companyStatusLabel(statusTarget.status),
                  to: companyStatusLabel(statusNext),
                },
              })}
            </p>
            <div className="flex justify-end gap-2 border-t pt-3" style={{ borderColor: "var(--border-soft)" }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStatusTarget(null)}
                disabled={statusSaving}
              >
                {translate("common.cancel")}
              </Button>
              <Button type="button" loading={statusSaving} onClick={() => void confirmStatusChange()}>
                {translate("platform.confirm")}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </MainContent>
  );
}
