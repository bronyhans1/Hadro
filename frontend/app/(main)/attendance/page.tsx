"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MainContent } from "@/components/layout/MainContent";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { AttendancePageHeader } from "@/components/attendance/AttendancePageHeader";
import { AttendanceSection } from "@/components/attendance/AttendanceSection";
import { AttendanceSnapshotGrid } from "@/components/attendance/AttendanceSnapshotGrid";
import { AttendanceWorkforceSection } from "@/components/attendance/AttendanceWorkforceSection";
import { AttendanceAlertsSection } from "@/components/attendance/AttendanceAlertsSection";
import { AttendanceQuickActions } from "@/components/attendance/AttendanceQuickActions";
import { AttendanceRecentSessions } from "@/components/attendance/AttendanceRecentSessions";
import { AttendanceEmployeePreviewDrawer } from "@/components/attendance/AttendanceEmployeePreviewDrawer";
import * as attendanceApi from "@/lib/api/attendance.api";
import * as remoteAttendanceApi from "@/lib/api/remoteAttendance.api";
import * as usersApi from "@/lib/api/users.api";
import { isApiError } from "@/lib/types/api";
import type { SessionHistoryItem, TodayOverview } from "@/lib/api/attendance.api";
import type { UserListItem } from "@/lib/api/users.api";
import { useAuth } from "@/lib/auth/AuthContext";
import { hasRole } from "@/lib/auth/roles";
import { buildEmployeeMetaById, buildUsersById } from "@/lib/attendance/attendanceOverviewUtils";
import { getCurrentMonthRange } from "@/lib/utils/date";
import { safeApi } from "@/lib/api/safeApi";
import { translate } from "@/lib/i18n";
import { toUserFacingApiError } from "@/lib/api/userFacingError";

export default function AttendancePage() {
  const { user, isLoading: authLoading } = useAuth();
  const businessTz = user?.businessTimeZone ?? "Africa/Accra";
  const canViewCompany = hasRole(user?.roles, ["admin", "manager", "HR"]);

  const [overview, setOverview] = useState<TodayOverview | null>(null);
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [activeSessions, setActiveSessions] = useState<
    Array<{
      user_id: string;
      check_in: string | null;
      department_id?: string | null;
      attendance_mode?: string | null;
      remote_approval_status?: string | null;
    }>
  >([]);
  const [recentSessions, setRecentSessions] = useState<SessionHistoryItem[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [pendingRemoteCount, setPendingRemoteCount] = useState(0);
  const [flaggedEmployeesCount, setFlaggedEmployeesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);

    const month = getCurrentMonthRange();

    try {
      const [todayRes, activeRes] = await Promise.all([
        safeApi(attendanceApi.getTodayOverview()),
        safeApi(attendanceApi.getActiveEmployees()),
      ]);

      if (isApiError(todayRes)) {
        setError(todayRes.error);
        return;
      }
      setOverview(todayRes.data);

      if (!isApiError(activeRes)) {
        setActiveCount(activeRes.data.active_count);
        setActiveSessions(activeRes.data.active_sessions ?? []);
      } else {
        setActiveCount(null);
        setActiveSessions([]);
      }

      if (canViewCompany) {
        const [historyRes, remoteRes, flagsRes, usersRes] = await Promise.all([
          safeApi(attendanceApi.getCompanySessionHistory({ page: 1, limit: 12 })),
          safeApi(remoteAttendanceApi.getPendingRemoteSessions()),
          safeApi(attendanceApi.getFlagsSummary(month.start, month.end)),
          safeApi(usersApi.getUsers()),
        ]);

        if (!isApiError(historyRes)) {
          setRecentSessions(historyRes.data.rows ?? []);
        } else {
          setRecentSessions([]);
        }

        if (!isApiError(remoteRes)) {
          setPendingRemoteCount(remoteRes.data?.length ?? 0);
        } else {
          setPendingRemoteCount(0);
        }

        if (!isApiError(flagsRes)) {
          setFlaggedEmployeesCount(flagsRes.data?.summary.highRiskEmployees ?? 0);
        } else {
          setFlaggedEmployeesCount(0);
        }

        if (!isApiError(usersRes)) {
          setUsers(usersRes.data ?? []);
        } else {
          setUsers([]);
        }
      } else {
        const historyRes = await safeApi(attendanceApi.getMySessionHistory({ page: 1, limit: 12 }));
        if (!isApiError(historyRes)) {
          setRecentSessions(historyRes.data.rows ?? []);
        } else {
          setRecentSessions([]);
        }
        setUsers([]);
        setPendingRemoteCount(0);
        setFlaggedEmployeesCount(0);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : translate("attendance.failedToLoad"));
    } finally {
      setLoading(false);
    }
  }, [canViewCompany]);

  useEffect(() => {
    if (authLoading) return;
    void load();
  }, [authLoading, load]);

  const employeeMetaById = useMemo(() => buildEmployeeMetaById(users), [users]);
  const usersById = useMemo(() => buildUsersById(users), [users]);

  const workforceSessions = useMemo(
    () =>
      activeSessions.map((s) => {
        const meta = employeeMetaById.get(s.user_id);
        return {
          ...s,
          displayName: meta?.name,
          photoUrl: meta?.photoUrl,
          departmentName: meta?.departmentName,
        };
      }),
    [activeSessions, employeeMetaById]
  );

  const recentRows = recentSessions;

  function openEmployeePreview(userId: string) {
    setPreviewUserId(userId);
    setDrawerOpen(true);
  }

  function closeEmployeePreview() {
    setDrawerOpen(false);
    setPreviewUserId(null);
  }

  if (authLoading || (loading && !overview)) {
    return (
      <MainContent>
        <LoadingState message={translate("attendance.loadingAttendance")} className="min-h-[240px]" />
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
        <AttendancePageHeader />

        <AttendanceSection title={translate("attendance.attendanceSnapshot")} description={translate("attendance.attendanceSnapshotDescription")}>
          <AttendanceSnapshotGrid
            overview={overview}
            activeCount={activeCount}
            activeSessions={activeSessions}
            loading={loading && !overview}
          />
        </AttendanceSection>

        <AttendanceSection title={translate("attendance.todaysWorkforce")} description={translate("attendance.workforceDescription")}>
          <AttendanceWorkforceSection
            canViewCompany={canViewCompany}
            activeSessions={workforceSessions}
            businessTimeZone={businessTz}
            overviewPresent={overview?.present ?? 0}
            overviewCompleted={overview?.completed ?? 0}
            overviewLate={overview?.late_today ?? 0}
            overviewAbsent={overview?.absent_today ?? 0}
            overviewWorkedMinutes={overview?.total_minutes_today ?? 0}
            onEmployeeClick={canViewCompany ? openEmployeePreview : undefined}
          />
        </AttendanceSection>

        {canViewCompany ? (
          <AttendanceSection title={translate("attendance.attendanceAlerts")} description={translate("attendance.alertsDescription")}>
            <AttendanceAlertsSection
              canViewCompany={canViewCompany}
              pendingRemoteCount={pendingRemoteCount}
              flaggedEmployeesCount={flaggedEmployeesCount}
              absentToday={overview?.absent_today ?? 0}
              lateToday={overview?.late_today ?? 0}
            />
          </AttendanceSection>
        ) : null}

        <AttendanceSection title={translate("attendance.quickActions")} description={translate("attendance.quickActionsDescription")}>
          <AttendanceQuickActions />
        </AttendanceSection>

        <AttendanceSection title={translate("attendance.recentAttendance")} description={translate("attendance.recentAttendanceDescription")}>
          <AttendanceRecentSessions
            canViewCompany={canViewCompany}
            rows={recentRows}
            businessTimeZone={businessTz}
            loading={loading}
            employeePhotos={employeeMetaById}
          />
        </AttendanceSection>
      </div>

      <AttendanceEmployeePreviewDrawer
        open={drawerOpen}
        userId={previewUserId}
        usersById={usersById}
        onClose={closeEmployeePreview}
      />
    </MainContent>
  );
}
