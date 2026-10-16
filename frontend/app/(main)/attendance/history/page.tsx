"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MainContent } from "@/components/layout/MainContent";
import { LoadingState } from "@/components/ui/LoadingState";
import { AttendanceSection } from "@/components/attendance/AttendanceSection";
import { AttendanceHistoryPageHeader } from "@/components/attendance/history/AttendanceHistoryPageHeader";
import { AttendanceHistoryDatePresets } from "@/components/attendance/history/AttendanceHistoryDatePresets";
import { AttendanceHistoryFilters } from "@/components/attendance/history/AttendanceHistoryFilters";
import { AttendanceHistorySummary } from "@/components/attendance/history/AttendanceHistorySummary";
import { AttendanceHistoryTable } from "@/components/attendance/history/AttendanceHistoryTable";
import { ManualAttendanceModal } from "@/components/attendance/ManualAttendanceModal";
import * as attendanceApi from "@/lib/api/attendance.api";
import * as usersApi from "@/lib/api/users.api";
import { isApiError } from "@/lib/types/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { hasRole, isBranchScopedCompanyUser } from "@/lib/auth/roles";
import type { SessionHistoryItem } from "@/lib/api/attendance.api";
import type { UserListItem } from "@/lib/api/users.api";
import { buildEmployeeMetaById } from "@/lib/attendance/attendanceOverviewUtils";
import { safeApi } from "@/lib/api/safeApi";
import { toUserFacingApiError } from "@/lib/api/userFacingError";
import {
  computeHistorySummary,
  hasHistoryFilters,
} from "@/lib/attendance/attendanceHistoryUtils";
import { translate } from "@/lib/i18n";

export default function AttendanceHistoryPage() {
  const { user } = useAuth();
  const businessTz = user?.businessTimeZone ?? "Africa/Accra";
  const canViewCompany = hasRole(user?.roles, ["admin", "manager", "HR"]);
  const branchScoped = isBranchScopedCompanyUser(user?.roles);

  const [rows, setRows] = useState<SessionHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 25;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [employees, setEmployees] = useState<UserListItem[]>([]);
  const [manualOpen, setManualOpen] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        start: start.trim() || undefined,
        end: end.trim() || undefined,
        user_id: canViewCompany && employeeFilter ? employeeFilter : undefined,
      };

      const res = canViewCompany
        ? await safeApi(attendanceApi.getCompanySessionHistory(params))
        : await safeApi(attendanceApi.getMySessionHistory(params));

      if (isApiError(res)) {
        setError(res.error);
        setRows([]);
        setTotal(0);
        return;
      }
      setRows(res.data.rows);
      setTotal(res.data.total);
    } catch (e) {
      setError(e instanceof Error ? toUserFacingApiError(e.message, translate("attendance.failedToLoad")) : translate("attendance.failedToLoad"));
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, start, end, employeeFilter, canViewCompany]);

  useEffect(() => {
    if (!canViewCompany) return;
    (async () => {
      const res = await safeApi(usersApi.getUsers());
      if (!isApiError(res)) setEmployees(res.data ?? []);
    })();
  }, [canViewCompany]);

  useEffect(() => {
    load();
  }, [load]);

  const employeeMetaById = useMemo(() => buildEmployeeMetaById(employees), [employees]);

  const hasFilters = useMemo(
    () => hasHistoryFilters({ start, end, employeeFilter }),
    [start, end, employeeFilter]
  );

  const summaryMetrics = useMemo(
    () => computeHistorySummary(rows, total),
    [rows, total]
  );

  function applyDateRange(nextStart: string, nextEnd: string) {
    setPage(1);
    setStart(nextStart);
    setEnd(nextEnd);
  }

  function handleRefresh() {
    setPage(1);
    void load();
  }

  const initialLoading = loading && rows.length === 0 && !error;

  return (
    <MainContent>
      <div className="space-y-8">
        <AttendanceHistoryPageHeader
          canRecordManualAttendance={canViewCompany}
          onManualAttendance={() => setManualOpen(true)}
        />

        <AttendanceSection title={translate("attendance.dateRange")} description={translate("attendance.quickPresetsPopulate")}>
          <AttendanceHistoryDatePresets start={start} end={end} onApply={applyDateRange} />
        </AttendanceSection>

        <AttendanceHistoryFilters
          start={start}
          end={end}
          employeeFilter={employeeFilter}
          canViewCompany={canViewCompany}
          branchScoped={branchScoped}
          employees={employees}
          onStartChange={(value) => {
            setPage(1);
            setStart(value);
          }}
          onEndChange={(value) => {
            setPage(1);
            setEnd(value);
          }}
          onEmployeeChange={(value) => {
            setPage(1);
            setEmployeeFilter(value);
          }}
          onRefresh={handleRefresh}
          loading={loading}
        />

        <AttendanceSection title={translate("attendance.attendanceSummary")} description={translate("attendance.metricsFromResults")}>
          {initialLoading ? (
            <AttendanceHistorySummary metrics={summaryMetrics} loading />
          ) : (
            <AttendanceHistorySummary metrics={summaryMetrics} />
          )}
        </AttendanceSection>

        {initialLoading ? (
          <LoadingState message={translate("attendance.loadingSessions")} className="min-h-[240px]" />
        ) : (
          <AttendanceHistoryTable
            canViewCompany={canViewCompany}
            rows={rows}
            total={total}
            page={page}
            limit={limit}
            loading={loading}
            error={error}
            hasFilters={hasFilters}
            businessTimeZone={businessTz}
            employeePhotos={employeeMetaById}
            onRetry={() => void load()}
            onPreviousPage={() => setPage((p) => Math.max(1, p - 1))}
            onNextPage={() => setPage((p) => p + 1)}
          />
        )}
      </div>

      {canViewCompany ? (
        <ManualAttendanceModal
          open={manualOpen}
          onClose={() => setManualOpen(false)}
          employees={employees}
          initialUserId={employeeFilter || null}
          onSuccess={() => void load()}
        />
      ) : null}
    </MainContent>
  );
}
