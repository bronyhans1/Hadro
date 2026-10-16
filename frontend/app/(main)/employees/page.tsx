"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { MainContent } from "@/components/layout/MainContent";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui";
import { DateInput, Select } from "@/components/ui/FormControls";
import { ClockPlus, Trash2 } from "lucide-react";
import { EmployeesPageHeader } from "@/components/employees/EmployeesPageHeader";
import { EmployeesSummaryCards } from "@/components/employees/EmployeesSummaryCards";
import { EmployeesSearchFilters } from "@/components/employees/EmployeesSearchFilters";
import { EmployeesTablePanel } from "@/components/employees/EmployeesTablePanel";
import { EmployeeAvatar } from "@/components/employees/EmployeeAvatar";
import { safeApi } from "@/lib/api/safeApi";
import { toUserFacingApiError } from "@/lib/api/userFacingError";
import {
  computeEmployeeSummary,
  employeeFullName,
  employeeRoleLabel,
  EMPTY_EMPLOYEE_FILTERS,
  filterEmployees,
  hasActiveEmployeeFilters,
  type EmployeeFilterState,
} from "@/lib/employees/employeeUtils";
import {
  accountStatusBadge,
  remoteBadge,
} from "@/lib/employees/employeeBadges";
import * as usersApi from "@/lib/api/users.api";
import * as shiftsApi from "@/lib/api/shifts.api";
import * as branchesApi from "@/lib/api/branches.api";
import * as departmentsApi from "@/lib/api/departments.api";
import * as companyPolicyApi from "@/lib/api/companyPolicy.api";
import { LeaveBalancesAdminPanel } from "@/components/leave/LeaveBalancesAdminPanel";
import { isApiError } from "@/lib/types/api";
import { formatRoleLabel, formatRolesList } from "@/lib/navigation/formatRoleLabel";
import { formatAccountStatusLabel, formatGenderLabel } from "@/lib/format/displayLabels";
import type { AssignableCompanyRole, CreatableCompanyRole, UserListItem } from "@/lib/api/users.api";
import {
  ASSIGNABLE_COMPANY_ROLES,
  primaryCompanyRole,
  roleChangeErrorMessage,
  roleImpactMessageKey,
} from "@/lib/employees/roleChange";
import type { Shift } from "@/lib/api/shifts.api";
import { filterShiftsForList, formatShiftTimeRange } from "@/lib/utils/shiftDisplay";
import { shiftIdFromSelectValue } from "@/lib/employees/shiftSelectValue";
import type { BranchDto } from "@/lib/api/branches.api";
import type { Department } from "@/lib/api/departments.api";
import { hasRole, isBranchScopedCompanyUser, canAccessEmployeeDirectory } from "@/lib/auth/roles";
import * as wageRatesApi from "@/lib/api/wageRates.api";
import type { WageRateRecord, WageRateType } from "@/lib/api/wageRates.api";
import { useAuth } from "@/lib/auth/AuthContext";
import { useToast } from "@/components/ui/ToastProvider";
import { ManualAttendanceModal } from "@/components/attendance/ManualAttendanceModal";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import * as dayClassApi from "@/lib/api/attendanceDayClassification.api";
import { AccessDeniedState } from "@/components/ui/AccessDeniedState";
import { translate } from "@/lib/i18n";

export default function EmployeesPage() {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const toast = useToast();
  const canAccessDirectory = canAccessEmployeeDirectory(authUser?.roles);
  /** Only company `admin` may reassign branch from the table (not manager/HR/PLATFORM_ADMIN). */
  const canReassignEmployeeBranch = hasRole(authUser?.roles, ["admin"]);
  const branchScoped = isBranchScopedCompanyUser(authUser?.roles);
  const canDeleteCompanyUsers = hasRole(authUser?.roles, ["admin"]);
  const canAssignDepartment =
    hasRole(authUser?.roles, ["admin"]) || hasRole(authUser?.roles, ["manager"]);
  const canRecordManualAttendance = hasRole(authUser?.roles, ["admin", "manager", "HR"]);
  /** Salary day overrides: API allows admin/HR only; managers must not see this panel. */
  const canManageSalaryDayOverride = hasRole(authUser?.roles, ["admin", "HR"]);
  const canManageCompensation = hasRole(authUser?.roles, ["admin", "HR"]);
  const canChangeUserStatus = hasRole(authUser?.roles, ["admin", "HR"]);
  const canChangeRemoteAttendance =
    hasRole(authUser?.roles, ["admin", "HR"]) || hasRole(authUser?.roles, ["manager"]);
  /** Company `admin` only. Platform Admin, manager, and HR do not get this control. */
  const canChangeEmployeeRole = hasRole(authUser?.roles, ["admin"]);
  const canManageLeaveBalances = hasRole(authUser?.roles, ["admin", "HR"]);

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EmployeeFilterState>(EMPTY_EMPLOYEE_FILTERS);
  const [modalOpen, setModalOpen] = useState(false);
  const [formFirst, setFormFirst] = useState("");
  const [formLast, setFormLast] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<CreatableCompanyRole>("employee");
  const [formBranchId, setFormBranchId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [shiftAssigningId, setShiftAssigningId] = useState<string | null>(null);
  const [branchAssigningId, setBranchAssigningId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [deleteConfirmValue, setDeleteConfirmValue] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [departmentAssigningId, setDepartmentAssigningId] = useState<string | null>(null);
  const [manualAttOpen, setManualAttOpen] = useState(false);
  const [manualAttUserId, setManualAttUserId] = useState<string | null>(null);
  const [detailStatusDraft, setDetailStatusDraft] = useState<UserListItem["status"]>("active");
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [roleDraft, setRoleDraft] = useState<AssignableCompanyRole>("employee");
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleSaving, setRoleSaving] = useState(false);
  const [remoteAttendanceSaving, setRemoteAttendanceSaving] = useState(false);

  const [wageRows, setWageRows] = useState<WageRateRecord[]>([]);
  const [wageLoading, setWageLoading] = useState(false);
  const [wageError, setWageError] = useState<string | null>(null);
  const [wageRateType, setWageRateType] = useState<WageRateType>("hourly");
  const [wageEffectiveFrom, setWageEffectiveFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [wageHourly, setWageHourly] = useState("");
  const [wageMonthly, setWageMonthly] = useState("");
  const [wageDivisorType, setWageDivisorType] = useState<"dynamic_working_days" | "fixed_days">(
    "dynamic_working_days"
  );
  const [wageDivisorValue, setWageDivisorValue] = useState("30");
  const [wageSaving, setWageSaving] = useState(false);
  const [wageDeleteTarget, setWageDeleteTarget] = useState<WageRateRecord | null>(null);
  const [wageDeleteSubmitting, setWageDeleteSubmitting] = useState(false);
  const [currencyCode, setCurrencyCode] = useState<"GHS" | "USD">("GHS");


  const [dayOverrideDate, setDayOverrideDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dayOverrideUnits, setDayOverrideUnits] = useState<dayClassApi.DayUnits>(0.5);
  const [dayOverrideNote, setDayOverrideNote] = useState("");
  const [dayOverrideLoading, setDayOverrideLoading] = useState(false);
  const [dayOverrideError, setDayOverrideError] = useState<string | null>(null);
  const [dayOverrideInfo, setDayOverrideInfo] = useState<dayClassApi.DayClassificationInfo | null>(null);

  const payrollEnabled = authUser?.payrollEnabled !== false;
  const showCompensationPanel = useMemo(() => {
    if (!payrollEnabled) return false;
    if (!canManageCompensation || !selectedUser || !authUser) return false;
    if (hasRole(authUser.roles, ["admin"])) return true;
    return Boolean(authUser.branch?.id && selectedUser.branch_id === authUser.branch.id);
  }, [payrollEnabled, canManageCompensation, selectedUser, authUser]);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [usersRes, shiftsRes, policyRes] = await Promise.all([
        safeApi(usersApi.getUsers()),
        safeApi(shiftsApi.getShifts()),
        safeApi(companyPolicyApi.getPolicy()),
      ]);
      if (isApiError(usersRes)) {
        setError(usersRes.error);
        setUsers([]);
        return;
      }
      setUsers(usersRes.data ?? []);
      if (!isApiError(shiftsRes)) {
        setShifts(shiftsRes.data ?? []);
      }
      if (!isApiError(policyRes)) {
        const cc = policyRes.data?.currency_code;
        if (cc === "USD" || cc === "GHS") setCurrencyCode(cc);
      }
      try {
        const branchesRes = await safeApi(branchesApi.getBranches());
        if (!isApiError(branchesRes)) {
          setBranches(branchesRes.data ?? []);
        } else {
          setBranches([]);
        }
      } catch {
        setBranches([]);
      }
      try {
        const depRes = await safeApi(departmentsApi.getDepartments());
        if (!isApiError(depRes)) {
          setDepartments(depRes.data ?? []);
        } else {
          setDepartments([]);
        }
      } catch {
        setDepartments([]);
      }
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : translate("employees.failedLoadEmployees");
      setError(msg);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!canAccessDirectory) {
      setLoading(false);
      return;
    }
    load();
  }, [load, authLoading, canAccessDirectory]);

  useEffect(() => {
    if (!detailOpen || !selectedUser?.id || !showCompensationPanel) {
      setWageRows([]);
      setWageError(null);
      return;
    }
    let cancelled = false;
    setWageLoading(true);
    setWageError(null);
    void (async () => {
      const res = await safeApi(wageRatesApi.getUserWageRates(selectedUser.id));
      if (cancelled) return;
      if (isApiError(res)) {
        setWageError(res.error);
        setWageRows([]);
      } else {
        setWageRows(res.data ?? []);
      }
      setWageLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [detailOpen, selectedUser?.id, showCompensationPanel]);

  useEffect(() => {
    if (!detailOpen || !selectedUser?.id || !canManageSalaryDayOverride) {
      setDayOverrideInfo(null);
      setDayOverrideError(null);
      return;
    }
    let cancelled = false;
    setDayOverrideLoading(true);
    setDayOverrideError(null);
    void (async () => {
      try {
        const res = await safeApi(dayClassApi.getDayClassification({
          user_id: selectedUser.id,
          date: dayOverrideDate,
        }));
        if (cancelled) return;
        if (isApiError(res)) {
          setDayOverrideInfo(null);
          setDayOverrideError(res.error ?? translate("employees.failedLoadDayClassification"));
          return;
        }
        setDayOverrideInfo(res.data);
      } catch (e) {
        if (cancelled) return;
        setDayOverrideInfo(null);
        setDayOverrideError(e instanceof Error ? e.message : translate("employees.failedLoadDayClassification"));
      } finally {
        if (!cancelled) setDayOverrideLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [detailOpen, selectedUser?.id, canManageSalaryDayOverride, dayOverrideDate]);

  async function handleRemoteAttendanceToggle(userId: string, allowed: boolean) {
    setRemoteAttendanceSaving(true);
    try {
      const res = await safeApi(usersApi.updateUser(userId, { remote_attendance_allowed: allowed }));
      if (isApiError(res)) {
        toast.error(res.error ?? translate("employees.failedUpdateRemote"));
        return;
      }
      toast.success(
        allowed ? translate("employees.remoteAuthorized") : translate("employees.remoteAuthorizationRemoved")
      );
      if (res.data) {
        setSelectedUser(res.data);
      }
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : translate("employees.failedUpdateRemote"));
    } finally {
      setRemoteAttendanceSaving(false);
    }
  }

  const handleAssignShift = useCallback(async (userId: string, shiftId: string | null) => {
    setShiftAssigningId(userId);
    try {
      const res = await safeApi(usersApi.assignShift(userId, shiftId));
      if (isApiError(res)) {
        const msg = res.error ?? translate("employees.failedAssignShift");
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success(translate("employees.employeeUpdated"));
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : translate("employees.failedAssignShift");
      setError(msg);
      toast.error(msg);
    } finally {
      setShiftAssigningId(null);
    }
  }, [load, toast]);

  /** Company `admin` only: gated by `canReassignEmployeeBranch` on the column. */
  const handleAssignBranch = useCallback(async (userId: string, branchId: string) => {
    setBranchAssigningId(userId);
    setError(null);
    try {
      const res = await safeApi(usersApi.updateUser(userId, { branch_id: branchId }));
      if (isApiError(res)) {
        const msg = res.error ?? translate("employees.failedUpdateBranch");
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success(translate("employees.employeeUpdated"));
      await load();
      if (detailOpen && selectedUserId === userId) {
        const refreshed = await safeApi(usersApi.getUserById(userId));
        if (!isApiError(refreshed) && refreshed.data) {
          setSelectedUser(refreshed.data);
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : translate("employees.failedUpdateBranch");
      setError(msg);
      toast.error(msg);
    } finally {
      setBranchAssigningId(null);
    }
  }, [load, toast, detailOpen, selectedUserId]);

  async function handleAssignDepartment(userId: string, departmentId: string | null) {
    setDepartmentAssigningId(userId);
    setDetailError(null);
    try {
      const res = await safeApi(usersApi.updateUser(userId, { department_id: departmentId }));
      if (isApiError(res)) {
        const msg = res.error ?? translate("employees.failedUpdateDepartment");
        setDetailError(msg);
        toast.error(msg);
        return;
      }
      setSelectedUser(res.data);
      setDetailStatusDraft(res.data.status);
      toast.success(translate("employees.departmentUpdated"));
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : translate("employees.failedUpdateDepartment");
      setDetailError(msg);
      toast.error(msg);
    } finally {
      setDepartmentAssigningId(null);
    }
  }

  const filtered = useMemo(() => filterEmployees(users, filters), [users, filters]);

  const summaryStats = useMemo(
    () => computeEmployeeSummary(users, departments, branches),
    [users, departments, branches]
  );

  const activeFilters = useMemo(() => hasActiveEmployeeFilters(filters), [filters]);

  const defaultBranchIdForForm = useMemo(() => {
    const d = branches.find((b) => b.is_default);
    return d?.id ?? branches[0]?.id ?? "";
  }, [branches]);

  function resetAddEmployeeForm() {
    setFormFirst("");
    setFormLast("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("employee");
    setFormBranchId(defaultBranchIdForForm);
    setFormError(null);
  }

  function closeAddModal() {
    setModalOpen(false);
    resetAddEmployeeForm();
  }

  function openAddModal() {
    resetAddEmployeeForm();
    setModalOpen(true);
  }

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const first = formFirst.trim();
    const last = formLast.trim();
    const email = formEmail.trim();
    if (!first || !last || !email) {
      setFormError(translate("employees.nameEmailRequired"));
      return;
    }
    if (formPassword.length < 6) {
      setFormError(translate("employees.tempPasswordMin"));
      return;
    }
    setFormSubmitting(true);
    try {
      const res = await safeApi(usersApi.createUser({
        first_name: first,
        last_name: last,
        email,
        temporary_password: formPassword,
        role: formRole,
        ...(!branchScoped && formBranchId.trim()
          ? { branch_id: formBranchId.trim() }
          : {}),
      }));
      if (isApiError(res)) {
        const msg = res.error ?? translate("employees.failedAddEmployee");
        setFormError(msg);
        toast.error(msg);
        return;
      }
      closeAddModal();
      toast.success(translate("employees.employeeAdded"));
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : translate("employees.failedAddEmployee");
      setFormError(msg);
      toast.error(msg);
    } finally {
      setFormSubmitting(false);
    }
  }

  const openDetails = useCallback(async (userId: string) => {
    setDetailOpen(true);
    setSelectedUserId(userId);
    setSelectedUser(null);
    setDetailError(null);
    setDetailLoading(true);
    setDeleteConfirmValue("");
    try {
      const res = await safeApi(usersApi.getUserById(userId));
      if (isApiError(res) || !res.data) {
        setDetailError(isApiError(res) ? res.error : translate("employees.userNotFound"));
        return;
      }
      setSelectedUser(res.data);
      setDetailStatusDraft(res.data.status);
      setRoleDraft(primaryCompanyRole(res.data.roles));
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : translate("employees.failedLoadUserDetails"));
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const columns = useMemo(
    () => [
      {
        key: "employee",
        header: translate("attendance.employee"),
        render: (row: UserListItem) => (
          <div className="flex items-center gap-3">
            <EmployeeAvatar user={row} size="sm" />
            <div className="min-w-0">
              <p className="truncate font-medium" style={{ color: "var(--ds-color-text-primary)" }}>
                {employeeFullName(row)}
              </p>
              <p className="truncate text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
                {row.email}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "roles",
        header: translate("employees.role"),
        render: (row: UserListItem) => (
          <span className="text-sm" style={{ color: "var(--ds-color-text-secondary)" }}>
            {employeeRoleLabel(row)}
          </span>
        ),
      },
      {
        key: "department",
        header: translate("attendance.department"),
        render: (row: UserListItem) =>
          row.department?.name ? (
            <Badge variant="neutral">{row.department.name}</Badge>
          ) : (
            <span style={{ color: "var(--ds-color-text-muted)" }}>—</span>
          ),
      },
      {
        key: "branch",
        header: translate("attendance.branch"),
        render: (row: UserListItem) => row.branch?.name ?? "—",
      },
      {
        key: "status",
        header: translate("attendance.status"),
        render: (row: UserListItem) => (
          <div className="flex flex-wrap items-center gap-1">
            {accountStatusBadge(row.status)}
            {remoteBadge(row.remote_attendance_allowed)}
          </div>
        ),
      },
      {
        key: "phone",
        header: translate("attendance.phone"),
        render: (row: UserListItem) => row.phone_number ?? "—",
      },
      ...(canReassignEmployeeBranch
        ? [
            {
              key: "branch_assign",
              header: translate("employees.assignBranch"),
              render: (row: UserListItem) => (
                <div data-row-control="" onClick={(event) => event.stopPropagation()}>
                <Select
                  value={row.branch_id ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && val !== row.branch_id) {
                      void handleAssignBranch(row.id, val);
                    }
                  }}
                  disabled={branchAssigningId === row.id}
                  className="input-field max-w-[200px] py-1 text-sm disabled:opacity-50"
                  aria-label={translate("employees.assignBranchFor", {
                    values: { name: employeeFullName(row) },
                  })}
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                      {b.is_default ? translate("employees.defaultSuffix") : ""}
                    </option>
                  ))}
                </Select>
                </div>
              ),
            },
          ]
        : []),
      {
        key: "shift",
        header: translate("employees.shift"),
        render: (row: UserListItem) => (
          <div
            data-row-control=""
            className="w-64 max-w-full"
            onClick={(event) => event.stopPropagation()}
          >
            <Select
              value={row.shift_id ?? ""}
              menuMinWidth={320}
              onChange={(e) => {
                void handleAssignShift(row.id, shiftIdFromSelectValue(e.target.value));
              }}
              disabled={shiftAssigningId === row.id}
              className="h-10 w-full px-3 text-sm disabled:opacity-50"
              aria-label={translate("employees.assignShiftFor", {
                values: { name: employeeFullName(row) },
              })}
            >
              <option value="">{translate("employees.noShift")}</option>
              {filterShiftsForList(shifts, false).map((s) => (
                <option key={s.id} value={s.id}>
                  {`${s.name} · ${formatShiftTimeRange(s)}`}
                </option>
              ))}
            </Select>
          </div>
        ),
      },
      {
        key: "view",
        header: translate("attendance.actions"),
        render: (row: UserListItem) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              void openDetails(row.id);
            }}
          >
            {translate("employees.view")}
          </Button>
        ),
      },
    ],
    [
      branches,
      branchAssigningId,
      canReassignEmployeeBranch,
      handleAssignBranch,
      handleAssignShift,
      openDetails,
      shiftAssigningId,
      shifts,
    ]
  );

  const selectedName = useMemo(() => {
    if (!selectedUser) return "";
    return employeeFullName(selectedUser);
  }, [selectedUser]);

  const selectedRoleLabel = useMemo(() => {
    if (!selectedUser?.roles?.length) return "—";
    return formatRolesList(selectedUser.roles, ", ");
  }, [selectedUser]);

  const departmentsForSelectedBranch = useMemo(() => {
    if (!selectedUser?.branch_id) return [];
    return departments.filter((d) => d.branch_id === selectedUser.branch_id);
  }, [departments, selectedUser?.branch_id]);

  const selectedCanBeDeleted = useMemo(() => {
    if (!selectedUser || !canDeleteCompanyUsers) return false;
    const targetRoles = selectedUser.roles ?? [];
    const targetIsAdmin = targetRoles.includes("admin");
    const isSelf = selectedUser.id === authUser?.userId;
    return !targetIsAdmin && !isSelf;
  }, [selectedUser, canDeleteCompanyUsers, authUser?.userId]);

  function closeDetails() {
    setDetailOpen(false);
    setSelectedUserId(null);
    setSelectedUser(null);
    setDetailError(null);
    setDeleteConfirmValue("");
  }

  async function handleDeleteUserFromDetails() {
    if (!selectedUser || !selectedCanBeDeleted || !selectedName) return;
    setDeleteSubmitting(true);
    setDetailError(null);
    try {
      const res = await safeApi(usersApi.deleteUser(selectedUser.id));
      if (isApiError(res)) {
        const msg = res.error ?? translate("employees.failedDeleteUser");
        setDetailError(msg);
        toast.error(msg);
        return;
      }
      closeDetails();
      if (res.data?.outcome === "deactivated_due_to_records") {
        toast.warning(
          res.data.message ?? translate("employees.cannotDeleteRecords")
        );
      } else {
        toast.success(translate("employees.permanentlyDeleted"));
      }
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : translate("employees.failedDeleteUser");
      setDetailError(msg);
      toast.error(msg);
    } finally {
      setDeleteSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <MainContent>
        <LoadingState message={translate("common.loadingEllipsis")} className="min-h-[240px]" />
      </MainContent>
    );
  }

  if (!canAccessDirectory) {
    return (
      <MainContent title={translate("employees.title")}>
        <AccessDeniedState description={translate("employees.directoryRestricted")} />
      </MainContent>
    );
  }

  if (loading && users.length === 0) {
    return (
      <MainContent>
        <div className="space-y-8">
          <EmployeesPageHeader
            branchScoped={branchScoped}
            branchName={authUser?.branch?.name}
            onAddEmployee={openAddModal}
          />
          <EmployeesSummaryCards stats={computeEmployeeSummary([], [], [])} loading />
          <LoadingState message={translate("employees.loadingEmployees")} className="min-h-[240px]" />
        </div>
      </MainContent>
    );
  }

  if (error) {
    return (
      <MainContent>
        <ErrorState message={toUserFacingApiError(error)} onRetry={load} />
      </MainContent>
    );
  }

  return (
    <MainContent>
      <div className="space-y-8">
        <EmployeesPageHeader
          branchScoped={branchScoped}
          branchName={authUser?.branch?.name}
          onAddEmployee={openAddModal}
        />

        <EmployeesSummaryCards stats={summaryStats} loading={loading && users.length === 0} />

        {users.length > 0 ? (
          <EmployeesSearchFilters
            filters={filters}
            onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
            onClear={() => setFilters(EMPTY_EMPLOYEE_FILTERS)}
            branches={branches}
            departments={departments}
            showBranchFilter={!branchScoped}
            resultCount={filtered.length}
            totalCount={users.length}
          />
        ) : null}

        <EmployeesTablePanel
          filtered={filtered}
          totalUsers={users.length}
          loading={loading}
          hasActiveFilters={activeFilters}
          onOpenDetails={(id) => void openDetails(id)}
          onAddEmployee={openAddModal}
          columns={columns}
        />
      </div>

      <Modal open={modalOpen} onClose={closeAddModal} title={translate("employees.addEmployee")}>
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formError && (
            <div className="alert-error px-3 py-2">{formError}</div>
          )}
          <div>
            <label htmlFor="add-first-name" className="mb-1 block text-sm font-medium text-theme">
              {translate("employees.firstName")}
            </label>
            <input
              id="add-first-name"
              type="text"
              value={formFirst}
              onChange={(e) => setFormFirst(e.target.value)}
              required
              autoComplete="given-name"
              className="input-field w-full"
              placeholder={translate("employees.placeholderFirst")}
            />
          </div>
          <div>
            <label htmlFor="add-last-name" className="mb-1 block text-sm font-medium text-theme">
              {translate("employees.lastName")}
            </label>
            <input
              id="add-last-name"
              type="text"
              value={formLast}
              onChange={(e) => setFormLast(e.target.value)}
              required
              autoComplete="family-name"
              className="input-field w-full"
              placeholder={translate("employees.placeholderLast")}
            />
          </div>
          <div>
            <label htmlFor="add-email" className="mb-1 block text-sm font-medium text-theme">
              {translate("attendance.email")}
            </label>
            <input
              id="add-email"
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              required
              autoComplete="email"
              className="input-field w-full"
              placeholder={translate("employees.placeholderEmail")}
            />
          </div>
          <div>
            <label htmlFor="add-role" className="mb-1 block text-sm font-medium text-theme">
              {translate("employees.role")}
            </label>
            <Select
              id="add-role"
              value={formRole}
              onChange={(e) => setFormRole(e.target.value as CreatableCompanyRole)}
              className="input-field w-full"
            >
              {(["employee", "manager", "HR"] as const).map((role) => (
                <option key={role} value={role}>
                  {formatRoleLabel(role)}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-theme-muted">
              {translate("employees.supabaseLoginHint")}
            </p>
          </div>
          {branchScoped ? (
            <div className="surface-callout rounded-md px-3 py-2 text-sm text-theme">
              {translate("employees.branchScopedCreate", {
                values: { branch: authUser?.branch?.name ? `: ${authUser.branch.name}` : "" },
              })}
            </div>
          ) : (
            <div>
              <label htmlFor="add-branch" className="mb-1 block text-sm font-medium text-theme">
                {translate("attendance.branch")}
              </label>
              <Select
                id="add-branch"
                value={formBranchId}
                onChange={(e) => setFormBranchId(e.target.value)}
                className="input-field w-full"
              >
                {branches.length === 0 ? (
                  <option value="">{translate("employees.defaultAfterLoad")}</option>
                ) : (
                  branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                      {b.is_default ? translate("employees.defaultSuffix") : ""}
                    </option>
                  ))
                )}
              </Select>
              <p className="mt-1 text-xs text-theme-muted">
                {translate("employees.branchHint")}
              </p>
            </div>
          )}
          <div>
            <label htmlFor="add-password" className="mb-1 block text-sm font-medium text-theme">
              {translate("employees.temporaryPassword")}
            </label>
            <input
              id="add-password"
              type="password"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="input-field w-full"
              placeholder={translate("employees.passwordMinHint")}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeAddModal}>
              {translate("common.cancel")}
            </Button>
            <Button type="submit" loading={formSubmitting}>
              {translate("employees.addEmployee")}
            </Button>
          </div>
        </form>
      </Modal>

      <Drawer
        open={detailOpen}
        onClose={closeDetails}
        title={translate("employees.employeeProfile")}
        description={translate("employees.employmentDetails")}
        size="lg"
      >
            {detailLoading ? (
              <LoadingState message={translate("employees.loadingUserDetails")} className="min-h-[140px]" />
            ) : detailError ? (
              <div className="alert-error px-3 py-2">{detailError}</div>
            ) : selectedUser ? (
              <div className="space-y-5">
                <div className="rounded-xl border p-4" style={{ borderColor: "var(--ds-color-border)", background: "var(--ds-color-surface-muted)" }}>
                  <div className="flex items-center gap-3">
                    <EmployeeAvatar user={selectedUser} size="lg" />
                    <div>
                      <div className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                        {selectedName || "—"}
                      </div>
                      <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                        {selectedRoleLabel}
                      </div>
                    </div>
                    <div className="ml-auto">{accountStatusBadge(selectedUser.status)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    [translate("attendance.email"), selectedUser.email],
                    [translate("attendance.phone"), selectedUser.phone_number ?? "—"],
                    [translate("employees.gender"), formatGenderLabel(selectedUser.gender)],
                    [
                      translate("employees.dateOfBirth"),
                      selectedUser.date_of_birth
                        ? new Date(selectedUser.date_of_birth).toLocaleDateString()
                        : "—",
                    ],
                    [translate("employees.company"), selectedUser.company_name ?? "—"],
                    [translate("attendance.branch"), selectedUser.branch?.name ?? "—"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border p-3" style={{ borderColor: "var(--border-soft)" }}>
                      <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                        {label}
                      </p>
                      <p className="mt-1 text-sm font-medium break-all" style={{ color: "var(--text-primary)" }}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border p-3" style={{ borderColor: "var(--border-soft)" }}>
                  <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                    {translate("employees.accountStatus")}
                  </p>
                  {canChangeUserStatus ? (
                    <div className="mt-2 space-y-2">
                      <Select
                        value={detailStatusDraft}
                        onChange={(e) =>
                          setDetailStatusDraft(e.target.value as UserListItem["status"])
                        }
                        disabled={statusSaving}
                        className="w-full rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                        style={{
                          borderColor: "var(--border-soft)",
                          background: "var(--surface)",
                          color: "var(--text-primary)",
                        }}
                        aria-label={translate("employees.accountStatusFor", { values: { name: selectedName } })}
                      >
                        <option value="active">{formatAccountStatusLabel("active")}</option>
                        <option value="inactive">{formatAccountStatusLabel("inactive")}</option>
                        <option value="suspended">{formatAccountStatusLabel("suspended")}</option>
                      </Select>
                      <Button
                        type="button"
                        disabled={
                          statusSaving || detailStatusDraft === selectedUser.status
                        }
                        onClick={() => setStatusModalOpen(true)}
                      >
                        {translate("employees.updateStatus")}
                      </Button>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {translate("employees.statusHelp")}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {formatAccountStatusLabel(selectedUser.status)}
                    </p>
                  )}
                </div>

                {canChangeEmployeeRole && selectedUser.id !== authUser?.userId ? (
                  <div className="rounded-lg border p-3" style={{ borderColor: "var(--border-soft)" }}>
                    <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                      {translate("employees.currentRole")}
                    </p>
                    <p className="mt-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {selectedRoleLabel}
                    </p>
                    <div className="mt-2 space-y-2">
                      <label htmlFor="change-role" className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                        {translate("employees.newRole")}
                      </label>
                      <Select
                        id="change-role"
                        value={roleDraft}
                        onChange={(e) => setRoleDraft(e.target.value as AssignableCompanyRole)}
                        disabled={roleSaving}
                        className="w-full rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                        style={{
                          borderColor: "var(--border-soft)",
                          background: "var(--surface)",
                          color: "var(--text-primary)",
                        }}
                        aria-label={translate("employees.changeRole")}
                      >
                        {ASSIGNABLE_COMPANY_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {formatRoleLabel(role)}
                          </option>
                        ))}
                      </Select>
                      <Button
                        type="button"
                        disabled={roleSaving || roleDraft === primaryCompanyRole(selectedUser.roles)}
                        onClick={() => setRoleModalOpen(true)}
                      >
                        {translate("employees.changeRole")}
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="rounded-lg border p-3" style={{ borderColor: "var(--border-soft)" }}>
                  <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                    {translate("employees.remoteAttendance")}
                  </p>
                  {canChangeRemoteAttendance ? (
                    <label className="mt-2 flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border"
                        checked={selectedUser.remote_attendance_allowed === true}
                        disabled={remoteAttendanceSaving}
                        onChange={(e) =>
                          void handleRemoteAttendanceToggle(selectedUser.id, e.target.checked)
                        }
                        aria-label={translate("employees.allowRemoteFor", { values: { name: selectedName } })}
                      />
                      <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                        {translate("employees.allowRemoteAttendance")}
                        <span className="mt-1 block text-xs" style={{ color: "var(--text-muted)" }}>
                          {translate("employees.remoteAttendanceHelp")}
                        </span>
                      </span>
                    </label>
                  ) : (
                    <p className="mt-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {selectedUser.remote_attendance_allowed === true
                        ? translate("employees.authorized")
                        : translate("employees.notAuthorized")}
                    </p>
                  )}
                </div>

                <div className="rounded-lg border p-3" style={{ borderColor: "var(--border-soft)" }}>
                  <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                    {translate("attendance.department")}
                  </p>
                  {canAssignDepartment ? (
                    <div className="mt-2">
                      <Select
                        value={selectedUser.department_id ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          void handleAssignDepartment(selectedUser.id, v === "" ? null : v);
                        }}
                        disabled={departmentAssigningId === selectedUser.id}
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                        style={{
                          borderColor: "var(--border-soft)",
                          background: "var(--surface)",
                          color: "var(--text-primary)",
                        }}
                        aria-label={translate("employees.departmentFor", { values: { name: selectedName } })}
                      >
                        <option value="">{translate("attendance.noDepartment")}</option>
                        {departmentsForSelectedBranch.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </Select>
                      <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                        {translate("employees.departmentBranchHint")}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {selectedUser.department?.name ?? "—"}
                    </p>
                  )}
                </div>

                {canRecordManualAttendance ? (
                  <div className="rounded-lg border p-3" style={{ borderColor: "var(--border-soft)" }}>
                    <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                      {translate("navigation.attendance")}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      {translate("employees.attendanceManualHelp")}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      leftIcon={<ClockPlus className="h-4 w-4" aria-hidden />}
                      onClick={() => {
                        setManualAttUserId(selectedUser.id);
                        setManualAttOpen(true);
                      }}
                      className="mt-2"
                    >
                      {translate("employees.manualClockEllipsis")}
                    </Button>
                  </div>
                ) : null}

                {canManageSalaryDayOverride && detailOpen && selectedUser ? (
                  <div className="rounded-lg border p-3" style={{ borderColor: "var(--border-soft)" }}>
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                      {translate("payroll.salaryDayOverride")}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      {translate("payroll.salaryDayOverrideHelp")}
                    </p>
                    <div className="mt-3">
                      {dayOverrideError ? (
                        <p className="mt-2 text-sm" style={{ color: "var(--state-error-text)" }}>
                          {dayOverrideError}
                        </p>
                      ) : null}
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <div>
                          <DateInput
                            label={translate("payroll.date")}
                            value={dayOverrideDate}
                            onChange={(e) => setDayOverrideDate(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-theme-muted">{translate("payroll.override")}</label>
                          <Select
                            value={String(dayOverrideUnits)}
                            onChange={(e) => setDayOverrideUnits(Number(e.target.value) as dayClassApi.DayUnits)}
                            className="input-field mt-1 w-full py-1.5"
                          >
                            <option value="0">{translate("payroll.notCounted")}</option>
                            <option value="0.5">{translate("payroll.halfDay")}</option>
                            <option value="1">{translate("payroll.fullDay")}</option>
                          </Select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-medium text-theme-muted">{translate("payroll.noteOptional")}</label>
                          <input
                            type="text"
                            value={dayOverrideNote}
                            onChange={(e) => setDayOverrideNote(e.target.value)}
                            placeholder={translate("payroll.dayOverridePlaceholder")}
                            className="input-field mt-1 w-full py-1.5"
                          />
                        </div>
                      </div>
                      <div className="mt-3 space-y-1 text-xs text-theme-muted">
                        {dayOverrideLoading ? (
                          <p>{translate("payroll.loadingDayClassification")}</p>
                        ) : dayOverrideInfo ? (
                          <>
                            <p>
                              {translate("payroll.completedMinutes")}{" "}
                              <span className="font-medium">{dayOverrideInfo.worked_minutes_completed}</span>{" "}
                              · {translate("payroll.incompleteSession")}{" "}
                              <span className="font-medium">
                                {dayOverrideInfo.has_incomplete_session
                                  ? translate("attendance.yes")
                                  : translate("attendance.no")}
                              </span>
                            </p>
                            <p>
                              {translate("payroll.autoUnits")}{" "}
                              <span className="font-medium">{dayOverrideInfo.automatic_day_units}</span>{" "}
                              · {translate("payroll.overrideLabel")}{" "}
                              <span className="font-medium">
                                {dayOverrideInfo.override_day_units == null ? "—" : dayOverrideInfo.override_day_units}
                              </span>{" "}
                              · {translate("payroll.finalLabel")}{" "}
                              <span className="font-medium">{dayOverrideInfo.final_day_units}</span>
                            </p>
                          </>
                        ) : null}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          disabled={dayOverrideLoading}
                          onClick={async () => {
                            if (!selectedUser) return;
                            setDayOverrideError(null);
                            try {
                              const res = await safeApi(dayClassApi.upsertDayOverride({
                                user_id: selectedUser.id,
                                date: dayOverrideDate,
                                day_units: dayOverrideUnits,
                                note: dayOverrideNote.trim() || null,
                              }));
                              if (isApiError(res)) {
                                setDayOverrideError(res.error ?? translate("payroll.failedSaveOverride"));
                                toast.error(res.error ?? translate("payroll.failedSaveOverride"));
                                return;
                              }
                              toast.success(translate("payroll.dayOverrideSaved"));
                              const refreshed = await safeApi(dayClassApi.getDayClassification({
                                user_id: selectedUser.id,
                                date: dayOverrideDate,
                              }));
                              if (!isApiError(refreshed)) setDayOverrideInfo(refreshed.data);
                            } catch (e) {
                              const msg = e instanceof Error ? e.message : translate("payroll.failedSaveOverride");
                              setDayOverrideError(msg);
                              toast.error(msg);
                            }
                          }}
                        >
                          {translate("payroll.saveOverride")}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          leftIcon={<Trash2 className="h-4 w-4" aria-hidden />}
                          disabled={dayOverrideLoading}
                          onClick={async () => {
                            if (!selectedUser) return;
                            setDayOverrideError(null);
                            try {
                              const res = await safeApi(dayClassApi.deleteDayOverride({
                                user_id: selectedUser.id,
                                date: dayOverrideDate,
                              }));
                              if (isApiError(res)) {
                                setDayOverrideError(res.error ?? translate("payroll.failedRemoveOverride"));
                                toast.error(res.error ?? translate("payroll.failedRemoveOverride"));
                                return;
                              }
                              toast.success(translate("payroll.overrideRemoved"));
                              const refreshed = await safeApi(dayClassApi.getDayClassification({
                                user_id: selectedUser.id,
                                date: dayOverrideDate,
                              }));
                              if (!isApiError(refreshed)) setDayOverrideInfo(refreshed.data);
                            } catch (e) {
                              const msg = e instanceof Error ? e.message : translate("payroll.failedRemoveOverride");
                              setDayOverrideError(msg);
                              toast.error(msg);
                            }
                          }}
                        >
                          {translate("payroll.removeOverride")}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {canManageLeaveBalances && selectedUser ? (
                  <LeaveBalancesAdminPanel userId={selectedUser.id} />
                ) : null}

                {showCompensationPanel ? (
                  <div className="rounded-lg border p-3" style={{ borderColor: "var(--border-soft)" }}>
                    <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                      {translate("payroll.compensationTitle")}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      {translate("payroll.compensationHelp")}
                    </p>
                    {wageError ? (
                      <p className="mt-2 text-sm" style={{ color: "var(--state-error-text)" }}>
                        {wageError}
                      </p>
                    ) : null}
                    {wageLoading ? (
                      <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                        {translate("payroll.loadingWageHistory")}
                      </p>
                    ) : wageRows.length === 0 ? (
                      <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                        {translate("payroll.noWageRows")}
                      </p>
                    ) : (
                      <ul className="mt-2 max-h-40 space-y-2 overflow-auto text-sm">
                        {wageRows.map((w) => (
                          <li
                            key={w.id}
                            className="flex flex-wrap items-start justify-between gap-2 border-b pb-2 last:border-0"
                            style={{ borderColor: "var(--border-soft)", color: "var(--text-primary)" }}
                          >
                            <span>
                              <span className="font-medium">{w.effective_from}</span> — {w.rate_type}
                              {w.rate_type === "hourly" && w.hourly_rate != null
                                ? ` ${translate("payroll.hourlyAt", { values: { amount: formatCurrency(w.hourly_rate, currencyCode) } })}`
                                : w.monthly_salary != null
                                  ? ` ${translate("payroll.monthlyAt", { values: { amount: formatCurrency(w.monthly_salary, currencyCode), divisor: w.salary_divisor_type } })}`
                                  : ""}
                            </span>
                            <Button
                              type="button"
                              variant="dangerGhost"
                              size="sm"
                              onClick={() => setWageDeleteTarget(w)}
                              disabled={wageDeleteSubmitting}
                              className="shrink-0"
                              leftIcon={<Trash2 className="h-3.5 w-3.5" aria-hidden />}
                            >
                              {translate("payroll.remove")}
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <form
                      className="mt-3 grid gap-2 sm:grid-cols-2"
                      onSubmit={async (ev) => {
                        ev.preventDefault();
                        if (!selectedUser) return;
                        setWageSaving(true);
                        setWageError(null);
                        try {
                          const body = {
                            user_id: selectedUser.id,
                            rate_type: wageRateType,
                            effective_from: wageEffectiveFrom,
                            ...(wageRateType === "hourly"
                              ? { hourly_rate: Number(wageHourly) }
                              : {
                                  monthly_salary: Number(wageMonthly),
                                  salary_divisor_type: wageDivisorType,
                                  salary_divisor_value: Number(wageDivisorValue) || 30,
                                }),
                          };
                          const res = await safeApi(wageRatesApi.createWageRate(body));
                          if (isApiError(res)) {
                            setWageError(res.error);
                            toast.error(res.error);
                            return;
                          }
                          toast.success(translate("payroll.wageRateSaved"));
                          const list = await safeApi(wageRatesApi.getUserWageRates(selectedUser.id));
                          if (!isApiError(list)) setWageRows(list.data ?? []);
                        } catch (e) {
                          const msg = e instanceof Error ? e.message : translate("payroll.failedToSave");
                          setWageError(msg);
                          toast.error(msg);
                        } finally {
                          setWageSaving(false);
                        }
                      }}
                    >
                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium text-theme-muted">{translate("payroll.rateType")}</label>
                        <Select
                          value={wageRateType}
                          onChange={(e) => setWageRateType(e.target.value as WageRateType)}
                          className="input-field mt-1 w-full py-1.5"
                        >
                          <option value="hourly">{translate("payroll.hourly")}</option>
                          <option value="monthly">{translate("payroll.monthlySalary")}</option>
                        </Select>
                      </div>
                      <div className="sm:col-span-2">
                        <DateInput
                          label={translate("payroll.effectiveFrom")}
                          value={wageEffectiveFrom}
                          onChange={(e) => setWageEffectiveFrom(e.target.value)}
                          required
                        />
                      </div>
                      {wageRateType === "hourly" ? (
                        <div className="sm:col-span-2">
                          <label className="text-xs font-medium text-theme-muted">{translate("payroll.hourlyRate")}</label>
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            value={wageHourly}
                            onChange={(e) => setWageHourly(e.target.value)}
                            className="input-field mt-1 w-full py-1.5"
                            required
                          />
                        </div>
                      ) : (
                        <>
                          <div className="sm:col-span-2">
                            <label className="text-xs font-medium text-theme-muted">{translate("payroll.monthlySalary")}</label>
                            <input
                              type="number"
                              step="0.01"
                              min={0}
                              value={wageMonthly}
                              onChange={(e) => setWageMonthly(e.target.value)}
                              className="input-field mt-1 w-full py-1.5"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-theme-muted">{translate("payroll.divisor")}</label>
                            <Select
                              value={wageDivisorType}
                              onChange={(e) =>
                                setWageDivisorType(e.target.value as "dynamic_working_days" | "fixed_days")
                              }
                              className="input-field mt-1 w-full py-1.5"
                            >
                              <option value="dynamic_working_days">{translate("payroll.dynamicDivisor")}</option>
                              <option value="fixed_days">{translate("payroll.fixedDayCount")}</option>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-theme-muted">
                              {wageDivisorType === "fixed_days" ? translate("leave.daysColumn") : translate("payroll.fallbackUnused")}
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={wageDivisorValue}
                              onChange={(e) => setWageDivisorValue(e.target.value)}
                              className="input-field mt-1 w-full py-1.5"
                            />
                          </div>
                        </>
                      )}
                      <div className="sm:col-span-2">
                        <Button type="submit" loading={wageSaving}>
                          {translate("payroll.addWageRow")}
                        </Button>
                      </div>
                    </form>
                  </div>
                ) : null}

                <div
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: "var(--state-error-border)",
                    background: "var(--state-error-bg)",
                  }}
                >
                  <h3 className="text-sm font-semibold" style={{ color: "var(--state-error-text)" }}>
                    {translate("employees.dangerZone")}
                  </h3>
                  {selectedCanBeDeleted ? (
                    <>
                      <p className="mt-1 text-xs" style={{ color: "var(--state-error-text)" }}>
                        {translate("employees.deleteTypeName")}
                        {" "}
                        <strong>{selectedName}</strong>
                      </p>
                      <input
                        value={deleteConfirmValue}
                        onChange={(e) => setDeleteConfirmValue(e.target.value)}
                        className="mt-3 w-full rounded-md border px-3 py-2 text-sm"
                        style={{
                          borderColor: "var(--border-soft)",
                          background: "var(--surface)",
                          color: "var(--text-primary)",
                        }}
                        placeholder={translate("employees.typeFullName")}
                      />
                      <Button
                        type="button"
                        variant="danger"
                        className="mt-3"
                        loading={deleteSubmitting}
                        onClick={() => void handleDeleteUserFromDetails()}
                        disabled={deleteConfirmValue.trim() !== selectedName || selectedUserId == null}
                      >
                        {translate("employees.deleteUser")}
                      </Button>
                    </>
                  ) : (
                    <p className="mt-1 text-xs" style={{ color: "var(--state-error-text)" }}>
                      {translate("employees.deleteRestricted")}
                    </p>
                  )}
                </div>
              </div>
            ) : null}
      </Drawer>

      <Modal
        open={wageDeleteTarget !== null}
        onClose={() => !wageDeleteSubmitting && setWageDeleteTarget(null)}
        title={translate("payroll.removeWageTitle")}
      >
        {wageDeleteTarget ? (
          <div className="space-y-4">
            <p className="text-sm text-theme">
              {(() => {
                const detail =
                  wageDeleteTarget.rate_type === "hourly" && wageDeleteTarget.hourly_rate != null
                    ? `, ${formatCurrency(wageDeleteTarget.hourly_rate, currencyCode)}/hr`
                    : wageDeleteTarget.monthly_salary != null
                      ? `, ${formatCurrency(wageDeleteTarget.monthly_salary, currencyCode)}/mo`
                      : "";
                const marker = "\u0001";
                const [before, after] = translate("payroll.removeWageBody", { values: { when: marker } }).split(marker);
                return (
                  <>
                    {before}
                    <strong>{wageDeleteTarget.effective_from}</strong>
                    {` (${wageDeleteTarget.rate_type}${detail})`}
                    {after}
                  </>
                );
              })()}
            </p>
            <div className="flex justify-end gap-2 border-t pt-3" style={{ borderColor: "var(--border-soft)" }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setWageDeleteTarget(null)}
                disabled={wageDeleteSubmitting}
              >
                {translate("common.cancel")}
              </Button>
              <Button
                type="button"
                variant="danger"
                loading={wageDeleteSubmitting}
                onClick={async () => {
                  if (!selectedUser || !wageDeleteTarget) return;
                  setWageDeleteSubmitting(true);
                  try {
                    const res = await safeApi(wageRatesApi.deleteWageRate(wageDeleteTarget.id));
                    if (isApiError(res)) {
                      toast.error(res.error ?? translate("payroll.failedRemoveWage"));
                      return;
                    }
                    toast.success(translate("payroll.wageRowRemoved"));
                    setWageDeleteTarget(null);
                    const list = await safeApi(wageRatesApi.getUserWageRates(selectedUser.id));
                    if (!isApiError(list)) setWageRows(list.data ?? []);
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : translate("payroll.failedRemoveWage"));
                  } finally {
                    setWageDeleteSubmitting(false);
                  }
                }}
              >
                {translate("payroll.removeRow")}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={statusModalOpen}
        onClose={() => !statusSaving && setStatusModalOpen(false)}
        title={translate("employees.confirmStatusChange")}
      >
        {selectedUser ? (
          <div className="space-y-4">
            <p className="text-sm text-theme">
              {translate("employees.statusChangeLead")} <strong>{selectedName}</strong>{" "}
              {translate("employees.statusChangeFrom")}{" "}
              <strong>{formatAccountStatusLabel(selectedUser.status)}</strong>{" "}
              {translate("employees.statusChangeTo")}{" "}
              <strong>{formatAccountStatusLabel(detailStatusDraft)}</strong>{translate("employees.statusChangeTheyWill")}{" "}
              {detailStatusDraft === "active"
                ? translate("employees.canSignInAgain")
                : translate("employees.cannotSignInUntil")}
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
              <Button
                type="button"
                loading={statusSaving}
                onClick={async () => {
                  if (!selectedUser) return;
                  setStatusSaving(true);
                  try {
                    const res = await safeApi(usersApi.updateUser(selectedUser.id, {
                      status: detailStatusDraft,
                    }));
                    if (isApiError(res)) {
                      toast.error(res.error ?? translate("employees.failedUpdateStatus"));
                      return;
                    }
                    toast.success(translate("employees.statusUpdated"));
                    setSelectedUser(res.data);
                    setDetailStatusDraft(res.data.status);
                    setStatusModalOpen(false);
                    await load();
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : translate("employees.failedUpdateStatus"));
                  } finally {
                    setStatusSaving(false);
                  }
                }}
              >
                {translate("employees.confirmChange")}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={roleModalOpen}
        onClose={() => !roleSaving && setRoleModalOpen(false)}
        title={translate("employees.confirmRoleChange")}
      >
        {selectedUser ? (
          <div className="space-y-4">
            <p className="text-sm text-theme">
              {translate("employees.roleChangeLead", {
                values: {
                  name: selectedName,
                  current: formatRoleLabel(primaryCompanyRole(selectedUser.roles)),
                  next: formatRoleLabel(roleDraft),
                },
              })}
            </p>
            <p className="text-sm text-theme">{translate(roleImpactMessageKey(roleDraft))}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {translate("employees.roleRefreshHint")}
            </p>
            <div className="flex justify-end gap-2 border-t pt-3" style={{ borderColor: "var(--border-soft)" }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setRoleModalOpen(false)}
                disabled={roleSaving}
              >
                {translate("common.cancel")}
              </Button>
              <Button
                type="button"
                loading={roleSaving}
                onClick={async () => {
                  if (!selectedUser) return;
                  setRoleSaving(true);
                  try {
                    const res = await safeApi(usersApi.changeUserRole(selectedUser.id, roleDraft));
                    if (isApiError(res)) {
                      toast.error(roleChangeErrorMessage(res.code));
                      return;
                    }
                    toast.success(translate("employees.roleUpdated"));
                    setSelectedUser(res.data);
                    setRoleDraft(primaryCompanyRole(res.data.roles));
                    setRoleModalOpen(false);
                    await load();
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : translate("employees.failedUpdateRole"));
                  } finally {
                    setRoleSaving(false);
                  }
                }}
              >
                {roleSaving ? translate("employees.savingRole") : translate("employees.confirmChange")}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <ManualAttendanceModal
        open={manualAttOpen}
        onClose={() => {
          setManualAttOpen(false);
          setManualAttUserId(null);
        }}
        employees={users}
        initialUserId={manualAttUserId}
        onSuccess={() => void load()}
      />
    </MainContent>
  );
}
