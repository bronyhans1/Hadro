"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MainContent } from "@/components/layout/MainContent";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuth } from "@/lib/auth/AuthContext";
import { canAccessManagerFeatures } from "@/lib/auth/roles";
import * as leaveApi from "@/lib/api/leave.api";
import * as leaveBalancesApi from "@/lib/api/leaveBalances.api";
import { LeaveSection } from "@/components/leave/LeaveSection";
import { LeaveBalancePageHeader } from "@/components/leave/balance/LeaveBalancePageHeader";
import { LeaveBalanceSnapshotGrid } from "@/components/leave/balance/LeaveBalanceSnapshotGrid";
import { LeaveBalanceTypeCards } from "@/components/leave/balance/LeaveBalanceTypeCards";
import { LeaveBalanceAnalytics } from "@/components/leave/balance/LeaveBalanceAnalytics";
import { LeaveBalanceInsightsPanel } from "@/components/leave/balance/LeaveBalanceInsightsPanel";
import { LeaveBalanceHistoryTable } from "@/components/leave/balance/LeaveBalanceHistoryTable";
import { safeApi } from "@/lib/api/safeApi";
import {
  buildBalanceAnalytics,
  buildBalanceInsights,
  buildBalanceSummaryStats,
  buildBalanceTypeCards,
  sortLeaveHistory,
} from "@/lib/leave/leaveBalanceUtils";
import { isApiError } from "@/lib/types/api";
import { translate } from "@/lib/i18n";
import type { CurrentlyOnLeaveRow, LeaveRequest } from "@/lib/api/leave.api";
import type { LeaveBalanceRecord } from "@/lib/api/leaveBalances.api";

export default function LeaveBalancePage() {
  const { user } = useAuth();
  const businessTz = user?.businessTimeZone ?? "Africa/Accra";
  const isManager = canAccessManagerFeatures(user?.roles);

  const [balances, setBalances] = useState<LeaveBalanceRecord[]>([]);
  const [balancesLoading, setBalancesLoading] = useState(true);
  const [balancesError, setBalancesError] = useState<string | null>(null);
  const [myLeave, setMyLeave] = useState<LeaveRequest[]>([]);
  const [companyLeave, setCompanyLeave] = useState<LeaveRequest[]>([]);
  const [currentlyOnLeave, setCurrentlyOnLeave] = useState<CurrentlyOnLeaveRow[]>([]);
  const [leaveLoading, setLeaveLoading] = useState(true);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const loadBalances = useCallback(async () => {
    setBalancesError(null);
    setBalancesLoading(true);
    try {
      const res = await safeApi(leaveBalancesApi.getMyLeaveBalances());
      if (isApiError(res)) {
        setBalancesError(res.error ?? translate("leave.failedLoadBalances"));
        setBalances([]);
        return;
      }
      setBalances(res.data ?? []);
    } catch (e) {
      setBalancesError(e instanceof Error ? e.message : translate("leave.failedLoadBalances"));
      setBalances([]);
    } finally {
      setBalancesLoading(false);
    }
  }, []);

  const loadMyLeave = useCallback(async () => {
    setLeaveError(null);
    try {
      const res = await safeApi(leaveApi.getMyLeaveRequests());
      if (isApiError(res)) {
        setLeaveError(res.error);
        setMyLeave([]);
        return;
      }
      setMyLeave(res.data ?? []);
    } catch (e) {
      setLeaveError(e instanceof Error ? e.message : translate("leave.failedLoadLeaveHistory"));
      setMyLeave([]);
    }
  }, []);

  const loadCompanyLeave = useCallback(async () => {
    if (!isManager) return;
    try {
      const res = await safeApi(leaveApi.getCompanyLeaveRequests(""));
      if (!isApiError(res)) setCompanyLeave(res.data ?? []);
    } catch {
      setCompanyLeave([]);
    }
  }, [isManager]);

  const loadCurrentlyOnLeave = useCallback(async () => {
    if (!isManager) return;
    try {
      const res = await safeApi(leaveApi.getCurrentlyOnLeave());
      if (!isApiError(res)) setCurrentlyOnLeave(res.data ?? []);
    } catch {
      setCurrentlyOnLeave([]);
    }
  }, [isManager]);

  const load = useCallback(async () => {
    setLeaveLoading(true);
    await Promise.all([loadBalances(), loadMyLeave(), loadCompanyLeave(), loadCurrentlyOnLeave()]);
    setLeaveLoading(false);
  }, [loadBalances, loadMyLeave, loadCompanyLeave, loadCurrentlyOnLeave]);

  useEffect(() => {
    void load();
  }, [load]);

  const summaryStats = useMemo(
    () => buildBalanceSummaryStats(balances, myLeave),
    [balances, myLeave]
  );

  const typeCards = useMemo(() => buildBalanceTypeCards(balances), [balances]);

  const analyticsItems = useMemo(
    () => buildBalanceAnalytics(balances, myLeave),
    [balances, myLeave]
  );

  const insightItems = useMemo(
    () =>
      buildBalanceInsights({
        myLeave,
        companyLeave,
        currentlyOnLeave,
        isManager,
      }),
    [myLeave, companyLeave, currentlyOnLeave, isManager]
  );

  const historyRows = useMemo(() => sortLeaveHistory(myLeave), [myLeave]);

  const loading = balancesLoading && leaveLoading && balances.length === 0 && myLeave.length === 0;

  if (loading) {
    return (
      <MainContent>
        <LoadingState message={translate("leave.loadingLeaveBalance")} className="min-h-[240px]" />
      </MainContent>
    );
  }

  return (
    <MainContent>
      <div className="space-y-8">
        <LeaveBalancePageHeader />

        <LeaveSection title={translate("leave.balanceSummary")} description={translate("leave.balanceSummaryDescription")}>
          <LeaveBalanceSnapshotGrid stats={summaryStats} loading={balancesLoading || leaveLoading} />
        </LeaveSection>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <LeaveSection title={translate("leave.balanceByType")} description={translate("leave.balanceByTypeDescription")}>
              <LeaveBalanceTypeCards
                cards={typeCards}
                loading={balancesLoading}
                error={balancesError}
                onRetry={() => void loadBalances()}
              />
            </LeaveSection>

            <LeaveSection title={translate("leave.historySection")} description={translate("leave.historyDescription")}>
              <LeaveBalanceHistoryTable
                rows={historyRows}
                businessTz={businessTz}
                loading={leaveLoading}
                error={leaveError}
                onRetry={() => void loadMyLeave()}
              />
            </LeaveSection>
          </div>

          <div className="space-y-6">
            <LeaveSection title={translate("leave.analytics")} description={translate("leave.analyticsDescription")}>
              <LeaveBalanceAnalytics items={analyticsItems} />
            </LeaveSection>

            <LeaveBalanceInsightsPanel items={insightItems} />
          </div>
        </div>
      </div>
    </MainContent>
  );
}
