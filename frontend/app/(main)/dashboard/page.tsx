"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Clock3,
  FileSpreadsheet,
  LayoutDashboard,
  Sparkles,
  Zap,
} from "lucide-react";
import { MainContent } from "@/components/layout/MainContent";
import { LoadingState } from "@/components/ui/LoadingState";
import { LoadingBar } from "@/components/ui/LoadingPrimitives";
import { ErrorState } from "@/components/ui/ErrorState";
import { DashboardWelcome } from "@/components/dashboard/DashboardWelcome";
import { CompanyProfileSetupCard } from "@/components/company/CompanyProfileSetupCard";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { DashboardKpiGrid } from "@/components/dashboard/DashboardKpiGrid";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { DashboardOperationalHealth } from "@/components/dashboard/DashboardOperationalHealth";
import { DashboardWorkforce } from "@/components/dashboard/DashboardWorkforce";
import { DashboardRecentActivity } from "@/components/dashboard/DashboardRecentActivity";
import { DashboardRecentRecords } from "@/components/dashboard/DashboardRecentRecords";
import { DashboardWidgetState } from "@/components/dashboard/DashboardWidgetState";
import * as attendanceApi from "@/lib/api/attendance.api";
import * as leaveApi from "@/lib/api/leave.api";
import * as payrollApi from "@/lib/api/payroll.api";
import * as usersApi from "@/lib/api/users.api";
import * as companyPolicyApi from "@/lib/api/companyPolicy.api";
import * as timelineApi from "@/lib/api/timeline.api";
import * as remoteAttendanceApi from "@/lib/api/remoteAttendance.api";
import * as manualOvertimeApi from "@/lib/api/manualOvertime.api";
import { safeApi } from "@/lib/api/safeApi";
import { translate } from "@/lib/i18n";
import { isApiError } from "@/lib/types/api";
import type { TodayOverview, SessionHistoryItem } from "@/lib/api/attendance.api";
import type { LeaveRequest } from "@/lib/api/leave.api";
import type { PayrollReportResult, PayrollHealthResponse } from "@/lib/api/payroll.api";
import type { TimelineEvent } from "@/lib/api/timeline.api";
import type { UserListItem } from "@/lib/api/users.api";
import { normalizeLeaveStatus } from "@/lib/dashboard/formatters";
import {
  canAccessManagerFeatures,
  canAccessCompanyPayroll,
  canAccessCompanyTimeline,
  isBranchScopedCompanyUser,
  isPlatformAdmin,
} from "@/lib/auth/roles";
import { useAuth } from "@/lib/auth/AuthContext";
import { getCurrentMonthRange } from "@/lib/utils/date";

function buildEmployeeMetaById(users: readonly UserListItem[]) {
  const m = new Map<string, { name: string; photoUrl?: string | null }>();
  for (const u of users) {
    const first = u.first_name?.trim() ?? "";
    const last = u.last_name?.trim() ?? "";
    const name = [first, last].filter(Boolean).join(" ") || u.email || u.id;
    m.set(u.id, { name, photoUrl: u.profile_photo_url });
  }
  return m;
}

type WidgetError = string | null;

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const canViewCompanyOps = canAccessManagerFeatures(user?.roles);
  const canViewCompanyPayroll = canAccessCompanyPayroll(user?.roles);
  const canViewTimeline = canAccessCompanyTimeline(user?.roles);
  const branchScoped = isBranchScopedCompanyUser(user?.roles);
  const payrollEnabled = user?.payrollEnabled !== false;
  const businessTz = user?.businessTimeZone ?? "Africa/Accra";
  /** Managers/HR/admin may list draft OT; company payroll health is admin/HR only. */
  const canViewManualOt = canViewCompanyOps && payrollEnabled;

  const [overview, setOverview] = useState<TodayOverview | null>(null);
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [coreLoading, setCoreLoading] = useState(true);
  const [opsLoading, setOpsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState<WidgetError>(null);
  const [latenessSummary, setLatenessSummary] = useState<attendanceApi.LatenessSummary | null>(null);
  const [flagsSummary, setFlagsSummary] = useState<attendanceApi.FlagsSummary | null>(null);
  const [absenceSummary, setAbsenceSummary] = useState<attendanceApi.AbsenceSummary | null>(null);
  const [payroll, setPayroll] = useState<PayrollReportResult | null>(null);
  const [payrollHealth, setPayrollHealth] = useState<PayrollHealthResponse | null>(null);
  const [currencyCode, setCurrencyCode] = useState<"GHS" | "USD">("GHS");
  const [pendingRemoteCount, setPendingRemoteCount] = useState(0);
  const [draftManualOtCount, setDraftManualOtCount] = useState(0);
  const [activeSessions, setActiveSessions] = useState<
    Array<{
      user_id: string;
      check_in: string | null;
      department_id?: string | null;
      attendance_mode?: string | null;
      remote_approval_status?: string | null;
    }>
  >([]);
  const [employeesActiveCount, setEmployeesActiveCount] = useState<number | null>(null);
  const [employeesRestrictedCount, setEmployeesRestrictedCount] = useState<number | null>(null);
  const [recentCompanySessions, setRecentCompanySessions] = useState<SessionHistoryItem[]>([]);
  const [recentMySessions, setRecentMySessions] = useState<SessionHistoryItem[]>([]);
  const [employeeMetaById, setEmployeeMetaById] = useState<
    ReadonlyMap<string, { name: string; photoUrl?: string | null }>
  >(() => new Map());

  const [opsError, setOpsError] = useState<WidgetError>(null);
  const [recordsError, setRecordsError] = useState<WidgetError>(null);

  useEffect(() => {
    if (isLoading) return;
    if (isPlatformAdmin(user?.roles)) {
      router.replace("/platform/dashboard");
    }
  }, [isLoading, router, user?.roles]);

  const load = useCallback(async () => {
    if (isPlatformAdmin(user?.roles)) {
      setCoreLoading(false);
      return;
    }
    setError(null);
    setOpsError(null);
    setRecordsError(null);
    setTimelineError(null);
    setCoreLoading(true);
    setOpsLoading(true);
    setTimelineLoading(canViewTimeline);

    const now = new Date();
    const payrollYear = now.getFullYear();
    const payrollMonth = now.getMonth() + 1;
    const month = getCurrentMonthRange();

    try {
      // --- Phase A: core KPIs (page fails only if today overview fails) ---
      const todayRes = await safeApi(attendanceApi.getTodayOverview());
      if (isApiError(todayRes)) {
        setError(todayRes.error);
        setOverview(null);
        setCoreLoading(false);
        setOpsLoading(false);
        setTimelineLoading(false);
        return;
      }
      setOverview(todayRes.data);

      // Ops roles: fetch live active sessions. Employees: derive from overview (self-scoped).
      if (canViewCompanyOps) {
        const activeRes = await safeApi(attendanceApi.getActiveEmployees());
        if (!isApiError(activeRes)) {
          setActiveCount(activeRes.data.active_count);
          setActiveSessions(activeRes.data.active_sessions ?? []);
        } else {
          setActiveCount(todayRes.data.active ?? null);
          setActiveSessions([]);
        }
      } else {
        setActiveCount(todayRes.data.active ?? 0);
        setActiveSessions([]);
      }

      setCoreLoading(false);

      // Timeline in parallel with ops (independent widget)
      const timelinePromise = canViewTimeline
        ? safeApi(timelineApi.listTimeline({ limit: 10 })).then((timelineRes) => {
            if (!isApiError(timelineRes)) {
              setTimelineEvents(timelineRes.data?.events ?? []);
              setTimelineError(null);
            } else {
              setTimelineEvents([]);
              setTimelineError(timelineRes.error);
            }
          })
        : Promise.resolve().then(() => {
            setTimelineEvents([]);
          });

      if (canViewCompanyOps) {
        const [
          companyLeaveRes,
          usersRes,
          policyRes,
          latenessRes,
          flagsRes,
          absenceRes,
          companyHistoryRes,
          remotePendingRes,
        ] = await Promise.all([
          safeApi(leaveApi.getCompanyLeaveRequests()),
          safeApi(usersApi.getUsers()),
          safeApi(companyPolicyApi.getPolicy()),
          safeApi(attendanceApi.getLatenessSummary(month.start, month.end)),
          safeApi(attendanceApi.getFlagsSummary(month.start, month.end)),
          safeApi(attendanceApi.getAbsenceSummary(month.start, month.end)),
          safeApi(attendanceApi.getCompanySessionHistory({ page: 1, limit: 12 })),
          safeApi(remoteAttendanceApi.getPendingRemoteSessions()),
        ]);

        let recordsHadError = false;

        if (!isApiError(companyLeaveRes)) setLeaveRequests(companyLeaveRes.data ?? []);
        else setLeaveRequests([]);

        if (!isApiError(latenessRes)) setLatenessSummary(latenessRes.data);
        else setLatenessSummary(null);

        if (!isApiError(flagsRes)) setFlagsSummary(flagsRes.data);
        else setFlagsSummary(null);

        if (!isApiError(absenceRes)) setAbsenceSummary(absenceRes.data);
        else setAbsenceSummary(null);

        if (!isApiError(usersRes)) {
          const ulist = usersRes.data ?? [];
          setEmployeeMetaById(buildEmployeeMetaById(ulist));
          setEmployeesActiveCount(ulist.filter((u) => u.status === "active").length);
          setEmployeesRestrictedCount(ulist.filter((u) => u.status !== "active").length);
        } else {
          setEmployeeMetaById(new Map());
          setEmployeesActiveCount(null);
          setEmployeesRestrictedCount(null);
          setOpsError(usersRes.error);
        }

        if (!isApiError(policyRes)) {
          const cc = policyRes.data?.currency_code;
          if (cc === "USD" || cc === "GHS") setCurrencyCode(cc);
        }

        if (!isApiError(remotePendingRes)) {
          setPendingRemoteCount(remotePendingRes.data?.length ?? 0);
        } else {
          setPendingRemoteCount(0);
        }

        if (!isApiError(companyHistoryRes)) {
          setRecentCompanySessions(companyHistoryRes.data.rows ?? []);
        } else {
          setRecentCompanySessions([]);
          recordsHadError = true;
          setRecordsError(companyHistoryRes.error);
        }
        setRecentMySessions([]);

        // Payroll health (admin/HR) + manual OT drafts (admin/HR/manager) — parallel, no company payroll list
        const payrollTasks: Promise<void>[] = [];
        if (canViewCompanyPayroll && payrollEnabled) {
          payrollTasks.push(
            safeApi(payrollApi.getPayrollHealth(payrollYear, payrollMonth)).then((healthRes) => {
              if (!isApiError(healthRes)) setPayrollHealth(healthRes.data ?? null);
              else setPayrollHealth(null);
            })
          );
        } else {
          setPayrollHealth(null);
        }
        setPayroll(null);

        if (canViewManualOt) {
          payrollTasks.push(
            safeApi(
              manualOvertimeApi.listManualOvertime({
                year: payrollYear,
                month: payrollMonth,
                status: "draft",
              })
            ).then((manualOtRes) => {
              if (!isApiError(manualOtRes)) setDraftManualOtCount(manualOtRes.data?.length ?? 0);
              else setDraftManualOtCount(0);
            })
          );
        } else {
          setDraftManualOtCount(0);
        }

        await Promise.all([...payrollTasks, timelinePromise]);
        if (!recordsHadError) setRecordsError(null);
      } else {
        // Employee self-service pack
        const [myLeaveRes, myHistoryRes, policyRes] = await Promise.all([
          safeApi(leaveApi.getMyLeaveRequests()),
          safeApi(attendanceApi.getMySessionHistory({ page: 1, limit: 8 })),
          safeApi(companyPolicyApi.getPolicy()),
        ]);

        if (!isApiError(myLeaveRes)) setLeaveRequests(myLeaveRes.data ?? []);
        else setLeaveRequests([]);

        if (payrollEnabled) {
          const myPayrollRes = await safeApi(payrollApi.getMyPayroll());
          if (!isApiError(myPayrollRes)) setPayroll(myPayrollRes.data);
          else setPayroll(null);
        } else {
          setPayroll(null);
        }

        setPayrollHealth(null);
        setEmployeeMetaById(new Map());
        setPendingRemoteCount(0);
        setDraftManualOtCount(0);
        setLatenessSummary(null);
        setFlagsSummary(null);
        setAbsenceSummary(null);

        if (!isApiError(policyRes)) {
          const cc = policyRes.data?.currency_code;
          if (cc === "USD" || cc === "GHS") setCurrencyCode(cc);
        }

        setRecentCompanySessions([]);
        setEmployeesActiveCount(null);
        setEmployeesRestrictedCount(null);

        if (!isApiError(myHistoryRes)) {
          setRecentMySessions(myHistoryRes.data.rows ?? []);
          setRecordsError(null);
        } else {
          setRecentMySessions([]);
          setRecordsError(myHistoryRes.error);
        }

        await timelinePromise;
      }
    } catch (e) {
      // Session expiry rethrows from safeApi; other unexpected errors
      setError(e instanceof Error ? e.message : translate("dashboard.failedLoad"));
    } finally {
      setCoreLoading(false);
      setOpsLoading(false);
      setTimelineLoading(false);
    }
  }, [
    canViewCompanyOps,
    canViewCompanyPayroll,
    canViewManualOt,
    canViewTimeline,
    payrollEnabled,
    user?.roles,
  ]);

  useEffect(() => {
    if (isLoading) return;
    if (isPlatformAdmin(user?.roles)) return;
    void load();
  }, [isLoading, load, user?.roles]);

  const pendingCompanyLeaveCount = useMemo(
    () =>
      canViewCompanyOps
        ? leaveRequests.filter((r) => normalizeLeaveStatus(r.status) === "pending").length
        : 0,
    [canViewCompanyOps, leaveRequests]
  );

  const repeatedAbsenceCount = useMemo(
    () => absenceSummary?.employees?.filter((e) => e.repeated_absence).length ?? 0,
    [absenceSummary]
  );

  const repeatedLateCount = latenessSummary?.summary.repeatedLateEmployees ?? 0;

  const myLeavePending = useMemo(
    () => leaveRequests.filter((r) => normalizeLeaveStatus(r.status) === "pending").length,
    [leaveRequests]
  );

  const recentLeaveRows = useMemo(
    () => (canViewCompanyOps ? leaveRequests.slice(0, 8) : leaveRequests.slice(0, 5)),
    [canViewCompanyOps, leaveRequests]
  );

  const attendanceRows = useMemo(
    () => (canViewCompanyOps ? recentCompanySessions : recentMySessions),
    [canViewCompanyOps, recentCompanySessions, recentMySessions]
  );

  const workforceSessions = useMemo(
    () =>
      activeSessions.map((s) => {
        const meta = employeeMetaById.get(s.user_id);
        return {
          ...s,
          displayName: meta?.name,
          photoUrl: meta?.photoUrl,
        };
      }),
    [activeSessions, employeeMetaById]
  );

  if (!isLoading && isPlatformAdmin(user?.roles)) {
    return (
      <MainContent>
        <LoadingState message={translate("dashboard.redirectingPlatform")} className="min-h-[240px]" />
      </MainContent>
    );
  }

  if (error && !overview) {
    return (
      <MainContent>
        <ErrorState message={error} onRetry={load} />
      </MainContent>
    );
  }

  return (
    <MainContent>
      <div className="space-y-8">
        {opsLoading && overview ? <LoadingBar /> : null}
        <DashboardWelcome />
        <CompanyProfileSetupCard />

        <DashboardSection
          title={translate("dashboard.todaysKpis")}
          description={
            canViewCompanyOps
              ? translate("dashboard.workforceStatusToday")
              : translate("dashboard.yourAttendanceStatusToday")
          }
          icon={<LayoutDashboard className="h-4 w-4" />}
        >
          <DashboardKpiGrid
            overview={overview}
            activeCount={activeCount}
            activeSessions={activeSessions}
            loading={coreLoading && !overview}
            personal={!canViewCompanyOps}
          />
        </DashboardSection>

        <DashboardSection
          title={translate("attendance.quickActions")}
          description={translate("dashboard.quickActionsDescription")}
          icon={<Zap className="h-4 w-4" />}
        >
          <DashboardQuickActions />
        </DashboardSection>

        <DashboardSection
          title={translate("dashboard.operationalHealth")}
          description={translate("dashboard.operationalHealthDescription")}
          icon={<Sparkles className="h-4 w-4" />}
        >
          <DashboardWidgetState loading={opsLoading && !overview} skeletonRows={4}>
            <DashboardOperationalHealth
              canViewCompanyOps={canViewCompanyOps}
              payrollEnabled={payrollEnabled}
              showManualOt={canViewManualOt}
              showPayrollHealth={canViewCompanyPayroll && payrollEnabled}
              pendingLeaveCount={pendingCompanyLeaveCount}
              pendingRemoteCount={pendingRemoteCount}
              draftManualOtCount={draftManualOtCount}
              flagsSummary={flagsSummary}
              repeatedLateCount={repeatedLateCount}
              repeatedAbsenceCount={repeatedAbsenceCount}
              payrollHealth={payrollHealth}
              payrollGross={payroll?.total_gross_pay}
              currencyCode={currencyCode}
              employeeLeavePending={myLeavePending}
            />
          </DashboardWidgetState>
        </DashboardSection>

        <DashboardSection
          title={canViewCompanyOps ? translate("attendance.todaysWorkforce") : translate("dashboard.yourDay")}
          description={
            canViewCompanyOps
              ? translate("attendance.workforceDescription")
              : translate("dashboard.yourDayDescription")
          }
          icon={<Clock3 className="h-4 w-4" />}
        >
          <DashboardWidgetState loading={opsLoading && canViewCompanyOps && !overview} error={opsError}>
            <DashboardWorkforce
              canViewCompanyOps={canViewCompanyOps}
              activeSessions={workforceSessions}
              employeesActiveCount={employeesActiveCount}
              employeesRestrictedCount={employeesRestrictedCount}
              businessTimeZone={businessTz}
              overviewPresent={overview?.present}
              overviewCompleted={overview?.completed}
              overviewActive={overview?.active}
            />
          </DashboardWidgetState>
        </DashboardSection>

        {canViewTimeline ? (
          <DashboardSection
            title={translate("dashboard.recentActivity")}
            description={translate("dashboard.recentActivityDescription")}
            icon={<Activity className="h-4 w-4" />}
          >
            <DashboardRecentActivity
              events={timelineEvents}
              loading={timelineLoading}
              error={timelineError}
              businessTimeZone={businessTz}
            />
          </DashboardSection>
        ) : null}

        <DashboardSection
          title={translate("dashboard.recentRecords")}
          description={
            canViewCompanyOps
              ? translate("dashboard.recentRecordsCompany")
              : translate("dashboard.recentRecordsMine")
          }
          icon={<FileSpreadsheet className="h-4 w-4" />}
        >
          <DashboardWidgetState loading={opsLoading} error={recordsError} skeletonRows={2}>
            <DashboardRecentRecords
              canViewCompanyOps={canViewCompanyOps}
              branchScoped={branchScoped}
              attendanceRows={attendanceRows}
              leaveRows={recentLeaveRows}
              businessTimeZone={businessTz}
              loading={false}
            />
          </DashboardWidgetState>
        </DashboardSection>
      </div>
    </MainContent>
  );
}
