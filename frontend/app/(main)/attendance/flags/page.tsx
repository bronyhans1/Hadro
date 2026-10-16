"use client";

import { useMemo, useState, useCallback } from "react";
import { MainContent } from "@/components/layout/MainContent";
import { ErrorState } from "@/components/ui/ErrorState";
import { Badge } from "@/components/ui/Badge";
import { AttendanceInsightPageHeader } from "@/components/attendance/insights/AttendanceInsightPageHeader";
import { AttendanceInsightFilters } from "@/components/attendance/insights/AttendanceInsightFilters";
import { AttendanceInsightLayout } from "@/components/attendance/insights/AttendanceInsightLayout";
import { AttendanceInsightSummaryGrid } from "@/components/attendance/insights/AttendanceInsightSummaryGrid";
import { AttendanceInsightPanel } from "@/components/attendance/insights/AttendanceInsightPanel";
import { AttendanceInsightResults } from "@/components/attendance/insights/AttendanceInsightResults";
import { EmployeeInsightCell } from "@/components/attendance/insights/EmployeeInsightCell";
import { FlagLevelBadge } from "@/components/attendance/insights/FlagLevelBadge";
import { getCurrentMonthRange } from "@/lib/utils/date";
import * as attendanceApi from "@/lib/api/attendance.api";
import { isApiError } from "@/lib/types/api";
import type { FlagsSummaryEmployee } from "@/lib/api/attendance.api";
import { buildFlagsInsights, buildFlagsStats } from "@/lib/attendance/attendanceInsightsUtils";
import { translate } from "@/lib/i18n";
import { safeApi } from "@/lib/api/safeApi";
import { toUserFacingApiError } from "@/lib/api/userFacingError";

export default function AttendanceFlagsPage() {
  const { start: defaultStart, end: defaultEnd } = getCurrentMonthRange();
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [data, setData] = useState<attendanceApi.FlagsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await safeApi(attendanceApi.getFlagsSummary(start, end));
      if (isApiError(res)) {
        setError(res.error);
        setData(null);
        return;
      }
      setData(res.data);
      setApplied(true);
    } catch (e) {
      setError(e instanceof Error ? toUserFacingApiError(e.message, translate("attendance.failedToLoad")) : translate("attendance.failedToLoad"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  const stats = useMemo(() => (data ? buildFlagsStats(data) : []), [data]);
  const insights = useMemo(() => (data ? buildFlagsInsights(data) : []), [data]);
  const rows = useMemo(() => data?.employees ?? [], [data]);

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: translate("attendance.employee"),
        render: (row: FlagsSummaryEmployee) => <EmployeeInsightCell name={row.name} />,
      },
      { key: "late_count", header: translate("attendance.lateCount") },
      { key: "total_late_minutes", header: translate("attendance.totalLateMin") },
      { key: "early_leave_count", header: translate("attendance.earlyLeaveCount") },
      { key: "half_day_count", header: translate("attendance.halfDayCount") },
      {
        key: "repeated_late",
        header: translate("attendance.repeatedLate"),
        render: (row: FlagsSummaryEmployee) =>
          row.repeated_late ? <Badge variant="warning">{translate("attendance.yes")}</Badge> : <span style={{ color: "var(--ds-color-text-muted)" }}>{translate("attendance.no")}</span>,
      },
      {
        key: "repeated_early_leave",
        header: translate("attendance.repeatedEarlyLeave"),
        render: (row: FlagsSummaryEmployee) =>
          row.repeated_early_leave ? <Badge variant="warning">{translate("attendance.yes")}</Badge> : <span style={{ color: "var(--ds-color-text-muted)" }}>{translate("attendance.no")}</span>,
      },
      {
        key: "frequent_half_day",
        header: translate("attendance.frequentHalfDay"),
        render: (row: FlagsSummaryEmployee) =>
          row.frequent_half_day ? <Badge variant="warning">{translate("attendance.yes")}</Badge> : <span style={{ color: "var(--ds-color-text-muted)" }}>{translate("attendance.no")}</span>,
      },
      {
        key: "attention_needed",
        header: translate("attendance.needsReview"),
        render: (row: FlagsSummaryEmployee) =>
          row.attention_needed ? <Badge variant="warning">{translate("attendance.yes")}</Badge> : <span style={{ color: "var(--ds-color-text-muted)" }}>{translate("attendance.no")}</span>,
      },
      {
        key: "attendance_flag_level",
        header: translate("attendance.flagLevel"),
        render: (row: FlagsSummaryEmployee) => <FlagLevelBadge level={row.attendance_flag_level} />,
      },
    ],
    []
  );

  return (
    <MainContent>
      <div className="space-y-8">
        <AttendanceInsightPageHeader
          title={translate("attendance.attendanceFlags")}
          subtitle={translate("attendance.flagsSubtitle")}
        />

        <AttendanceInsightFilters
          start={start}
          end={end}
          onStartChange={setStart}
          onEndChange={setEnd}
          onApply={load}
          loading={loading}
        />

        {error ? <ErrorState message={toUserFacingApiError(error)} onRetry={load} /> : null}

        {applied && !error ? (
          <AttendanceInsightLayout
            summary={<AttendanceInsightSummaryGrid stats={stats} loading={loading && !data} ariaLabel={translate("attendance.attendanceFlags")} />}
            insight={<AttendanceInsightPanel items={insights} />}
            results={
              <AttendanceInsightResults
                title={translate("attendance.flaggedEmployees")}
                columns={columns}
                rows={rows}
                keyExtractor={(row) => row.user_id}
                loading={loading && !data}
                refreshing={loading && Boolean(data)}
                emptyTitle={translate("attendance.noFlagsInPeriod")}
                emptyDescription={translate("attendance.noFlagsRaised")}
              />
            }
          />
        ) : null}
      </div>
    </MainContent>
  );
}
