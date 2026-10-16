"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MainContent } from "@/components/layout/MainContent";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PayrollSection } from "@/components/payroll/PayrollSection";
import { PayrollRecordsPageHeader } from "@/components/payroll/records/PayrollRecordsPageHeader";
import { PayrollRecordsSnapshotGrid } from "@/components/payroll/records/PayrollRecordsSnapshotGrid";
import { PayrollRecordsFilters } from "@/components/payroll/records/PayrollRecordsFilters";
import { PayrollRecordsTable } from "@/components/payroll/records/PayrollRecordsTable";
import { PayrollRecordsMyTable } from "@/components/payroll/records/PayrollRecordsMyTable";
import { PayrollRecordsSummaryPanel } from "@/components/payroll/records/PayrollRecordsSummaryPanel";
import { PayrollRecordsRecentActivity } from "@/components/payroll/records/PayrollRecordsRecentActivity";
import { useAuth } from "@/lib/auth/AuthContext";
import { canAccessAdminFeatures, canAccessCompanyPayroll } from "@/lib/auth/roles";
import * as payrollApi from "@/lib/api/payroll.api";
import * as payrollPeriodApi from "@/lib/api/payrollPeriod.api";
import * as companyPolicyApi from "@/lib/api/companyPolicy.api";
import { isApiError } from "@/lib/types/api";
import type { PayrollRecord, PayrollReportResult } from "@/lib/api/payroll.api";
import type { PayrollPeriod } from "@/lib/api/payrollPeriod.api";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { useToast } from "@/components/ui/ToastProvider";
import {
  buildPayrollRecordsRecentActivity,
  buildPayrollRecordsSnapshot,
  buildPayrollRecordsSummaryPanel,
} from "@/lib/payroll/payrollRecordsOverviewUtils";
import {
  computeEmployeeRollups,
  computePayrollDashboardSummary,
  filterRecordsForMonth,
  formatPayrollPeriodLabel,
} from "@/lib/payroll/payrollDashboardAggregates";
import {
  displayAttendanceDay,
  displayHoursWorked,
  displayOvertimeMinutes,
  displayRegularMinutes,
  displayRateHeader,
  isSalaryDailyPayrollRecord,
} from "@/lib/payroll/payrollSemantics";
import { safeApi } from "@/lib/api/safeApi";
import { translate } from "@/lib/i18n";

const PAYROLL_TABLE_HELP = translate("payroll.recordsHelp");

function statusBadge(status: string | undefined) {
  if (!status) return "—";
  const s = status.toLowerCase();
  if (s === "approved") return <Badge variant="success">{translate("leave.approved")}</Badge>;
  if (s === "locked") return <Badge variant="default">{translate("payroll.locked")}</Badge>;
  return <Badge variant="warning">{translate("payroll.draft")}</Badge>;
}

function payrollRowBreakdown(r: PayrollRecord): { base: number; late: number; net: number } {
  const net = r.gross_earnings;
  const late =
    typeof r.late_deduction_amount === "number" && r.late_deduction_amount > 0
      ? r.late_deduction_amount
      : 0;
  const hasBase =
    typeof r.gross_before_late_deduction === "number" && !Number.isNaN(r.gross_before_late_deduction);
  const base = hasBase ? r.gross_before_late_deduction! : net + late;
  return { base, late, net };
}

function payrollTypeBadge(record: { record_type?: string | null; earning_source?: string | null }) {
  if ((record.earning_source ?? "").toLowerCase() === "paid_leave" || record.record_type === "leave_hourly") {
    return <Badge variant="default">{translate("payroll.paidLeave")}</Badge>;
  }
  if (isSalaryDailyPayrollRecord(record.record_type)) {
    return <Badge variant="default">{translate("payroll.monthlyDayCredit")}</Badge>;
  }
  if (record.record_type === "manual_overtime") {
    return <Badge variant="default">{translate("payroll.manualOvertimeBadge")}</Badge>;
  }
  return <Badge variant="success">{translate("payroll.hourlySession")}</Badge>;
}

function shadowOvertimeSummary(data: PayrollReportResult | null): string | null {
  const shadow = data?.shadow_overtime;
  if (!shadow) return null;
  return translate("payroll.durationOtReporting", {
    values: {
      duration: shadow.total_duration_ot_minutes,
      shift: shadow.total_shift_ot_minutes,
    },
  });
}

export default function PayrollRecordsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const payrollEnabled = user?.payrollEnabled !== false;
  const canCompanyPayroll = canAccessCompanyPayroll(user?.roles);
  const showPayrollSettingsLink = canAccessAdminFeatures(user?.roles);

  const now = new Date();
  const [payrollYear, setPayrollYear] = useState(now.getFullYear());
  const [payrollMonth, setPayrollMonth] = useState(now.getMonth() + 1);

  const [myData, setMyData] = useState<PayrollReportResult | null>(null);
  const [companyData, setCompanyData] = useState<PayrollReportResult | null>(null);
  const [periodData, setPeriodData] = useState<PayrollPeriod | null>(null);
  const [currencyCode, setCurrencyCode] = useState<"GHS" | "USD">("GHS");

  const [loading, setLoading] = useState(true);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [myError, setMyError] = useState<string | null>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [payslipLoading, setPayslipLoading] = useState<string | null>(null);
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);

  const periodLabel = formatPayrollPeriodLabel(payrollYear, payrollMonth);
  const displayPeriodLabel = periodData?.period_label ?? periodLabel;

  const activeRecords = useMemo(() => {
    if (canCompanyPayroll) return companyData?.records ?? [];
    return filterRecordsForMonth(myData?.records ?? [], payrollYear, payrollMonth);
  }, [canCompanyPayroll, companyData?.records, myData?.records, payrollYear, payrollMonth]);

  const myRecordsForPeriod = useMemo(() => {
    if (!myData?.records) return [];
    return filterRecordsForMonth(myData.records, payrollYear, payrollMonth);
  }, [myData?.records, payrollYear, payrollMonth]);

  const dashboardSummary = useMemo(
    () => computePayrollDashboardSummary(activeRecords),
    [activeRecords]
  );

  const employeeRollups = useMemo(() => computeEmployeeRollups(activeRecords), [activeRecords]);

  const snapshotStats = useMemo(
    () =>
      buildPayrollRecordsSnapshot({
        records: activeRecords,
        summary: dashboardSummary,
        currencyCode,
      }),
    [activeRecords, dashboardSummary, currencyCode]
  );

  const summaryPanelItems = useMemo(
    () =>
      buildPayrollRecordsSummaryPanel({
        rollups: employeeRollups,
        records: activeRecords,
        currencyCode,
      }),
    [employeeRollups, activeRecords, currencyCode]
  );

  const recentActivity = useMemo(
    () => buildPayrollRecordsRecentActivity(activeRecords, canCompanyPayroll ? periodData : null),
    [activeRecords, canCompanyPayroll, periodData]
  );

  const myPeriodTotals = useMemo(() => {
    let gross = 0;
    let hours = 0;
    let late = 0;
    for (const r of myRecordsForPeriod) {
      gross += r.gross_earnings ?? 0;
      if (!isSalaryDailyPayrollRecord(r.record_type)) {
        hours += r.hours_worked ?? 0;
      }
      late += r.late_deduction_amount ?? 0;
    }
    return { gross, hours, late };
  }, [myRecordsForPeriod]);

  const showLateInRecords = useMemo(() => {
    const anyLate = (recs: PayrollRecord[] | undefined) =>
      (recs ?? []).some((r) => (r.late_deduction_amount ?? 0) > 0);
    return anyLate(myRecordsForPeriod) || anyLate(companyData?.records);
  }, [myRecordsForPeriod, companyData?.records]);

  async function loadMyPayroll() {
    setMyError(null);
    try {
      const res = await safeApi(payrollApi.getMyPayroll());
      if (isApiError(res)) {
        setMyError(res.error);
        setMyData(null);
        return;
      }
      setMyData(res.data ?? null);
    } catch (e) {
      setMyError(e instanceof Error ? e.message : translate("payroll.failedLoadPayroll"));
      setMyData(null);
    }
  }

  async function loadPolicyCurrency() {
    try {
      const res = await safeApi(companyPolicyApi.getPolicy());
      if (isApiError(res)) return;
      const code = res.data?.currency_code;
      if (code === "USD" || code === "GHS") setCurrencyCode(code);
    } catch {
      // Leave default.
    }
  }

  const loadMonthlyCompanyPayroll = useCallback(async (year: number, month: number) => {
    if (!canCompanyPayroll) return;
    setCompanyLoading(true);
    setCompanyError(null);
    try {
      const [payrollRes, periodRes] = await Promise.all([
        safeApi(payrollApi.getMonthlyPayroll(year, month)),
        safeApi(payrollPeriodApi.getPayrollPeriod(year, month, true)),
      ]);
      if (isApiError(payrollRes)) {
        setCompanyError(payrollRes.error);
        setCompanyData(null);
      } else {
        setCompanyData(payrollRes.data ?? null);
      }
      if (isApiError(periodRes)) {
        setPeriodData(null);
      } else {
        setPeriodData(periodRes.data ?? null);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : translate("payroll.failedLoadCompanyPayroll");
      setCompanyError(msg);
      setCompanyData(null);
      setPeriodData(null);
    } finally {
      setCompanyLoading(false);
    }
  }, [canCompanyPayroll]);

  useEffect(() => {
    if (!payrollEnabled) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      await Promise.all([loadMyPayroll(), loadPolicyCurrency()]);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [payrollEnabled]);

  useEffect(() => {
    if (!payrollEnabled || !canCompanyPayroll) return;
    void loadMonthlyCompanyPayroll(payrollYear, payrollMonth);
    setExpandedEmployeeId(null);
  }, [payrollYear, payrollMonth, canCompanyPayroll, payrollEnabled, loadMonthlyCompanyPayroll]);

  const handlePayslip = useCallback(async (id: string) => {
    setPayslipLoading(id);
    try {
      const result = await payrollApi.downloadPayslip(id);
      if (!result.ok) toast.error(result.error ?? translate("payroll.downloadFailed"));
    } finally {
      setPayslipLoading(null);
    }
  }, [toast]);

  const lateAmountColumns = useMemo(
    () =>
      showLateInRecords
        ? ([
            {
              key: "base_before_late",
              header: translate("payroll.base"),
              render: (r: PayrollRecord) => formatCurrency(payrollRowBreakdown(r).base, currencyCode),
            },
            {
              key: "late_deduction",
              header: translate("payroll.late"),
              render: (r: PayrollRecord) => {
                const { late } = payrollRowBreakdown(r);
                return late > 0 ? `−${formatCurrency(late, currencyCode)}` : "—";
              },
            },
          ] as const)
        : [],
    [showLateInRecords, currencyCode]
  );

  const payrollCoreColumns = useMemo(
    () => [
      {
        key: "record_type",
        header: translate("payroll.type"),
        render: (r: PayrollRecord) => payrollTypeBadge(r),
      },
      { key: "payroll_date", header: translate("payroll.payrollDate"), render: (r: PayrollRecord) => r.payroll_date },
      {
        key: "attendance_day",
        header: translate("payroll.attendanceDay"),
        render: (r: PayrollRecord) => displayAttendanceDay(r),
      },
      { key: "hours_worked", header: translate("payroll.hours"), render: (r: PayrollRecord) => displayHoursWorked(r) },
      {
        key: "regular_minutes",
        header: translate("payroll.regularMin"),
        render: (r: PayrollRecord) => displayRegularMinutes(r),
      },
      {
        key: "overtime_minutes",
        header: translate("payroll.paidOtMin"),
        render: (r: PayrollRecord) => displayOvertimeMinutes(r),
      },
      {
        key: "shadow_duration_ot",
        header: translate("payroll.durationOtMin"),
        render: (r: PayrollRecord) => {
          const v = r.shadow_overtime?.duration_ot_minutes;
          return v == null ? "—" : String(v);
        },
      },
      {
        key: "shadow_shift_ot",
        header: translate("payroll.shiftOtMin"),
        render: (r: PayrollRecord) => {
          const v = r.shadow_overtime?.shift_ot_minutes;
          return v == null ? "—" : String(v);
        },
      },
      {
        key: "hourly_rate",
        header: translate("payroll.rate"),
        render: (r: PayrollRecord) => {
          const val = r.hourly_rate != null ? formatCurrency(r.hourly_rate, currencyCode) : "—";
          if (isSalaryDailyPayrollRecord(r.record_type)) {
            return (
              <span title={translate("payroll.dailyRateTitle")}>
                <span className="block text-xs text-theme-muted">{displayRateHeader(r.record_type)}</span>
                {val}
              </span>
            );
          }
          return val;
        },
      },
      ...lateAmountColumns,
      {
        key: "gross_earnings",
        header: showLateInRecords ? translate("payroll.payable") : translate("payroll.gross"),
        render: (r: PayrollRecord) => formatCurrency(r.gross_earnings, currencyCode),
      },
      { key: "status", header: translate("attendance.status"), render: (r: PayrollRecord) => statusBadge(r.status) },
    ],
    [currencyCode, lateAmountColumns, showLateInRecords]
  );

  const payslipColumn = useMemo(
    () => ({
      key: "payslip",
      header: "",
      render: (r: PayrollRecord) => (
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            void handlePayslip(r.id);
          }}
          disabled={payslipLoading !== null}
        >
          {payslipLoading === r.id ? "…" : translate("payroll.payslip")}
        </Button>
      ),
    }),
    [handlePayslip, payslipLoading]
  );

  const recordColumns = useMemo(
    () => [...payrollCoreColumns, payslipColumn],
    [payrollCoreColumns, payslipColumn]
  );

  if (!payrollEnabled) {
    return (
      <MainContent title={translate("navigation.payrollRecords")}>
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

  const isInitialLoading = loading && !myData && !companyData;

  if (isInitialLoading) {
    return (
      <MainContent>
        <LoadingState message={translate("payroll.loadingPayrollRecords")} className="min-h-[240px]" />
      </MainContent>
    );
  }

  return (
    <MainContent>
      <div className="space-y-8">
        <PayrollRecordsPageHeader />

        <PayrollSection
          id="payroll-records-snapshot"
          title={translate("payroll.snapshot")}
          description={translate("payroll.snapshotDescription")}
        >
          <PayrollRecordsSnapshotGrid
            stats={snapshotStats}
            loading={(canCompanyPayroll ? companyLoading : loading) && activeRecords.length === 0}
          />
        </PayrollSection>

        <PayrollRecordsFilters
          year={payrollYear}
          month={payrollMonth}
          onPeriodChange={(year, month) => {
            setPayrollYear(year);
            setPayrollMonth(month);
          }}
          disabled={canCompanyPayroll ? companyLoading : loading}
        />

        <PayrollSection
          id="payroll-records-table"
          title={canCompanyPayroll ? translate("navigation.payrollRecords") : translate("payroll.myPayrollRecords")}
          description={
            canCompanyPayroll
              ? translate("payroll.employeeRollupsFor", { values: { period: displayPeriodLabel } })
              : PAYROLL_TABLE_HELP
          }
        >
          {canCompanyPayroll ? (
            <PayrollRecordsTable
              periodLabel={displayPeriodLabel}
              rollups={employeeRollups}
              currencyCode={currencyCode}
              expandedEmployeeId={expandedEmployeeId}
              onToggleExpand={(userId) =>
                setExpandedEmployeeId((prev) => (prev === userId ? null : userId))
              }
              recordColumns={recordColumns}
              loading={companyLoading}
              error={companyError}
              onRetry={() => void loadMonthlyCompanyPayroll(payrollYear, payrollMonth)}
              shadowOvertimeNote={shadowOvertimeSummary(companyData)}
            />
          ) : (
            <PayrollRecordsMyTable
              periodLabel={periodLabel}
              records={myRecordsForPeriod}
              columns={recordColumns}
              currencyCode={currencyCode}
              totalHours={myPeriodTotals.hours}
              totalGross={myPeriodTotals.gross}
              totalLate={myPeriodTotals.late}
              loading={loading}
              error={myError}
              onRetry={() => void loadMyPayroll()}
              helpText={PAYROLL_TABLE_HELP}
            />
          )}
        </PayrollSection>

        {canCompanyPayroll ? (
          <PayrollSection
            id="payroll-records-summary"
            title={translate("payroll.payrollSummary")}
            description={translate("payroll.summaryFromLoaded")}
          >
            <PayrollRecordsSummaryPanel items={summaryPanelItems} />
          </PayrollSection>
        ) : myRecordsForPeriod.length > 0 ? (
          <PayrollSection
            id="payroll-records-summary"
            title={translate("payroll.payrollSummary")}
            description={translate("payroll.summaryFromYours")}
          >
            <PayrollRecordsSummaryPanel items={summaryPanelItems} />
          </PayrollSection>
        ) : null}

        {canCompanyPayroll ? (
          <PayrollSection
            id="payroll-my-records"
            title={translate("payroll.myRecordsTitlePeriod", { values: { period: displayPeriodLabel } })}
            description={PAYROLL_TABLE_HELP}
          >
            <PayrollRecordsMyTable
              periodLabel={displayPeriodLabel}
              records={myRecordsForPeriod}
              columns={recordColumns}
              currencyCode={currencyCode}
              totalHours={myPeriodTotals.hours}
              totalGross={myPeriodTotals.gross}
              totalLate={myPeriodTotals.late}
              loading={loading}
              error={myError}
              onRetry={() => void loadMyPayroll()}
              helpText={PAYROLL_TABLE_HELP}
            />
          </PayrollSection>
        ) : null}

        <PayrollSection
          id="payroll-records-activity"
          title={translate("payroll.recentActivity")}
          description={translate("payroll.recentActivityRecordsDescription")}
        >
          <PayrollRecordsRecentActivity items={recentActivity} />
        </PayrollSection>
      </div>
    </MainContent>
  );
}
