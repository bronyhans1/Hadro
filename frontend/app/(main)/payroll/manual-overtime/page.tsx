"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MainContent } from "@/components/layout/MainContent";
import { AccessDeniedState } from "@/components/ui/AccessDeniedState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/ToastProvider";
import { Button } from "@/components/ui/Button";
import { PayrollSection } from "@/components/payroll/PayrollSection";
import { ManualOvertimePageHeader } from "@/components/payroll/manual-overtime/ManualOvertimePageHeader";
import { ManualOvertimeSnapshotGrid } from "@/components/payroll/manual-overtime/ManualOvertimeSnapshotGrid";
import { ManualOvertimeFilters } from "@/components/payroll/manual-overtime/ManualOvertimeFilters";
import { ManualOvertimeTable } from "@/components/payroll/manual-overtime/ManualOvertimeTable";
import { ManualOvertimeOperationalPanel } from "@/components/payroll/manual-overtime/ManualOvertimeOperationalPanel";
import { ManualOvertimeEmployeeCell } from "@/components/payroll/manual-overtime/ManualOvertimeEmployeeCell";
import { ManualOvertimeModals } from "@/components/payroll/manual-overtime/ManualOvertimeModals";
import { useAuth } from "@/lib/auth/AuthContext";
import { canAccessCompanyPayroll, canAccessManagerFeatures } from "@/lib/auth/roles";
import * as manualOvertimeApi from "@/lib/api/manualOvertime.api";
import * as usersApi from "@/lib/api/users.api";
import * as wageRatesApi from "@/lib/api/wageRates.api";
import { safeApi } from "@/lib/api/safeApi";
import { isHourlyEligibleForManualOtHours } from "@/lib/payroll/manualOvertimeEligibility";
import {
  buildManualOvertimeOperationalPanel,
  buildManualOvertimeSnapshot,
  hasManualOvertimeFilters,
} from "@/lib/payroll/manualOvertimeOverviewUtils";
import { isApiError } from "@/lib/types/api";
import { translate } from "@/lib/i18n";
import type { ManualOvertimeEntry, ManualOvertimeEntryStatus } from "@/lib/api/manualOvertime.api";
import type { UserListItem } from "@/lib/api/users.api";
import type { WageRateRecord } from "@/lib/api/wageRates.api";

function statusBadge(status: ManualOvertimeEntryStatus) {
  if (status === "approved") return <Badge variant="success">{translate("leave.approved")}</Badge>;
  if (status === "cancelled") return <Badge variant="default">{translate("leave.cancelled")}</Badge>;
  if (status === "rejected") return <Badge variant="danger">{translate("leave.rejected")}</Badge>;
  return <Badge variant="warning">{translate("payroll.draft")}</Badge>;
}

export default function ManualOvertimePage() {
  const { user } = useAuth();
  const toast = useToast();
  const canManage = canAccessManagerFeatures(user?.roles);
  /** Wage rates for other users are admin/HR only — managers get 403. */
  const canLoadWageRates = canAccessCompanyPayroll(user?.roles);
  const payrollEnabled = user?.payrollEnabled !== false;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | ManualOvertimeEntryStatus>("");

  const [entries, setEntries] = useState<ManualOvertimeEntry[]>([]);
  const [employees, setEmployees] = useState<UserListItem[]>([]);
  const [wageRatesByUserId, setWageRatesByUserId] = useState<Map<string, WageRateRecord[]>>(
    () => new Map()
  );
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [formUserId, setFormUserId] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formHours, setFormHours] = useState("");
  const [formReasonCode, setFormReasonCode] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [overlapModal, setOverlapModal] = useState<{
    summary: manualOvertimeApi.ManualOvertimeOverlapSummary;
  } | null>(null);
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);

  const employeeOptions = useMemo(() => {
    return [...employees].sort((a, b) => {
      const an = `${a.first_name} ${a.last_name}`.trim();
      const bn = `${b.first_name} ${b.last_name}`.trim();
      return an.localeCompare(bn);
    });
  }, [employees]);

  const usersById = useMemo(() => new Map(employees.map((u) => [u.id, u])), [employees]);

  const eligibilityDate = formDate || now.toISOString().slice(0, 10);

  const hourlyEligibleEmployees = useMemo(() => {
    // Managers cannot load others' wage rates — show all; backend enforces hourly eligibility.
    if (!canLoadWageRates) return employeeOptions;
    return employeeOptions.filter((emp) =>
      isHourlyEligibleForManualOtHours(wageRatesByUserId.get(emp.id) ?? [], eligibilityDate)
    );
  }, [canLoadWageRates, employeeOptions, wageRatesByUserId, eligibilityDate]);

  const loadEmployees = useCallback(async () => {
    setEmployeesLoading(true);
    try {
      const res = await safeApi(usersApi.getUsers());
      if (isApiError(res) || !res.data) {
        setEmployees([]);
        setWageRatesByUserId(new Map());
        return;
      }
      const active = res.data.filter((u) => u.status === "active");
      setEmployees(active);

      if (!canLoadWageRates || active.length === 0) {
        setWageRatesByUserId(new Map());
        return;
      }

      const pairs = await Promise.all(
        active.map(async (u) => {
          const wr = await safeApi(wageRatesApi.getUserWageRates(u.id));
          const rates = isApiError(wr) || !wr.data ? [] : wr.data;
          return [u.id, rates] as const;
        })
      );
      setWageRatesByUserId(new Map(pairs));
    } catch {
      setEmployees([]);
      setWageRatesByUserId(new Map());
    } finally {
      setEmployeesLoading(false);
    }
  }, [canLoadWageRates]);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await safeApi(
        manualOvertimeApi.listManualOvertime({
          year,
          month,
          user_id: employeeFilter || undefined,
          status: statusFilter || undefined,
        })
      );
      if (isApiError(res)) {
        setError(res.error ?? translate("payroll.unableLoadManualOt"));
        setEntries([]);
      } else {
        setEntries(res.data ?? []);
      }
    } catch {
      setError(translate("payroll.unableLoadManualOt"));
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [year, month, employeeFilter, statusFilter]);

  useEffect(() => {
    if (canManage && payrollEnabled) void loadEmployees();
  }, [canManage, payrollEnabled, loadEmployees]);

  useEffect(() => {
    if (canManage && payrollEnabled) void loadEntries();
  }, [canManage, payrollEnabled, loadEntries]);

  useEffect(() => {
    if (!formUserId) return;
    const stillEligible = hourlyEligibleEmployees.some((e) => e.id === formUserId);
    if (!stillEligible) setFormUserId("");
  }, [formUserId, hourlyEligibleEmployees]);

  const snapshotStats = useMemo(() => buildManualOvertimeSnapshot(entries), [entries]);
  const operationalItems = useMemo(() => buildManualOvertimeOperationalPanel(entries), [entries]);
  const hasFilters = useMemo(
    () => hasManualOvertimeFilters({ employeeFilter, statusFilter }),
    [employeeFilter, statusFilter]
  );

  function resetCreateForm() {
    setFormUserId("");
    setFormDate("");
    setFormHours("");
    setFormReasonCode("");
    setFormReason("");
    setFormError(null);
  }

  async function submitCreate(acknowledgeOverlap: boolean) {
    setFormError(null);
    const hours = Number(formHours);
    if (!formUserId) {
      setFormError(translate("payroll.selectAnEmployee"));
      return;
    }
    if (!formDate) {
      setFormError(translate("payroll.selectADate"));
      return;
    }
    if (!(hours > 0)) {
      setFormError(translate("payroll.hoursGreaterThanZero"));
      return;
    }
    if (!formReason.trim()) {
      setFormError(translate("payroll.reasonRequired"));
      return;
    }

    setFormSubmitting(true);
    try {
      const res = await safeApi(
        manualOvertimeApi.createManualOvertime({
          user_id: formUserId,
          earnings_date: formDate,
          hours,
          reason: formReason.trim(),
          reason_code: formReasonCode.trim() || undefined,
          overlap_warning_acknowledged: acknowledgeOverlap,
        })
      );

      if (isApiError(res)) {
        const overlap = (res as { overlap?: manualOvertimeApi.ManualOvertimeOverlapSummary })
          .overlap;
        if (overlap && res.error?.toLowerCase().includes("acknowledge")) {
          setOverlapModal({ summary: overlap });
          return;
        }
        setFormError(res.error ?? translate("payroll.failedCreateManualOt"));
        return;
      }

      toast.success(translate("payroll.manualOtCreated"));
      setCreateOpen(false);
      setOverlapModal(null);
      resetCreateForm();
      await loadEntries();
    } catch {
      setFormError(translate("payroll.unableCreateManualOt"));
    } finally {
      setFormSubmitting(false);
    }
  }

  const handleCancel = useCallback(
    async (entry: ManualOvertimeEntry) => {
      if (entry.status !== "approved") return;
      setCancelLoading(entry.id);
      try {
        const res = await safeApi(manualOvertimeApi.cancelManualOvertime(entry.id));
        if (isApiError(res)) {
          toast.error(res.error ?? translate("payroll.failedCancelEntry"));
          return;
        }
        toast.success(translate("payroll.manualOtCancelled"));
        await loadEntries();
      } catch {
        toast.error(translate("payroll.unableCancelEntry"));
      } finally {
        setCancelLoading(null);
      }
    },
    [loadEntries, toast]
  );

  const tableColumns = useMemo(
    () => [
      {
        key: "employee",
        header: translate("attendance.employee"),
        render: (row: ManualOvertimeEntry) => (
          <ManualOvertimeEmployeeCell entry={row} usersById={usersById} />
        ),
      },
      {
        key: "department",
        header: translate("attendance.department"),
        render: (row: ManualOvertimeEntry) =>
          usersById.get(row.user_id)?.department?.name ?? "—",
      },
      {
        key: "date",
        header: translate("payroll.date"),
        render: (row: ManualOvertimeEntry) => row.earnings_date,
      },
      {
        key: "hours",
        header: translate("payroll.hours"),
        render: (row: ManualOvertimeEntry) => row.hours.toFixed(2),
      },
      {
        key: "reason",
        header: translate("leave.reason"),
        render: (row: ManualOvertimeEntry) => (
          <span title={row.reason}>
            {row.reason_code ? `[${row.reason_code}] ` : ""}
            {row.reason.length > 48 ? `${row.reason.slice(0, 48)}…` : row.reason}
          </span>
        ),
      },
      {
        key: "created_by",
        header: translate("payroll.submittedBy"),
        render: (row: ManualOvertimeEntry) => row.created_by_name ?? row.created_by,
      },
      {
        key: "status",
        header: translate("attendance.status"),
        render: (row: ManualOvertimeEntry) => statusBadge(row.status),
      },
      {
        key: "actions",
        header: translate("attendance.actions"),
        render: (row: ManualOvertimeEntry) =>
          row.status === "approved" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={cancelLoading === row.id}
              onClick={() => handleCancel(row)}
            >
              {translate("common.cancel")}
            </Button>
          ) : (
            "—"
          ),
      },
    ],
    [cancelLoading, usersById, handleCancel]
  );

  if (!canManage) {
    return (
      <MainContent>
        <AccessDeniedState
          title={translate("payroll.featureUnavailable")}
          description={translate("payroll.manualOtRoleLimit")}
        />
      </MainContent>
    );
  }

  if (!payrollEnabled) {
    return (
      <MainContent>
        <AccessDeniedState
          title={translate("payroll.payrollDisabled")}
          description={translate("payroll.manualOtRequiresPayroll")}
        />
      </MainContent>
    );
  }

  if (loading && entries.length === 0 && employeesLoading) {
    return (
      <MainContent>
        <LoadingState message={translate("payroll.loadingManualOvertime")} className="min-h-[240px]" />
      </MainContent>
    );
  }

  return (
    <MainContent>
      <div className="space-y-8">
        <ManualOvertimePageHeader />

        <PayrollSection title={translate("payroll.overtimeSnapshot")} description={translate("payroll.overtimeSnapshotDescription")}>
          <ManualOvertimeSnapshotGrid stats={snapshotStats} loading={loading && entries.length === 0} />
        </PayrollSection>

        <ManualOvertimeFilters
          year={year}
          month={month}
          onPeriodChange={(y, m) => {
            setYear(y);
            setMonth(m);
          }}
          employeeFilter={employeeFilter}
          onEmployeeFilterChange={setEmployeeFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          employees={employeeOptions}
        />

        <ManualOvertimeTable
          columns={tableColumns}
          rows={entries}
          loading={loading}
          error={error}
          onRetry={() => void loadEntries()}
          hasFilters={hasFilters}
          onAddEntry={() => {
            resetCreateForm();
            setCreateOpen(true);
          }}
        />

        <PayrollSection title={translate("payroll.operationalSummary")} description={translate("payroll.operationalSummaryDescription")}>
          <ManualOvertimeOperationalPanel items={operationalItems} />
        </PayrollSection>
      </div>

      <ManualOvertimeModals
        createOpen={createOpen}
        formSubmitting={formSubmitting}
        employeesLoading={employeesLoading}
        hourlyEligibleEmployees={hourlyEligibleEmployees}
        formUserId={formUserId}
        formDate={formDate}
        formHours={formHours}
        formReasonCode={formReasonCode}
        formReason={formReason}
        formError={formError}
        overlapModal={overlapModal}
        onCloseCreate={() => {
          if (!formSubmitting) {
            setCreateOpen(false);
            setOverlapModal(null);
          }
        }}
        onSubmitCreate={(ack) => void submitCreate(ack)}
        onFormUserIdChange={setFormUserId}
        onFormDateChange={setFormDate}
        onFormHoursChange={setFormHours}
        onFormReasonCodeChange={setFormReasonCode}
        onFormReasonChange={setFormReason}
        onCloseOverlap={() => setOverlapModal(null)}
      />
    </MainContent>
  );
}
