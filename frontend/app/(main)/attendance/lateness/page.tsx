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
import { getCurrentMonthRange } from "@/lib/utils/date";
import * as attendanceApi from "@/lib/api/attendance.api";
import { isApiError } from "@/lib/types/api";
import type { LatenessSummaryEmployee } from "@/lib/api/attendance.api";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatBusinessDateTime } from "@/lib/utils/businessDateTime";
import { buildLatenessInsights, buildLatenessStats } from "@/lib/attendance/attendanceInsightsUtils";
import { translate } from "@/lib/i18n";
import { safeApi } from "@/lib/api/safeApi";
import { toUserFacingApiError } from "@/lib/api/userFacingError";

export default function LatenessSummaryPage() {
  const { user } = useAuth();
  const businessTz = user?.businessTimeZone ?? "Africa/Accra";
  const { start: defaultStart, end: defaultEnd } = getCurrentMonthRange();
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [data, setData] = useState<attendanceApi.LatenessSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await safeApi(attendanceApi.getLatenessSummary(start, end));
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

  const stats = useMemo(() => (data ? buildLatenessStats(data) : []), [data]);
  const insights = useMemo(() => (data ? buildLatenessInsights(data) : []), [data]);
  const rows = useMemo(() => data?.employees ?? [], [data]);

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: translate("attendance.employee"),
        render: (row: LatenessSummaryEmployee) => <EmployeeInsightCell name={row.name} />,
      },
      { key: "late_count", header: translate("attendance.lateCount") },
      { key: "total_late_minutes", header: translate("attendance.totalLateMin") },
      { key: "average_late_minutes", header: translate("attendance.avgLateMin") },
      {
        key: "repeated_late",
        header: translate("attendance.repeatedLate"),
        render: (row: LatenessSummaryEmployee) =>
          row.repeated_late ? <Badge variant="warning">{translate("attendance.yes")}</Badge> : <span style={{ color: "var(--ds-color-text-muted)" }}>{translate("attendance.no")}</span>,
      },
      {
        key: "latest_late_at",
        header: translate("attendance.latestLateAt"),
        render: (row: LatenessSummaryEmployee) => (
          <span className="whitespace-nowrap text-xs tabular-nums">
            {formatBusinessDateTime(row.latest_late_at, businessTz)}
          </span>
        ),
      },
    ],
    [businessTz]
  );

  return (
    <MainContent>
      <div className="space-y-8">
        <AttendanceInsightPageHeader
          title={translate("attendance.latenessSummary")}
          subtitle={translate("attendance.latenessSubtitle")}
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
            summary={<AttendanceInsightSummaryGrid stats={stats} loading={loading && !data} ariaLabel={translate("attendance.latenessSummary")} />}
            insight={<AttendanceInsightPanel items={insights} />}
            results={
              <AttendanceInsightResults
                title={translate("attendance.latenessByEmployee")}
                columns={columns}
                rows={rows}
                keyExtractor={(row) => row.user_id}
                loading={loading && !data}
                refreshing={loading && Boolean(data)}
                emptyTitle={translate("attendance.noLatenessInPeriod")}
                emptyDescription={translate("attendance.noLateArrivalsRange")}
              />
            }
          />
        ) : null}
      </div>
    </MainContent>
  );
}
