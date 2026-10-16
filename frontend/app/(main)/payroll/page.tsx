"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MainContent } from "@/components/layout/MainContent";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { PayrollPageHeader } from "@/components/payroll/PayrollPageHeader";
import { PayrollSection } from "@/components/payroll/PayrollSection";
import { PayrollPeriodSelector } from "@/components/payroll/PayrollPeriodSelector";
import { PayrollSnapshotGrid } from "@/components/payroll/PayrollSnapshotGrid";
import { PayrollCurrentPeriodCard } from "@/components/payroll/PayrollCurrentPeriodCard";
import { PayrollHealthSection } from "@/components/payroll/PayrollHealthSection";
import { PayrollQuickActions } from "@/components/payroll/PayrollQuickActions";
import { PayrollTimelineSection } from "@/components/payroll/PayrollTimelineSection";
import { PayrollRecentActivity } from "@/components/payroll/PayrollRecentActivity";
import { PayrollOperationalInsights } from "@/components/payroll/PayrollOperationalInsights";
import { PayrollExportSection } from "@/components/payroll/PayrollExportSection";
import { ReopenPayrollModal } from "@/components/payroll/ReopenPayrollModal";
import { useAuth } from "@/lib/auth/AuthContext";
import { canAccessAdminFeatures, canAccessCompanyPayroll, canAdministerPayrollPeriod } from "@/lib/auth/roles";
import * as payrollApi from "@/lib/api/payroll.api";
import * as payrollPeriodApi from "@/lib/api/payrollPeriod.api";
import * as companyPolicyApi from "@/lib/api/companyPolicy.api";
import { isApiError } from "@/lib/types/api";
import type { PayrollReportResult, EarningsSummary, PayrollHealthResponse } from "@/lib/api/payroll.api";
import type { PayrollPeriod } from "@/lib/api/payrollPeriod.api";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { safeApi } from "@/lib/api/safeApi";
import { translate } from "@/lib/i18n";
import { useToast } from "@/components/ui/ToastProvider";
import {
  buildPayrollOperationalInsights,
  buildPayrollRecentActivity,
  buildPayrollSnapshotStats,
} from "@/lib/payroll/payrollOverviewUtils";
import {
  computePayrollDashboardSummary,
  formatPayrollPeriodLabel,
} from "@/lib/payroll/payrollDashboardAggregates";
import type { PayrollReopenReasonCode } from "@/lib/payroll/payrollReopenReasons";

function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-callout rounded-lg px-3 py-2">
      <p className="text-xs font-medium uppercase tracking-wide text-theme-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-theme">{value}</p>
    </div>
  );
}

export default function PayrollPage() {
  const { user } = useAuth();
  const toast = useToast();
  const payrollEnabled = user?.payrollEnabled !== false;
  const canCompanyPayroll = canAccessCompanyPayroll(user?.roles);
  const isPayrollAdmin = canAdministerPayrollPeriod(user?.roles);
  const showPayrollSettingsLink = canAccessAdminFeatures(user?.roles);

  const now = new Date();
  const [payrollYear, setPayrollYear] = useState(now.getFullYear());
  const [payrollMonth, setPayrollMonth] = useState(now.getMonth() + 1);

  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [currencyCode, setCurrencyCode] = useState<"GHS" | "USD">("GHS");
  const [earningsError, setEarningsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [companyData, setCompanyData] = useState<PayrollReportResult | null>(null);
  const [healthData, setHealthData] = useState<PayrollHealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [periodData, setPeriodData] = useState<PayrollPeriod | null>(null);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [periodError, setPeriodError] = useState<string | null>(null);
  const [workflowLoading, setWorkflowLoading] = useState<
    "submit" | "approve" | "lock" | "unlock" | "close" | "reopen" | "regenerate" | null
  >(null);
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [timelineEventCount, setTimelineEventCount] = useState(0);

  const periodLabel = formatPayrollPeriodLabel(payrollYear, payrollMonth);

  const loadEarnings = useCallback(async () => {
    setEarningsError(null);
    try {
      const res = await safeApi(payrollApi.getMyEarningsSummary());
      if (isApiError(res)) {
        setEarningsError(res.error);
        setEarnings(null);
        return;
      }
      setEarnings(res.data ?? null);
    } catch (e) {
      setEarningsError(e instanceof Error ? e.message : translate("payroll.failedLoadEarnings"));
      setEarnings(null);
    }
  }, []);

  const loadPolicyCurrency = useCallback(async () => {
    try {
      const res = await safeApi(companyPolicyApi.getPolicy());
      if (isApiError(res)) return;
      const code = res.data?.currency_code;
      if (code === "USD" || code === "GHS") setCurrencyCode(code);
    } catch {
      // Leave default.
    }
  }, []);

  const loadMonthlyCompanyPayroll = useCallback(async (year: number, month: number) => {
    if (!canCompanyPayroll) return;
    setCompanyLoading(true);
    setHealthLoading(true);
    setPeriodLoading(true);
    setCompanyError(null);
    setHealthError(null);
    setPeriodError(null);
    try {
      const [payrollRes, healthRes, periodRes] = await Promise.all([
        safeApi(payrollApi.getMonthlyPayroll(year, month)),
        safeApi(payrollApi.getPayrollHealth(year, month)),
        safeApi(payrollPeriodApi.getPayrollPeriod(year, month, true)),
      ]);
      if (isApiError(payrollRes)) {
        setCompanyError(payrollRes.error);
        setCompanyData(null);
      } else {
        setCompanyData(payrollRes.data ?? null);
      }
      if (isApiError(healthRes)) {
        setHealthError(healthRes.error);
        setHealthData(null);
      } else {
        setHealthData(healthRes.data ?? null);
      }
      if (isApiError(periodRes)) {
        setPeriodError(periodRes.error);
        setPeriodData(null);
      } else {
        setPeriodData(periodRes.data ?? null);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : translate("payroll.failedLoadCompanyPayroll");
      setCompanyError(msg);
      setHealthError(msg);
      setPeriodError(msg);
      setCompanyData(null);
      setHealthData(null);
      setPeriodData(null);
    } finally {
      setCompanyLoading(false);
      setHealthLoading(false);
      setPeriodLoading(false);
    }
  }, [canCompanyPayroll]);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadEarnings(), loadPolicyCurrency()]);
    setLoading(false);
  }, [loadEarnings, loadPolicyCurrency]);

  useEffect(() => {
    if (!payrollEnabled) return;
    void loadInitial();
  }, [payrollEnabled, loadInitial]);

  useEffect(() => {
    if (!payrollEnabled || !canCompanyPayroll) return;
    void loadMonthlyCompanyPayroll(payrollYear, payrollMonth);
  }, [payrollYear, payrollMonth, canCompanyPayroll, payrollEnabled, loadMonthlyCompanyPayroll]);

  async function handleExportCsv() {
    setExportLoading("csv");
    try {
      const result = await payrollApi.downloadPayrollCsv(payrollYear, payrollMonth);
      if (!result.ok) toast.error(result.error ?? translate("payroll.exportFailed"));
    } finally {
      setExportLoading(null);
    }
  }

  async function handleExportExcel() {
    setExportLoading("excel");
    try {
      const result = await payrollApi.downloadPayrollExcel(payrollYear, payrollMonth);
      if (!result.ok) toast.error(result.error ?? translate("payroll.exportFailed"));
    } finally {
      setExportLoading(null);
    }
  }

  const handleSubmitForReview = useCallback(async () => {
    if (!periodData?.id) return;
    setWorkflowLoading("submit");
    try {
      const res = await safeApi(payrollPeriodApi.submitPayrollPeriodForReview(periodData.id));
      if (isApiError(res)) {
        toast.error(res.error);
        return;
      }
      setPeriodData(res.data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : translate("payroll.failedSubmitReview"));
    } finally {
      setWorkflowLoading(null);
    }
  }, [periodData?.id, toast]);

  const handleApprovePeriod = useCallback(async () => {
    if (!periodData?.id) return;
    setWorkflowLoading("approve");
    try {
      const res = await safeApi(payrollPeriodApi.approvePayrollPeriod(periodData.id));
      if (isApiError(res)) {
        toast.error(res.error);
        return;
      }
      setPeriodData(res.data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : translate("payroll.failedApprovePeriod"));
    } finally {
      setWorkflowLoading(null);
    }
  }, [periodData?.id, toast]);

  const handleLockPeriod = useCallback(async () => {
    if (!periodData?.id) return;
    setWorkflowLoading("lock");
    try {
      const res = await safeApi(payrollPeriodApi.lockPayrollPeriod(periodData.id));
      if (isApiError(res)) {
        toast.error(res.error);
        return;
      }
      setPeriodData(res.data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : translate("payroll.failedLockPeriod"));
    } finally {
      setWorkflowLoading(null);
    }
  }, [periodData?.id, toast]);

  const handleUnlockPeriod = useCallback(async () => {
    if (!periodData?.id) return;
    setWorkflowLoading("unlock");
    try {
      const res = await safeApi(payrollPeriodApi.unlockPayrollPeriod(periodData.id));
      if (isApiError(res)) {
        toast.error(res.error);
        return;
      }
      setPeriodData(res.data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : translate("payroll.failedUnlockPeriod"));
    } finally {
      setWorkflowLoading(null);
    }
  }, [periodData?.id, toast]);

  const handleClosePeriod = useCallback(async () => {
    if (!periodData?.id) return;
    setWorkflowLoading("close");
    try {
      const res = await safeApi(payrollPeriodApi.closePayrollPeriod(periodData.id));
      if (isApiError(res)) {
        toast.error(res.error);
        return;
      }
      setPeriodData(res.data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : translate("payroll.failedArchivePeriod"));
    } finally {
      setWorkflowLoading(null);
    }
  }, [periodData?.id, toast]);

  const handleRegeneratePeriod = useCallback(async () => {
    if (!periodData?.id) return;
    const confirmed = window.confirm(
      translate("payroll.regenerateConfirm")
    );
    if (!confirmed) return;
    setWorkflowLoading("regenerate");
    try {
      const res = await safeApi(payrollPeriodApi.regeneratePayrollPeriod(periodData.id));
      if (isApiError(res)) {
        toast.error(res.error);
        return;
      }
      setPeriodData(res.data);
      await loadMonthlyCompanyPayroll(payrollYear, payrollMonth);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : translate("payroll.failedRegenerate"));
    } finally {
      setWorkflowLoading(null);
    }
  }, [periodData?.id, payrollYear, payrollMonth, loadMonthlyCompanyPayroll, toast]);

  const handleReopenPeriod = useCallback(
    async (payload: { reason_code: PayrollReopenReasonCode; explanation: string }) => {
      if (!periodData?.id) return;
      setWorkflowLoading("reopen");
      try {
        const res = await safeApi(payrollPeriodApi.reopenPayrollPeriod(periodData.id, payload));
        if (isApiError(res)) {
          toast.error(res.error);
          return;
        }
        setPeriodData(res.data);
        setReopenModalOpen(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : translate("payroll.failedReopenPeriod"));
      } finally {
        setWorkflowLoading(null);
      }
    },
    [periodData?.id, toast]
  );

  const dashboardSummary = useMemo(
    () => computePayrollDashboardSummary(companyData?.records ?? []),
    [companyData?.records]
  );

  const periodCardSummary = useMemo(
    () => ({
      employeesIncluded: dashboardSummary.employeesIncluded,
      payrollRecordCount: companyData?.records?.length ?? 0,
      grossPayroll: dashboardSummary.grossPayroll,
    }),
    [dashboardSummary, companyData?.records?.length]
  );

  const displayPeriodLabel = periodData?.period_label ?? periodLabel;

  const snapshotStats = useMemo(
    () =>
      buildPayrollSnapshotStats({
        periodLabel: displayPeriodLabel,
        periodStatus: periodData?.status,
        summary: dashboardSummary,
        health: healthData,
        currencyCode,
        recordCount: periodCardSummary.payrollRecordCount,
      }),
    [
      displayPeriodLabel,
      periodData?.status,
      dashboardSummary,
      healthData,
      currencyCode,
      periodCardSummary.payrollRecordCount,
    ]
  );

  const recentActivity = useMemo(
    () => buildPayrollRecentActivity(companyData?.records ?? [], periodData),
    [companyData?.records, periodData]
  );

  const operationalInsights = useMemo(
    () =>
      buildPayrollOperationalInsights({
        period: periodData,
        periodStatus: periodData?.status,
        health: healthData,
        timelineEventCount,
      }),
    [periodData, healthData, timelineEventCount]
  );

  const showLateColumns = useMemo(
    () =>
      Boolean(
        earnings &&
          ((earnings.month_late_deduction_total ?? 0) > 0 ||
            earnings.daily_history.some((row) => (row.late_deduction ?? 0) > 0))
      ),
    [earnings]
  );

  if (!payrollEnabled) {
    return (
      <MainContent title={translate("navigation.payroll")}>
        <Card>
          <p className="text-sm text-theme">
            {translate("payroll.payrollTurnedOff")}
          </p>
          {showPayrollSettingsLink ? (
            <p className="mt-4">
              <Link
                href="/settings"
                className="text-sm font-medium text-[var(--ds-color-primary)] underline-offset-4 hover:underline focus-visible:outline-none ds-focus-ring rounded"
              >
                {translate("dashboard.openSettings")}
              </Link>
            </p>
          ) : (
            <p className="mt-3 text-sm text-theme-muted">
              If you need payroll access, ask your company admin to enable it in Settings.
            </p>
          )}
        </Card>
      </MainContent>
    );
  }

  if (loading && !earnings && !companyData) {
    return (
      <MainContent>
        <LoadingState message={translate("payroll.loadingPayroll")} className="min-h-[240px]" />
      </MainContent>
    );
  }

  return (
    <MainContent>
      <div className="space-y-8">
        <PayrollPageHeader
          actions={
            <PayrollPeriodSelector
              year={payrollYear}
              month={payrollMonth}
              onYearChange={setPayrollYear}
              onMonthChange={setPayrollMonth}
              disabled={companyLoading}
            />
          }
        />

        {canCompanyPayroll ? (
          <>
            <PayrollSection
              title={translate("payroll.payrollSnapshot")}
              description={translate("payroll.payrollSnapshotDescription")}
            >
              <PayrollSnapshotGrid
                stats={snapshotStats}
                loading={companyLoading && !companyData}
              />
            </PayrollSection>

            <div className="grid gap-8 xl:grid-cols-[1fr_18rem]">
              <div className="min-w-0 space-y-8">
                <PayrollSection
                  title={translate("payroll.currentPayrollPeriod")}
                  description={translate("payroll.currentPeriodDescription")}
                >
                  <PayrollCurrentPeriodCard
                    period={periodData}
                    periodLabel={periodLabel}
                    loading={periodLoading || companyLoading}
                    error={periodError}
                    onRetry={() => void loadMonthlyCompanyPayroll(payrollYear, payrollMonth)}
                    summary={periodCardSummary}
                    currencyCode={currencyCode}
                    healthStatus={healthData?.readiness.status ?? null}
                    workflowLoading={workflowLoading}
                    isPayrollAdmin={isPayrollAdmin}
                    onSubmitForReview={() => void handleSubmitForReview()}
                    onApprove={() => void handleApprovePeriod()}
                    onLock={() => void handleLockPeriod()}
                    onUnlock={() => void handleUnlockPeriod()}
                    onClose={() => void handleClosePeriod()}
                    onReopen={() => setReopenModalOpen(true)}
                    onRegenerate={() => void handleRegeneratePeriod()}
                  />
                </PayrollSection>

                <PayrollSection
                  title={translate("payroll.payrollHealth")}
                  description={translate("payroll.healthDescription")}
                >
                  <PayrollHealthSection
                    health={healthData}
                    periodStatus={periodData?.status}
                    wasPreviouslyReopened={Boolean(periodData?.reopened_at)}
                    loading={healthLoading}
                    error={healthError}
                    onRetry={() => void loadMonthlyCompanyPayroll(payrollYear, payrollMonth)}
                  />
                </PayrollSection>

                <PayrollQuickActions />

                <PayrollSection
                  title={translate("payroll.timeline")}
                  description={translate("payroll.timelineDescription")}
                >
                  <PayrollTimelineSection
                    periodId={periodData?.id}
                    onEventCountChange={setTimelineEventCount}
                  />
                </PayrollSection>

                <PayrollSection
                  title={translate("payroll.recentActivity")}
                  description={translate("payroll.recentActivityDescription")}
                >
                  <PayrollRecentActivity items={recentActivity} />
                </PayrollSection>

                <PayrollSection title={translate("payroll.exportPayroll")} description={translate("payroll.exportPayrollDescription")}>
                  <PayrollExportSection
                    periodLabel={displayPeriodLabel}
                    exportLoading={exportLoading}
                    onExportCsv={handleExportCsv}
                    onExportExcel={handleExportExcel}
                  />
                </PayrollSection>
              </div>

              <PayrollOperationalInsights items={operationalInsights} />
            </div>
          </>
        ) : null}

        <PayrollSection
          id="payroll-earnings"
          title={translate("payroll.earnings")}
          description={translate("payroll.earningsDescription")}
        >
          <Card>
        {earningsError ? (
          <ErrorState message={earningsError} onRetry={loadEarnings} />
        ) : !earnings ? (
          <EmptyState message={translate("payroll.noEarningsYet")} />
        ) : earnings.rate_type === "none" ? (
          <p className="text-sm text-theme-muted">
            {translate("payroll.noCompensationOnFile")}
          </p>
        ) : (
          <>
            {earnings.earnings_period_label ? (
              <p className="mb-3 text-xs text-theme-muted">{earnings.earnings_period_label}</p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <StatMini
                label={earnings.calendar_today ? translate("payroll.todayWithDate", { values: { date: earnings.calendar_today } }) : translate("leave.today")}
                value={formatCurrency(earnings.today_earned, currencyCode)}
              />
              <StatMini label={translate("payroll.thisMonth")} value={formatCurrency(earnings.month_earned_total, currencyCode)} />
              <StatMini
                label={earnings.rate_type === "monthly" ? translate("payroll.expectedSalary") : translate("payroll.rateType")}
                value={
                  earnings.rate_type === "monthly" && earnings.expected_monthly_salary != null
                    ? formatCurrency(earnings.expected_monthly_salary, currencyCode)
                    : earnings.rate_type === "hourly"
                      ? translate("payroll.hourly")
                      : "—"
                }
              />
              <StatMini
                label={translate("payroll.paidDays")}
                value={earnings.rate_type === "monthly" ? String(earnings.paid_days) : "—"}
              />
              <StatMini
                label={translate("payroll.unpaidDays")}
                value={earnings.rate_type === "monthly" ? String(earnings.unpaid_days) : "—"}
              />
              <StatMini
                label={translate("payroll.payableDaysMonth")}
                value={earnings.rate_type === "monthly" ? String(earnings.payable_days_in_month) : "—"}
              />
            </div>
            {(earnings.month_late_deduction_total ?? 0) > 0 || (earnings.today_late_deduction ?? 0) > 0 ? (
              <div className="callout-warning mt-4 space-y-1 px-3 py-3 text-xs">
                <p className="font-semibold uppercase tracking-wide">
                  {translate("payroll.latePayTransparent")}
                </p>
                <p className="opacity-90">
                  {translate("payroll.latePayTransparentHint")}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <StatMini
                    label={translate("payroll.todayBase")}
                    value={formatCurrency(earnings.today_base_before_late ?? earnings.today_earned, currencyCode)}
                  />
                  <StatMini
                    label={translate("payroll.todayLate")}
                    value={
                      (earnings.today_late_deduction ?? 0) > 0
                        ? `−${formatCurrency(earnings.today_late_deduction ?? 0, currencyCode)}`
                        : formatCurrency(0, currencyCode)
                    }
                  />
                  <StatMini
                    label={translate("payroll.todayPayable")}
                    value={formatCurrency(earnings.today_earned, currencyCode)}
                  />
                  <StatMini
                    label={translate("payroll.monthBase")}
                    value={formatCurrency(earnings.month_base_before_late ?? earnings.month_earned_total, currencyCode)}
                  />
                  <StatMini
                    label={translate("payroll.monthLate")}
                    value={
                      (earnings.month_late_deduction_total ?? 0) > 0
                        ? `−${formatCurrency(earnings.month_late_deduction_total ?? 0, currencyCode)}`
                        : formatCurrency(0, currencyCode)
                    }
                  />
                  <StatMini
                    label={translate("payroll.monthPayable")}
                    value={formatCurrency(earnings.month_earned_total, currencyCode)}
                  />
                </div>
              </div>
            ) : null}
            {earnings.rate_type === "monthly" && earnings.daily_rate != null ? (
              <p className="mt-3 text-xs text-theme-muted">
                {translate("payroll.dailyRateAmount", {
                  values: { amount: formatCurrency(earnings.daily_rate, currencyCode) },
                })}{" "}
                {earnings.divisor_type === "dynamic_working_days"
                  ? translate("payroll.dailyRateDynamicSuffix")
                  : earnings.divisor_type === "fixed_days"
                    ? translate("payroll.dailyRateFixedSuffix")
                    : translate("payroll.dailyRateDivisorSuffix")}
              </p>
            ) : null}
            {earnings.daily_history.length > 0 ? (
              <div
                className="mt-4 max-h-48 overflow-auto rounded-md border"
                style={{ borderColor: "var(--border-soft)" }}
              >
                <table className="min-w-full text-sm text-theme">
                  <thead
                    className="sticky top-0 text-left text-xs font-semibold"
                    style={{ background: "var(--surface-muted)", color: "var(--text-muted)" }}
                  >
                    <tr>
                      <th className="px-3 py-2">{translate("payroll.date")}</th>
                      {showLateColumns ? (
                        <>
                          <th className="px-3 py-2 text-right">{translate("payroll.base")}</th>
                          <th className="px-3 py-2 text-right">{translate("payroll.late")}</th>
                          <th className="px-3 py-2 text-right">{translate("payroll.payable")}</th>
                        </>
                      ) : (
                        <th className="px-3 py-2 text-right">{translate("payroll.gross")}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.daily_history.map((row) => {
                      const late = row.late_deduction ?? 0;
                      const base = row.base_before_late ?? row.gross;
                      return (
                        <tr key={row.date} className="border-t" style={{ borderColor: "var(--border-soft)" }}>
                          <td className="px-3 py-1.5">{row.date}</td>
                          {showLateColumns ? (
                            <>
                              <td className="px-3 py-1.5 text-right tabular-nums">
                                {formatCurrency(base, currencyCode)}
                              </td>
                              <td className="px-3 py-1.5 text-right tabular-nums">
                                {late > 0 ? `−${formatCurrency(late, currencyCode)}` : "—"}
                              </td>
                              <td className="px-3 py-1.5 text-right tabular-nums">
                                {formatCurrency(row.gross, currencyCode)}
                              </td>
                            </>
                          ) : (
                            <td className="px-3 py-1.5 text-right tabular-nums">
                              {formatCurrency(row.gross, currencyCode)}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
          </>
        )}
          </Card>
        </PayrollSection>

        <ReopenPayrollModal
          open={reopenModalOpen}
          loading={workflowLoading === "reopen"}
          onClose={() => setReopenModalOpen(false)}
          onSubmit={(payload) => void handleReopenPeriod(payload)}
        />
      </div>
    </MainContent>
  );
}
