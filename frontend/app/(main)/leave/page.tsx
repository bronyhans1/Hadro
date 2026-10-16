"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MainContent } from "@/components/layout/MainContent";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuth } from "@/lib/auth/AuthContext";
import { canAccessManagerFeatures } from "@/lib/auth/roles";
import * as leaveApi from "@/lib/api/leave.api";
import * as leaveBalancesApi from "@/lib/api/leaveBalances.api";
import { LeaveBalanceOverviewTeaser } from "@/components/leave/balance/LeaveBalanceOverviewTeaser";
import { LeavePageHeader } from "@/components/leave/LeavePageHeader";
import { LeaveSnapshotGrid } from "@/components/leave/LeaveSnapshotGrid";
import { LeaveWorkforceSection } from "@/components/leave/LeaveWorkforceSection";
import { LeaveApprovalStatus } from "@/components/leave/LeaveApprovalStatus";
import { LeaveQuickActions } from "@/components/leave/LeaveQuickActions";
import { LeaveRecentActivity } from "@/components/leave/LeaveRecentActivity";
import { LeaveSection } from "@/components/leave/LeaveSection";
import { leaveTypeLabel } from "@/lib/leave/leaveTypes";
import { isCurrentlyOnApprovedLeave } from "@/lib/leave/leaveLifecycle";
import { safeApi } from "@/lib/api/safeApi";
import {
  buildLeaveApprovalStatus,
  buildLeaveSnapshotStats,
} from "@/lib/leave/leaveOverviewUtils";
import { formatLeaveStatus } from "@/lib/dashboard/formatters";
import { formatBusinessDateTime } from "@/lib/utils/businessDateTime";
import { isApiError } from "@/lib/types/api";
import { translate } from "@/lib/i18n";
import type { CurrentlyOnLeaveRow, LeaveRequest } from "@/lib/api/leave.api";
import type { LeaveBalanceRecord } from "@/lib/api/leaveBalances.api";

function statusBadge(status: string) {
  const formatted = formatLeaveStatus(status);
  return <Badge variant={formatted.variant}>{formatted.label}</Badge>;
}

function submittedLabel(row: LeaveRequest, businessTz: string): string {
  const iso = row.reviewed_at ?? row.cancelled_at ?? row.terminated_at ?? row.completed_at;
  return iso ? formatBusinessDateTime(iso, businessTz) : "—";
}

const previewColumns = (businessTz: string) => [
  {
    key: "leave_type",
    header: translate("leave.leaveTypeTitle"),
    render: (r: LeaveRequest) => <Badge variant="default">{leaveTypeLabel(r.leave_type)}</Badge>,
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
  { key: "total_days", header: translate("leave.daysColumn") },
  { key: "status", header: translate("attendance.status"), render: (r: LeaveRequest) => statusBadge(r.status) },
];

export default function LeavePage() {
  const { user } = useAuth();
  const businessTz = user?.businessTimeZone ?? "Africa/Accra";
  const isManager = canAccessManagerFeatures(user?.roles);
  const canRequestLeave = true;

  const [myBalances, setMyBalances] = useState<LeaveBalanceRecord[]>([]);
  const [balancesLoading, setBalancesLoading] = useState(true);
  const [balancesError, setBalancesError] = useState<string | null>(null);
  const [myLeave, setMyLeave] = useState<LeaveRequest[]>([]);
  const [companyLeave, setCompanyLeave] = useState<LeaveRequest[]>([]);
  const [currentlyOnLeave, setCurrentlyOnLeave] = useState<CurrentlyOnLeaveRow[]>([]);
  const [currentlyOnLeaveError, setCurrentlyOnLeaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [myError, setMyError] = useState<string | null>(null);

  const loadMyBalances = useCallback(async () => {
    setBalancesError(null);
    setBalancesLoading(true);
    try {
      const res = await safeApi(leaveBalancesApi.getMyLeaveBalances());
      if (isApiError(res)) {
        setBalancesError(res.error ?? translate("leave.failedLoadBalances"));
        setMyBalances([]);
        return;
      }
      setMyBalances(res.data ?? []);
    } catch (e) {
      setBalancesError(e instanceof Error ? e.message : translate("leave.failedLoadBalances"));
      setMyBalances([]);
    } finally {
      setBalancesLoading(false);
    }
  }, []);

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
    try {
      const res = await safeApi(leaveApi.getCompanyLeaveRequests(""));
      if (isApiError(res)) {
        setCompanyLeave([]);
        return;
      }
      setCompanyLeave(res.data ?? []);
    } catch {
      setCompanyLeave([]);
    }
  }, [isManager]);

  const loadCurrentlyOnLeave = useCallback(async () => {
    if (!isManager) return;
    setCurrentlyOnLeaveError(null);
    try {
      const res = await safeApi(leaveApi.getCurrentlyOnLeave());
      if (isApiError(res)) {
        setCurrentlyOnLeaveError(res.error ?? translate("leave.failedLoad"));
        setCurrentlyOnLeave([]);
        return;
      }
      setCurrentlyOnLeave(res.data ?? []);
    } catch (e) {
      setCurrentlyOnLeaveError(e instanceof Error ? e.message : translate("leave.failedLoad"));
      setCurrentlyOnLeave([]);
    }
  }, [isManager]);

  const load = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadMyBalances(), loadMyLeave(), loadCompanyLeave(), loadCurrentlyOnLeave()]);
    setLoading(false);
  }, [loadMyBalances, loadMyLeave, loadCompanyLeave, loadCurrentlyOnLeave]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshotStats = useMemo(
    () =>
      buildLeaveSnapshotStats({
        isManager,
        myLeave,
        companyLeave,
        currentlyOnLeave,
        balances: myBalances,
      }),
    [isManager, myLeave, companyLeave, currentlyOnLeave, myBalances]
  );

  const approvalStatusItems = useMemo(
    () => buildLeaveApprovalStatus(isManager ? companyLeave : myLeave),
    [isManager, companyLeave, myLeave]
  );

  const recentPreview = useMemo(() => myLeave.slice(0, 8), [myLeave]);
  const previewCols = useMemo(() => previewColumns(businessTz), [businessTz]);

  if (loading && myLeave.length === 0 && companyLeave.length === 0) {
    return (
      <MainContent>
        <LoadingState message={translate("leave.loadingLeave")} className="min-h-[240px]" />
      </MainContent>
    );
  }

  const myCurrentLeave = myLeave.find((r) => isCurrentlyOnApprovedLeave(r)) ?? null;

  return (
    <MainContent>
      <div className="space-y-8">
        <LeavePageHeader />

        {myCurrentLeave ? (
          <Alert variant="warning" title={translate("leave.youAreCurrentlyOnApprovedLeave")}>
            {translate("leave.onLeaveUntilClockIn", { values: { date: myCurrentLeave.end_date } })}
          </Alert>
        ) : null}

        <LeaveSection title={translate("leave.leaveSnapshot")} description={translate("leave.leaveSnapshotDescription")}>
          <LeaveSnapshotGrid stats={snapshotStats} loading={loading} />
        </LeaveSection>

        <LeaveSection title={translate("leave.myLeaveBalances")} description={translate("leave.myLeaveBalancesDescription")}>
          <LeaveBalanceOverviewTeaser
            balances={myBalances}
            loading={balancesLoading}
            error={balancesError}
          />
        </LeaveSection>

        {isManager ? (
          <LeaveSection title={translate("leave.workforceLeaveStatus")} description={translate("leave.workforceLeaveDescription")}>
            <LeaveWorkforceSection
              rows={currentlyOnLeave}
              loading={loading}
              error={currentlyOnLeaveError}
              onRetry={() => void loadCurrentlyOnLeave()}
            />
          </LeaveSection>
        ) : null}

        <LeaveSection
          title={translate("leave.approvalStatus")}
          description={isManager ? translate("leave.approvalStatusManager") : translate("leave.approvalStatusMine")}
        >
          <LeaveApprovalStatus items={approvalStatusItems} />
        </LeaveSection>

        <LeaveQuickActions canRequestLeave={canRequestLeave} />

        <LeaveSection
          title={translate("leave.recentActivity")}
          description={translate("leave.recentActivityDescription")}
        >
          <LeaveRecentActivity
            title={translate("leave.myLeaveRequests")}
            columns={previewCols}
            rows={recentPreview}
            keyExtractor={(r) => r.id}
            error={myError}
            onRetry={() => void loadMyLeave()}
            emptyTitle={translate("leave.noLeaveRequestsYet")}
            emptyDescription={translate("leave.openRequestsToSubmit")}
          />
        </LeaveSection>
      </div>
    </MainContent>
  );
}
