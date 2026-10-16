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
import { Checkbox, Input, Select } from "@/components/ui/FormControls";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth/AuthContext";
import { canAccessShiftAdministration } from "@/lib/auth/roles";
import * as shiftsApi from "@/lib/api/shifts.api";
import * as companyPolicyApi from "@/lib/api/companyPolicy.api";
import { safeApi } from "@/lib/api/safeApi";
import { isApiError } from "@/lib/types/api";
import type { Shift } from "@/lib/api/shifts.api";
import {
  clientValidateShiftTimes,
  filterShiftsForList,
  formatShiftTimeRange,
  isOvernightWallClockSpan,
} from "@/lib/utils/shiftDisplay";
import { AccessDeniedState } from "@/components/ui/AccessDeniedState";
import { translate } from "@/lib/i18n";
import { toUserFacingApiError } from "@/lib/api/userFacingError";

export default function ShiftsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const canManage = canAccessShiftAdministration(user?.roles);

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editShift, setEditShift] = useState<Shift | null>(null);
  const [deleteShift, setDeleteShift] = useState<Shift | null>(null);

  const [formName, setFormName] = useState("");
  const [formStart, setFormStart] = useState("09:00");
  const [formEnd, setFormEnd] = useState("17:00");
  const [formGrace, setFormGrace] = useState("0");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [overnightPolicyOn, setOvernightPolicyOn] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [shiftTypeFilter, setShiftTypeFilter] = useState<"all" | "day" | "overnight">("all");
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await safeApi(shiftsApi.getShifts());
      if (isApiError(res)) {
        setError(toUserFacingApiError(res.error, translate("attendance.failedLoadShifts")));
        setShifts([]);
        return;
      }
      setShifts(res.data ?? []);
      const policyRes = await safeApi(companyPolicyApi.getPolicy());
      if (!isApiError(policyRes) && policyRes.data) {
        setOvernightPolicyOn(policyRes.data.overnight_shifts_enabled === true);
      }
    } catch (e) {
      setError(e instanceof Error ? toUserFacingApiError(e.message, translate("attendance.failedLoadShifts")) : translate("attendance.failedLoadShifts"));
      setShifts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const visibleShifts = useMemo(() => {
    const base = filterShiftsForList(shifts, showInactive);
    const query = searchQuery.trim().toLowerCase();
    return base.filter((shift) => {
      const isOvernight =
        shift.spans_midnight || isOvernightWallClockSpan(shift.start_time, shift.end_time);
      const matchesSearch =
        query.length === 0 ||
        shift.name.toLowerCase().includes(query) ||
        formatShiftTimeRange(shift).toLowerCase().includes(query);
      const matchesType =
        shiftTypeFilter === "all" ||
        (shiftTypeFilter === "overnight" ? isOvernight : !isOvernight);
      return matchesSearch && matchesType;
    });
  }, [shifts, showInactive, searchQuery, shiftTypeFilter]);

  useEffect(() => {
    if (authLoading) return;
    if (!canManage) {
      setLoading(false);
      return;
    }
    load();
  }, [load, authLoading, canManage]);

  function openAdd() {
    setFormName("");
    setFormStart("09:00");
    setFormEnd("17:00");
    setFormGrace("0");
    setFormError(null);
    setAddOpen(true);
  }

  function openEdit(shift: Shift) {
    setEditShift(shift);
    setFormName(shift.name);
    setFormStart(shift.start_time?.slice(0, 5) || "09:00");
    setFormEnd(shift.end_time?.slice(0, 5) || "17:00");
    setFormGrace(String(shift.grace_minutes ?? 0));
    setFormError(null);
  }

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const name = formName.trim();
    if (!name) {
      setFormError(translate("attendance.nameRequired"));
      return;
    }
    const grace = parseInt(formGrace, 10);
    if (Number.isNaN(grace) || grace < 0) {
      setFormError(translate("attendance.graceInvalid"));
      return;
    }
    const timeErr = clientValidateShiftTimes({
      start_time: formStart,
      end_time: formEnd,
      overnight_shifts_enabled: overnightPolicyOn,
    });
    if (timeErr) {
      setFormError(timeErr);
      return;
    }
    setFormSubmitting(true);
    try {
      const res = await safeApi(
        shiftsApi.createShift({
          name,
          start_time: formStart,
          end_time: formEnd,
          grace_minutes: grace,
        })
      );
      if (isApiError(res)) {
        setFormError(toUserFacingApiError(res.error, translate("attendance.failedCreateShift")));
        return;
      }
      setAddOpen(false);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? toUserFacingApiError(e.message, translate("attendance.failedCreateShift")) : translate("attendance.failedCreateShift"));
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editShift) return;
    setFormError(null);
    const name = formName.trim();
    if (!name) {
      setFormError(translate("attendance.nameRequired"));
      return;
    }
    const grace = parseInt(formGrace, 10);
    if (Number.isNaN(grace) || grace < 0) {
      setFormError(translate("attendance.graceInvalid"));
      return;
    }
    const timeErr = clientValidateShiftTimes({
      start_time: formStart,
      end_time: formEnd,
      overnight_shifts_enabled: overnightPolicyOn,
    });
    if (timeErr) {
      setFormError(timeErr);
      return;
    }
    setFormSubmitting(true);
    try {
      const res = await safeApi(
        shiftsApi.updateShift(editShift.id, {
          name,
          start_time: formStart,
          end_time: formEnd,
          grace_minutes: grace,
        })
      );
      if (isApiError(res)) {
        setFormError(toUserFacingApiError(res.error, translate("attendance.failedUpdateShift")));
        return;
      }
      setEditShift(null);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? toUserFacingApiError(e.message, translate("attendance.failedUpdateShift")) : translate("attendance.failedUpdateShift"));
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteShift) return;
    setActionLoading(deleteShift.id);
    try {
      const res = await safeApi(shiftsApi.deleteShift(deleteShift.id));
      if (isApiError(res)) {
        setError(toUserFacingApiError(res.error, translate("attendance.failedDeleteShift")));
        return;
      }
      if (res.data?.deactivated) {
        setDeleteNotice(translate("attendance.shiftArchived", { values: { name: deleteShift.name } }));
      }
      setDeleteShift(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? toUserFacingApiError(e.message, translate("attendance.failedDeleteShift")) : translate("attendance.failedDeleteShift"));
    } finally {
      setActionLoading(null);
    }
  }

  const columns: { key: string; header: string; render?: (row: Shift) => React.ReactNode }[] = [
    {
      key: "name",
      header: translate("departments.name"),
      render: (row: Shift) => (
        <span className={row.is_active === false ? "text-theme-muted line-through" : ""}>
          {row.name}
          {row.is_active === false ? (
            <Badge variant="default" className="ml-2">
              {translate("profile.accountStatus.inactive")}
            </Badge>
          ) : null}
        </span>
      ),
    },
    {
      key: "schedule",
      header: translate("attendance.schedule"),
      render: (row: Shift) => <span className="text-theme">{formatShiftTimeRange(row)}</span>,
    },
    {
      key: "overnight",
      header: translate("attendance.type"),
      render: (row: Shift) =>
        row.spans_midnight || isOvernightWallClockSpan(row.start_time, row.end_time) ? (
          <Badge variant="warning">{translate("attendance.overnight")}</Badge>
        ) : (
          <span className="text-theme-muted text-sm">{translate("attendance.day")}</span>
        ),
    },
    {
      key: "grace_minutes",
      header: translate("attendance.graceMin"),
      render: (row: Shift) => row.grace_minutes ?? 0,
    },
    ...(canManage
      ? [
          {
            key: "actions",
            header: translate("attendance.actions"),
            render: (row: Shift) => (
              <div className="flex justify-end gap-1">
                <IconButton
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label={translate("attendance.editShiftFor", { values: { name: row.name } })}
                  onClick={() => openEdit(row)}
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                </IconButton>
                <IconButton
                  type="button"
                  variant="danger"
                  size="sm"
                  aria-label={translate("attendance.deleteShiftFor", { values: { name: row.name } })}
                  onClick={() => setDeleteShift(row)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </IconButton>
              </div>
            ),
          },
        ]
      : []),
  ];

  if (authLoading) {
    return (
      <MainContent>
        <LoadingState message={translate("common.loadingEllipsis")} className="min-h-[240px]" />
      </MainContent>
    );
  }

  if (!canManage) {
    return (
      <MainContent title={translate("navigation.shifts")}>
        <AccessDeniedState description={translate("attendance.shiftAdminRestricted")} />
      </MainContent>
    );
  }

  if (loading && shifts.length === 0) {
    return (
      <MainContent>
        <LoadingState message={translate("attendance.loadingShifts")} className="min-h-[240px]" />
      </MainContent>
    );
  }

  if (error && shifts.length === 0) {
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
          title={translate("navigation.shifts")}
          subtitle={translate("attendance.shiftSubtitle")}
          actions={
            canManage ? (
              <Button type="button" onClick={openAdd}>
                {translate("attendance.addShift")}
              </Button>
            ) : undefined
          }
        />
        <Card padding={false}>
        <CardBody className="p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              id="shift-search"
              label={translate("attendance.searchShifts")}
              placeholder={translate("attendance.searchShiftsPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select
              id="shift-type-filter"
              label={translate("attendance.shiftType")}
              value={shiftTypeFilter}
              onChange={(e) => setShiftTypeFilter(e.target.value as "all" | "day" | "overnight")}
            >
              <option value="all">{translate("attendance.allTypes")}</option>
              <option value="day">{translate("attendance.day")}</option>
              <option value="overnight">{translate("attendance.overnight")}</option>
            </Select>
            <div className="flex items-end">
              <Checkbox
                id="show-inactive-shifts"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                label={translate("attendance.showInactive")}
              />
            </div>
          </div>
        </CardBody>
        </Card>
        {deleteNotice ? (
          <div className="alert-success px-3 py-2 text-sm">{deleteNotice}</div>
        ) : null}
        <Card title={translate("attendance.shiftList")}>
        {visibleShifts.length === 0 ? (
          <EmptyState
            message={
              canManage
                ? shifts.length === 0
                  ? translate("attendance.noShiftsYet")
                  : translate("attendance.noShiftsMatch")
                : translate("attendance.noShiftsDefined")
            }
            description={
              canManage && shifts.length === 0
                ? translate("attendance.createFirstShift")
                : undefined
            }
          />
        ) : (
          <DataTable
            columns={columns}
            data={visibleShifts}
            keyExtractor={(row) => row.id}
            emptyMessage={translate("attendance.noShifts")}
            stickyHeader
          />
        )}
        </Card>
      </div>

      {canManage && (
        <>
        <Modal open={addOpen} onClose={() => setAddOpen(false)} title={translate("attendance.addShift")} size="lg">
          <form onSubmit={handleAddSubmit} className="space-y-4">
            {formError && (
              <div className="alert-error px-3 py-2">
                {formError}
              </div>
            )}
            <div>
              <label htmlFor="add-shift-name" className="mb-1 block text-sm font-medium text-theme">
                {translate("departments.name")}
              </label>
              <input
                id="add-shift-name"
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                className="input-field w-full"
                placeholder={translate("attendance.shiftNamePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="add-shift-start" className="mb-1 block text-sm font-medium text-theme">
                    {translate("attendance.startTime")}
                  </label>
                  <input
                    id="add-shift-start"
                    type="time"
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    required
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label htmlFor="add-shift-end" className="mb-1 block text-sm font-medium text-theme">
                    {translate("attendance.endTime")}
                    {overnightPolicyOn && isOvernightWallClockSpan(formStart, formEnd) ? translate("attendance.nextDaySuffix") : ""}
                  </label>
                  <input
                    id="add-shift-end"
                    type="time"
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    required
                    className="input-field w-full"
                  />
                </div>
              </div>
              <p className="text-xs text-theme-muted">
                {translate("attendance.overnightDetected")}
              </p>
            </div>
            {overnightPolicyOn && isOvernightWallClockSpan(formStart, formEnd) ? (
              <p className="text-xs text-theme-muted">
                {translate("attendance.overnightCrosses")}
              </p>
            ) : null}
            <div>
              <label htmlFor="add-shift-grace" className="mb-1 block text-sm font-medium text-theme">
                {translate("attendance.gracePeriod")}
              </label>
              <input
                id="add-shift-grace"
                type="number"
                min={0}
                value={formGrace}
                onChange={(e) => setFormGrace(e.target.value)}
                className="input-field w-full"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>
                {translate("common.cancel")}
              </Button>
              <Button type="submit" loading={formSubmitting}>
                {translate("attendance.addShift")}
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          open={!!editShift}
          onClose={() => setEditShift(null)}
          title={translate("attendance.editShift")}
          size="lg"
        >
          {editShift && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {formError && (
                <div className="alert-error px-3 py-2">
                  {formError}
                </div>
              )}
              <div>
                <label htmlFor="edit-shift-name" className="mb-1 block text-sm font-medium text-theme">
                {translate("departments.name")}
              </label>
                <input
                  id="edit-shift-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="input-field w-full"
                  placeholder={translate("attendance.shiftNamePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-shift-start" className="mb-1 block text-sm font-medium text-theme">
                    {translate("attendance.startTime")}
                  </label>
                    <input
                      id="edit-shift-start"
                      type="time"
                      value={formStart}
                      onChange={(e) => setFormStart(e.target.value)}
                      required
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-shift-end" className="mb-1 block text-sm font-medium text-theme">
                      {translate("attendance.endTime")}
                      {overnightPolicyOn && isOvernightWallClockSpan(formStart, formEnd) ? translate("attendance.nextDaySuffix") : ""}
                    </label>
                    <input
                      id="edit-shift-end"
                      type="time"
                      value={formEnd}
                      onChange={(e) => setFormEnd(e.target.value)}
                      required
                      className="input-field w-full"
                    />
                  </div>
                </div>
                <p className="text-xs text-theme-muted">
                  {translate("attendance.overnightDetected")}
                </p>
              </div>
              {editShift.is_active === false ? (
                <p className="text-xs text-[var(--ds-color-warning-text)]">
                  {translate("attendance.inactiveShiftWarning")}
                </p>
              ) : null}
              <div>
                <label htmlFor="edit-shift-grace" className="mb-1 block text-sm font-medium text-theme">
                  {translate("attendance.gracePeriod")}
                </label>
                <input
                  id="edit-shift-grace"
                  type="number"
                  min={0}
                  value={formGrace}
                  onChange={(e) => setFormGrace(e.target.value)}
                  className="input-field w-full"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setEditShift(null)}>
                  {translate("common.cancel")}
                </Button>
                <Button type="submit" loading={formSubmitting}>
                  {translate("common.save")}
                </Button>
              </div>
            </form>
          )}
        </Modal>
        </>
      )}

      <Modal
        open={!!deleteShift}
        onClose={() => setDeleteShift(null)}
        title={translate("attendance.deleteShift")}
      >
        {deleteShift && (
          <div className="space-y-4">
            <p className="text-sm text-theme-muted">
              {translate("attendance.deleteShiftConfirm", { values: { name: deleteShift.name } })}
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setDeleteShift(null)}>
                {translate("common.cancel")}
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleDeleteConfirm}
                loading={actionLoading === deleteShift.id}
              >
                {translate("common.delete")}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </MainContent>
  );
}
