"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MainContent } from "@/components/layout/MainContent";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuth } from "@/lib/auth/AuthContext";
import { canAccessManagerFeatures, isBranchScopedCompanyUser } from "@/lib/auth/roles";
import * as leaveApi from "@/lib/api/leave.api";
import * as usersApi from "@/lib/api/users.api";
import * as leaveTypePoliciesApi from "@/lib/api/leaveTypePolicies.api";
import { LeaveSection } from "@/components/leave/LeaveSection";
import { LeaveRequestsPageHeader } from "@/components/leave/requests/LeaveRequestsPageHeader";
import { LeaveRequestsSnapshotGrid } from "@/components/leave/requests/LeaveRequestsSnapshotGrid";
import { safeApi } from "@/lib/api/safeApi";
import { toUserFacingApiError } from "@/lib/api/userFacingError";
import {
  LeaveRequestsFilters,
  type LeaveStatusFilter,
} from "@/components/leave/requests/LeaveRequestsFilters";
import { LeaveOperationalPanel } from "@/components/leave/requests/LeaveOperationalPanel";
import { LeaveRequestsTable } from "@/components/leave/requests/LeaveRequestsTable";
import { LeaveApprovalModals, useReviewCompensationState } from "@/components/leave/requests/LeaveApprovalModals";
import { RequestLeaveModal } from "@/components/leave/RequestLeaveModal";
import { LeaveCompensationDisplay } from "@/components/leave/LeaveCompensationDisplay";
import { useRequestLeave } from "@/lib/leave/useRequestLeave";
import { LeaveRequestEmployeeCell } from "@/components/leave/requests/LeaveRequestEmployeeCell";
import { leaveTypeLabel } from "@/lib/leave/leaveTypes";
import {
  defaultTerminateReturnDate,
  isApprovedLeaveActive,
} from "@/lib/leave/leaveLifecycle";
import {
  buildLeaveOperationalPanel,
  buildLeaveRequestsSnapshot,
  countActiveLeave,
  hasLeaveRequestFilters,
} from "@/lib/leave/leaveRequestsUtils";
import { employeeLeaveName } from "@/lib/leave/leaveOverviewUtils";
import { formatLeaveStatus } from "@/lib/dashboard/formatters";
import { formatBusinessDateTime } from "@/lib/utils/businessDateTime";
import { isApiError } from "@/lib/types/api";
import { translate } from "@/lib/i18n";
import type { CurrentlyOnLeaveRow, LeaveRequest } from "@/lib/api/leave.api";
import type { UserListItem } from "@/lib/api/users.api";
import { canEditPayrollSchedulePolicy } from "@/lib/auth/roles";

function statusBadge(status: string) {
  const formatted = formatLeaveStatus(status);
  return <Badge variant={formatted.variant}>{formatted.label}</Badge>;
}

function submittedLabel(row: LeaveRequest, businessTz: string): string {
  const iso = row.reviewed_at ?? row.cancelled_at ?? row.terminated_at ?? row.completed_at;
  return iso ? formatBusinessDateTime(iso, businessTz) : "—";
}

export default function LeaveRequestsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const businessTz = user?.businessTimeZone ?? "Africa/Accra";
  const isManager = canAccessManagerFeatures(user?.roles);
  const branchScoped = isBranchScopedCompanyUser(user?.roles);
  const canRequestLeave = true;
  const canOverrideCompensation = canEditPayrollSchedulePolicy(user?.roles);

  const [myLeave, setMyLeave] = useState<LeaveRequest[]>([]);
  const [companyLeave, setCompanyLeave] = useState<LeaveRequest[]>([]);
  const [currentlyOnLeave, setCurrentlyOnLeave] = useState<CurrentlyOnLeaveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [myError, setMyError] = useState<string | null>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<LeaveStatusFilter>("");
  const [compensationByType, setCompensationByType] = useState<
    Record<string, "paid" | "unpaid">
  >({});

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reviewModal, setReviewModal] = useState<{
    leave: LeaveRequest;
    action: "approve" | "reject";
  } | null>(null);
  const [cancelModal, setCancelModal] = useState<LeaveRequest | null>(null);
  const [terminateModal, setTerminateModal] = useState<LeaveRequest | null>(null);
  const [terminateReturnDate, setTerminateReturnDate] = useState("");
  const [terminateReason, setTerminateReason] = useState("");

  const loadMyLeave = useCallback(async () => {
    setMyError(null);
    try {
      const res = await safeApi(leaveApi.getMyLeaveRequests());
      if (isApiError(res)) {
        setMyError(res.error);
        setMyLeave([]);
        return;
      }
      setMyLeave(res.data ?? []);
    } catch (e) {
      setMyError(e instanceof Error ? e.message : translate("leave.failedLoadLeave"));
      setMyLeave([]);
    }
  }, []);

  const loadCompanyLeave = useCallback(async () => {
    if (!isManager) return;
    setCompanyError(null);
    try {
      const res = await safeApi(leaveApi.getCompanyLeaveRequests(statusFilter));
      if (isApiError(res)) {
        setCompanyError(res.error);
        setCompanyLeave([]);
        return;
      }
      setCompanyLeave(res.data ?? []);
    } catch (e) {
      setCompanyError(e instanceof Error ? e.message : translate("leave.failedLoadCompanyLeave"));
      setCompanyLeave([]);
    }
  }, [isManager, statusFilter]);

  const loadCurrentlyOnLeave = useCallback(async () => {
    if (!isManager) return;
    try {
      const res = await safeApi(leaveApi.getCurrentlyOnLeave());
      if (!isApiError(res)) setCurrentlyOnLeave(res.data ?? []);
    } catch {
      setCurrentlyOnLeave([]);
    }
  }, [isManager]);

  const loadUsers = useCallback(async () => {
    if (!isManager) return;
    try {
      const res = await safeApi(usersApi.getUsers());
      if (!isApiError(res)) setUsers(res.data ?? []);
    } catch {
      setUsers([]);
    }
  }, [isManager]);

  const loadLeavePolicies = useCallback(async () => {
    try {
      const res = await safeApi(leaveTypePoliciesApi.listLeaveTypePolicies());
      if (isApiError(res)) {
        setCompensationByType({});
        return;
      }
      const map: Record<string, "paid" | "unpaid"> = {};
      for (const p of res.data ?? []) {
        map[p.leave_type] = p.compensation_type;
      }
      setCompensationByType(map);
    } catch {
      setCompensationByType({});
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      loadMyLeave(),
      loadCompanyLeave(),
      loadCurrentlyOnLeave(),
      loadUsers(),
      loadLeavePolicies(),
    ]);
    setLoading(false);
  }, [loadMyLeave, loadCompanyLeave, loadCurrentlyOnLeave, loadUsers, loadLeavePolicies]);

  useEffect(() => {
    void load();
  }, [load]);

  const primaryRows = useMemo(() => (isManager ? companyLeave : myLeave), [isManager, companyLeave, myLeave]);

  const snapshotStats = useMemo(
    () =>
      buildLeaveRequestsSnapshot(
        primaryRows,
        countActiveLeave(primaryRows, currentlyOnLeave.length)
      ),
    [primaryRows, currentlyOnLeave.length]
  );

  const operationalItems = useMemo(
    () => buildLeaveOperationalPanel(isManager ? companyLeave : myLeave, currentlyOnLeave),
    [isManager, companyLeave, myLeave, currentlyOnLeave]
  );

  const hasFilters = useMemo(() => hasLeaveRequestFilters(statusFilter), [statusFilter]);

  const usersById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const refreshAfterRequest = useCallback(async () => {
    await loadMyLeave();
    if (isManager) await loadCompanyLeave();
  }, [isManager, loadMyLeave, loadCompanyLeave]);

  const requestLeave = useRequestLeave(refreshAfterRequest);
  const {
    reviewCompensation,
    setReviewCompensation,
    reviewOverrideReason,
    setReviewOverrideReason,
  } = useReviewCompensationState(reviewModal);

  async function confirmLeaveReview() {
    if (!reviewModal) return;
    const { leave, action } = reviewModal;
    const companyDefault =
      (leave.leave_compensation_default ?? leave.leave_compensation_type ?? "paid")
        .toString()
        .trim()
        .toLowerCase() === "unpaid"
        ? "unpaid"
        : "paid";
    const isOverride =
      canOverrideCompensation && reviewCompensation !== companyDefault;
    if (isOverride && !reviewOverrideReason.trim()) {
      toast.error(translate("leave.overrideReasonRequired"));
      return;
    }
    setActionLoading(leave.id);
    try {
      const res = await safeApi(
        leaveApi.reviewLeave(leave.id, action === "approve" ? "approve" : "reject", {
          leave_compensation_type: canOverrideCompensation ? reviewCompensation : undefined,
          leave_override_reason:
            canOverrideCompensation && isOverride
              ? reviewOverrideReason.trim()
              : canOverrideCompensation
                ? ""
                : undefined,
        })
      );
      if (isApiError(res)) {
        toast.error(res.error ?? (action === "approve" ? translate("leave.failedApprove") : translate("leave.failedReject")));
        return;
      }
      toast.success(action === "approve" ? translate("leave.leaveApproved") : translate("leave.leaveRejected"));
      setReviewModal(null);
      await loadCompanyLeave();
      await loadMyLeave();
      await loadCurrentlyOnLeave();
    } finally {
      setActionLoading(null);
    }
  }

  async function confirmCancelLeave() {
    if (!cancelModal) return;
    setActionLoading(cancelModal.id);
    try {
      const res = await safeApi(leaveApi.cancelLeave(cancelModal.id));
      if (isApiError(res)) {
        toast.error(res.error ?? translate("leave.failedCancelRequest"));
        return;
      }
      toast.success(translate("leave.requestCancelled"));
      setCancelModal(null);
      await loadMyLeave();
      await loadCompanyLeave();
    } finally {
      setActionLoading(null);
    }
  }

  async function confirmTerminateLeave() {
    if (!terminateModal) return;
    if (!terminateReturnDate.trim()) {
      toast.error(translate("leave.returnDateRequired"));
      return;
    }
    setActionLoading(terminateModal.id);
    try {
      const res = await safeApi(leaveApi.terminateLeave(terminateModal.id, {
        actual_return_date: terminateReturnDate.trim(),
        reason: terminateReason.trim() || null,
      }));
      if (isApiError(res)) {
        toast.error(res.error ?? translate("leave.failedTerminate"));
        return;
      }
      toast.success(translate("leave.leaveTerminated"));
      setTerminateModal(null);
      setTerminateReturnDate("");
      setTerminateReason("");
      await loadCompanyLeave();
      await loadMyLeave();
      await loadCurrentlyOnLeave();
    } finally {
      setActionLoading(null);
    }
  }

  const managerColumns = useMemo(
    () => [
      {
        key: "employee",
        header: translate("leave.employeeName"),
        render: (r: LeaveRequest) => <LeaveRequestEmployeeCell row={r} usersById={usersById} />,
      },
      { key: "department", header: translate("attendance.department"), render: () => "—" },
      {
        key: "leave_type",
        header: translate("leave.leaveTypeTitle"),
        render: (r: LeaveRequest) => <Badge variant="default">{leaveTypeLabel(r.leave_type)}</Badge>,
      },
      {
        key: "compensation",
        header: translate("leave.compensation"),
        render: (r: LeaveRequest) => (
          <LeaveCompensationDisplay
            compensation={r.leave_compensation_type}
            overridden={r.leave_compensation_overridden}
            variant="hr"
          />
        ),
      },
      {
        key: "submitted",
        header: translate("leave.submitted"),
        render: (r: LeaveRequest) => (
          <span className="whitespace-nowrap text-xs tabular-nums">{submittedLabel(r, businessTz)}</span>
        ),
      },
      { key: "start_date", header: translate("leave.startDateTitle"), render: (r: LeaveRequest) => r.start_date },
      { key: "end_date", header: translate("leave.endDateTitle"), render: (r: LeaveRequest) => r.end_date },
      { key: "duration", header: translate("leave.duration"), render: (r: LeaveRequest) => translate("leave.durationDays", { values: { count: r.total_days } }) },
      { key: "status", header: translate("attendance.status"), render: (r: LeaveRequest) => statusBadge(r.status) },
      {
        key: "actions",
        header: translate("attendance.actions"),
        render: (r: LeaveRequest) =>
          r.status?.toLowerCase() === "pending" ? (
            <span className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="success"
                disabled={actionLoading !== null}
                onClick={() => setReviewModal({ leave: r, action: "approve" })}
                aria-label={translate("leave.approveLeaveFor", { values: { name: employeeLeaveName(r) } })}
              >
                {actionLoading === r.id ? "…" : translate("attendance.approve")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="danger"
                disabled={actionLoading !== null}
                onClick={() => setReviewModal({ leave: r, action: "reject" })}
                aria-label={translate("leave.rejectLeaveFor", { values: { name: employeeLeaveName(r) } })}
              >
                {translate("attendance.reject")}
              </Button>
            </span>
          ) : isApprovedLeaveActive(r) ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={actionLoading !== null}
              onClick={() => {
                setTerminateModal(r);
                setTerminateReturnDate(defaultTerminateReturnDate(r));
                setTerminateReason("");
              }}
            >
              {translate("leave.terminateLeave")}
            </Button>
          ) : (
            "—"
          ),
      },
    ],
    [actionLoading, businessTz, usersById]
  );

  const myColumns = useMemo(
    () => [
      {
        key: "leave_type",
        header: translate("leave.leaveTypeTitle"),
        render: (r: LeaveRequest) => <Badge variant="default">{leaveTypeLabel(r.leave_type)}</Badge>,
      },
      {
        key: "compensation",
        header: translate("leave.compensation"),
        render: (r: LeaveRequest) => (
          <LeaveCompensationDisplay
            compensation={r.leave_compensation_type}
            overridden={r.leave_compensation_overridden}
            variant="employee"
          />
        ),
      },
      {
        key: "submitted",
        header: translate("leave.submitted"),
        render: (r: LeaveRequest) => (
          <span className="whitespace-nowrap text-xs tabular-nums">{submittedLabel(r, businessTz)}</span>
        ),
      },
      { key: "start_date", header: translate("leave.startDateTitle"), render: (r: LeaveRequest) => r.start_date },
      { key: "end_date", header: translate("leave.endDateTitle"), render: (r: LeaveRequest) => r.end_date },
      { key: "duration", header: translate("leave.duration"), render: (r: LeaveRequest) => translate("leave.durationDays", { values: { count: r.total_days } }) },
      { key: "status", header: translate("attendance.status"), render: (r: LeaveRequest) => statusBadge(r.status) },
      {
        key: "actions",
        header: translate("attendance.actions"),
        render: (r: LeaveRequest) =>
          r.status?.toLowerCase() === "pending" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={actionLoading !== null}
              onClick={() => setCancelModal(r)}
            >
              {translate("leave.cancelRequest")}
            </Button>
          ) : (
            "—"
          ),
      },
    ],
    [actionLoading, businessTz]
  );

  if (loading && myLeave.length === 0 && companyLeave.length === 0) {
    return (
      <MainContent>
        <LoadingState message={translate("leave.loadingLeaveRequests")} className="min-h-[240px]" />
      </MainContent>
    );
  }

  return (
    <MainContent>
      <div className="space-y-8">
        <LeaveRequestsPageHeader
          canRequestLeave={canRequestLeave}
          onRequestLeave={requestLeave.openRequestLeave}
        />

        <LeaveSection title={translate("leave.requestSnapshot")} description={translate("leave.requestSnapshotDescription")}>
          <LeaveRequestsSnapshotGrid stats={snapshotStats} loading={loading} />
        </LeaveSection>

        <LeaveRequestsFilters
          status={statusFilter}
          onStatusChange={setStatusFilter}
          showStatusFilter={isManager}
          branchScoped={branchScoped}
        />

        <LeaveSection title={translate("navigation.leaveRequests")} description={translate("leave.requestsSectionDescription")}>
          <LeaveRequestsTable
            title={isManager ? (branchScoped ? translate("leave.branchLeaveRequests") : translate("leave.companyLeaveRequests")) : translate("leave.myLeaveRequests")}
            columns={isManager ? managerColumns : myColumns}
            rows={primaryRows}
            keyExtractor={(r) => r.id}
            loading={loading}
            error={isManager ? companyError : myError}
            onRetry={() => void (isManager ? loadCompanyLeave() : loadMyLeave())}
            hasFilters={hasFilters}
          />
        </LeaveSection>

        <LeaveSection title={translate("leave.operationalSummary")} description={translate("leave.operationalSummaryDescription")}>
          <LeaveOperationalPanel items={operationalItems} />
        </LeaveSection>

        {isManager ? (
          <LeaveSection title={translate("leave.myLeaveRequestsTitle")} description={translate("leave.myLeaveRequestsDescription")}>
            <LeaveRequestsTable
              title={translate("leave.myRequests")}
              columns={myColumns}
              rows={myLeave}
              keyExtractor={(r) => r.id}
              error={myError}
              onRetry={() => void loadMyLeave()}
            />
          </LeaveSection>
        ) : null}
      </div>

      <LeaveApprovalModals
        reviewModal={reviewModal}
        cancelModal={cancelModal}
        terminateModal={terminateModal}
        terminateReturnDate={terminateReturnDate}
        terminateReason={terminateReason}
        actionLoading={actionLoading}
        canOverrideCompensation={canOverrideCompensation}
        reviewCompensation={reviewCompensation}
        reviewOverrideReason={reviewOverrideReason}
        onReviewCompensationChange={setReviewCompensation}
        onReviewOverrideReasonChange={setReviewOverrideReason}
        onCloseReview={() => actionLoading === null && setReviewModal(null)}
        onConfirmReview={() => void confirmLeaveReview()}
        onCloseCancel={() => actionLoading === null && setCancelModal(null)}
        onConfirmCancel={() => void confirmCancelLeave()}
        onCloseTerminate={() => actionLoading === null && setTerminateModal(null)}
        onConfirmTerminate={() => void confirmTerminateLeave()}
        onTerminateReturnDateChange={setTerminateReturnDate}
        onTerminateReasonChange={setTerminateReason}
      />

      <RequestLeaveModal
        open={requestLeave.open}
        formStart={requestLeave.formStart}
        formEnd={requestLeave.formEnd}
        formType={requestLeave.formType}
        formReason={requestLeave.formReason}
        formError={requestLeave.formError}
        formSubmitting={requestLeave.formSubmitting}
        compensationByType={compensationByType}
        onClose={requestLeave.closeRequestLeave}
        onSubmit={requestLeave.handleSubmit}
        onFormStartChange={requestLeave.setFormStart}
        onFormEndChange={requestLeave.setFormEnd}
        onFormTypeChange={requestLeave.setFormType}
        onFormReasonChange={requestLeave.setFormReason}
      />
    </MainContent>
  );
}
