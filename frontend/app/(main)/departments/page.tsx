"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MainContent } from "@/components/layout/MainContent";
import { Button, IconButton } from "@/components/ui/Button";
import { Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { AccessDeniedState } from "@/components/ui/AccessDeniedState";
import { Input, Select } from "@/components/ui/FormControls";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/lib/auth/AuthContext";
import { hasRole, ADMIN_MANAGER_ROLES, canAccessAdminFeatures } from "@/lib/auth/roles";
import * as departmentsApi from "@/lib/api/departments.api";
import * as branchesApi from "@/lib/api/branches.api";
import { safeApi } from "@/lib/api/safeApi";
import { isApiError } from "@/lib/types/api";
import type { Department } from "@/lib/api/departments.api";
import type { BranchDto } from "@/lib/api/branches.api";
import { useToast } from "@/components/ui/ToastProvider";
import { useSuccessBanner } from "@/hooks/useSuccessBanner";
import { translate } from "@/lib/i18n";

export default function DepartmentsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const success = useSuccessBanner();
  const canManage = hasRole(user?.roles, ADMIN_MANAGER_ROLES);
  const isAdmin = canAccessAdminFeatures(user?.roles);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editDepartment, setEditDepartment] = useState<Department | null>(null);
  const [deleteDepartment, setDeleteDepartment] = useState<Department | null>(null);

  const [formName, setFormName] = useState("");
  const [formBranchId, setFormBranchId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  const load = useCallback(async () => {
    if (!canManage) return;
    setError(null);
    setLoading(true);
    try {
      const depRes = await safeApi(departmentsApi.getDepartments());
      if (isApiError(depRes)) {
        setError(depRes.error ?? translate("departments.failedLoad"));
        setDepartments([]);
        return;
      }
      setDepartments(depRes.data ?? []);
      const brRes = await safeApi(branchesApi.getBranches());
      if (!isApiError(brRes)) {
        setBranches(brRes.data ?? []);
      } else {
        setBranches([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : translate("departments.failedLoad"));
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => {
    load();
  }, [load]);

  function defaultBranchId(): string {
    const d = branches.find((b) => b.is_default);
    return d?.id ?? branches[0]?.id ?? "";
  }

  function openAdd() {
    setFormName("");
    setFormBranchId(defaultBranchId());
    setFormError(null);
    setAddOpen(true);
  }

  function openEdit(department: Department) {
    setEditDepartment(department);
    setFormName(department.name);
    setFormBranchId(department.branch_id ?? defaultBranchId());
    setFormError(null);
  }

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const name = formName.trim();
    if (!name) {
      setFormError(translate("departments.nameRequired"));
      return;
    }
    setFormSubmitting(true);
    try {
      const res = await safeApi(
        departmentsApi.createDepartment({
          name,
          ...(formBranchId.trim() ? { branch_id: formBranchId.trim() } : {}),
        })
      );
      if (isApiError(res)) {
        const msg = res.error ?? translate("departments.failedCreate");
        setFormError(msg);
        toast.error(msg);
        return;
      }
      setAddOpen(false);
      success.showSuccess({
        title: translate("leave.changesSaved"),
        description: translate("departments.created"),
      });
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : translate("departments.failedCreate");
      setFormError(msg);
      toast.error(msg);
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editDepartment) return;
    setFormError(null);
    const name = formName.trim();
    if (!name) {
      setFormError(translate("departments.nameRequired"));
      return;
    }
    setFormSubmitting(true);
    try {
      const res = await safeApi(
        departmentsApi.updateDepartment(editDepartment.id, {
          name,
          ...(isAdmin && formBranchId.trim() ? { branch_id: formBranchId.trim() } : {}),
        })
      );
      if (isApiError(res)) {
        const msg = res.error ?? translate("employees.failedUpdateDepartment");
        setFormError(msg);
        toast.error(msg);
        return;
      }
      setEditDepartment(null);
      success.showSuccess({
        title: translate("leave.changesSaved"),
        description: translate("departments.updated"),
      });
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : translate("employees.failedUpdateDepartment");
      setFormError(msg);
      toast.error(msg);
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteDepartment) return;
    setActionLoading(deleteDepartment.id);
    try {
      const res = await safeApi(departmentsApi.deleteDepartment(deleteDepartment.id));
      if (isApiError(res)) {
        const msg = res.error ?? translate("departments.failedDelete");
        setError(msg);
        toast.error(msg);
        return;
      }
      setDeleteDepartment(null);
      success.showSuccess({
        title: translate("leave.changesSaved"),
        description: translate("departments.deleted"),
      });
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : translate("departments.failedDelete");
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  }

  const filteredDepartments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return departments.filter((department) => {
      const matchesSearch = query.length === 0 || department.name.toLowerCase().includes(query);
      const matchesBranch = branchFilter.length === 0 || department.branch_id === branchFilter;
      return matchesSearch && matchesBranch;
    });
  }, [departments, searchQuery, branchFilter]);

  const columns = [
    {
      key: "name",
      header: translate("attendance.department"),
      render: (row: Department) => <span className="font-medium text-theme">{row.name}</span>,
    },
    {
      key: "branch",
      header: translate("attendance.branch"),
      render: (row: Department) => (
        <span className={row.branch?.name ? "text-theme" : "text-theme-muted"}>{row.branch?.name ?? "—"}</span>
      ),
    },
    ...(canManage
      ? [
          {
            key: "actions",
            header: translate("attendance.actions"),
            render: (row: Department) => (
              <div className="flex justify-end gap-1">
                <IconButton
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label={translate("departments.editNamed", { values: { name: row.name } })}
                  onClick={() => openEdit(row)}
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                </IconButton>
                <IconButton
                  type="button"
                  variant="danger"
                  size="sm"
                  aria-label={translate("departments.deleteNamed", { values: { name: row.name } })}
                  onClick={() => setDeleteDepartment(row)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </IconButton>
              </div>
            ),
          },
        ]
      : []),
  ];

  if (!canManage) {
    return (
      <MainContent title={translate("departments.title")}>
        <AccessDeniedState description={translate("departments.accessDenied")} />
      </MainContent>
    );
  }

  if (loading && departments.length === 0) {
    return (
      <MainContent>
        <LoadingState message={translate("departments.loadingDepartments")} className="min-h-[240px]" />
      </MainContent>
    );
  }

  if (error && departments.length === 0) {
    return (
      <MainContent>
        <ErrorState message={error} onRetry={load} />
      </MainContent>
    );
  }

  return (
    <MainContent>
      <div className="space-y-8">
        <PageHeader
          title={translate("departments.title")}
          subtitle={translate("departments.subtitle")}
          actions={
            <Button type="button" onClick={openAdd}>
              {translate("departments.addDepartment")}
            </Button>
          }
        />
        {error ? (
          <p className="callout-warning text-sm" role="alert">
            {error}
          </p>
        ) : null}
        {success.banner}
        <Card padding={false}>
        <CardBody className="p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="department-search"
              label={translate("departments.searchDepartments")}
              placeholder={translate("departments.searchDepartmentsPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select
              id="department-branch-filter"
              label={translate("attendance.branch")}
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <option value="">{translate("employees.allBranches")}</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </Select>
          </div>
        </CardBody>
        </Card>
        <Card title={translate("departments.departmentList")}>
        {filteredDepartments.length === 0 ? (
          <EmptyState
            message={departments.length === 0 ? translate("departments.noDepartmentsYet") : translate("departments.noDepartmentsMatch")}
            description={
              departments.length === 0
                ? translate("departments.createFirst")
                : undefined
            }
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredDepartments}
            keyExtractor={(row) => row.id}
            emptyMessage={translate("departments.noDepartments")}
            stickyHeader
          />
        )}
        </Card>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={translate("departments.addDepartmentSentence")}>
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formError && (
            <div className="alert-error px-3 py-2">
              {formError}
            </div>
          )}
          <div>
            <label htmlFor="add-dept-name" className="mb-1 block text-sm font-medium text-theme">
              {translate("departments.name")}
            </label>
            <input
              id="add-dept-name"
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              className="input-field w-full"
              placeholder={translate("departments.placeholderAdd")}
            />
          </div>
          <div>
            <label htmlFor="add-dept-branch" className="mb-1 block text-sm font-medium text-theme">
              {translate("attendance.branch")}
            </label>
            <Select
              id="add-dept-branch"
              value={formBranchId}
              onChange={(e) => setFormBranchId(e.target.value)}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                  {b.is_default ? translate("employees.defaultSuffix") : ""}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>
              {translate("common.cancel")}
            </Button>
            <Button type="submit" loading={formSubmitting}>
              {translate("departments.addDepartmentSentence")}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!editDepartment}
        onClose={() => setEditDepartment(null)}
        title={translate("departments.editDepartment")}
      >
        {editDepartment && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {formError && (
              <div className="alert-error px-3 py-2">
                {formError}
              </div>
            )}
            <div>
              <label htmlFor="edit-dept-name" className="mb-1 block text-sm font-medium text-theme">
                {translate("departments.name")}
              </label>
              <input
                id="edit-dept-name"
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                className="input-field w-full"
                placeholder={translate("departments.placeholderEdit")}
              />
            </div>
            {isAdmin ? (
              <div>
                <label htmlFor="edit-dept-branch" className="mb-1 block text-sm font-medium text-theme">
                  {translate("attendance.branch")}
                </label>
                <Select
                  id="edit-dept-branch"
                  value={formBranchId}
                  onChange={(e) => setFormBranchId(e.target.value)}
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                      {b.is_default ? translate("employees.defaultSuffix") : ""}
                    </option>
                  ))}
                </Select>
                <p className="mt-1 text-xs text-theme-muted">{translate("departments.adminMoveHint")}</p>
              </div>
            ) : null}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditDepartment(null)}>
                {translate("common.cancel")}
              </Button>
              <Button type="submit" loading={formSubmitting}>
                {translate("common.save")}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={!!deleteDepartment}
        onClose={() => setDeleteDepartment(null)}
        title={translate("departments.deleteDepartment")}
      >
        {deleteDepartment && (
          <div className="space-y-4">
            <p className="text-sm text-theme-muted">
              {translate("departments.deleteConfirm", { values: { name: deleteDepartment.name } })}
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setDeleteDepartment(null)}>
                {translate("common.cancel")}
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleDeleteConfirm}
                loading={actionLoading === deleteDepartment.id}
              >
                {translate("departments.delete")}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </MainContent>
  );
}
