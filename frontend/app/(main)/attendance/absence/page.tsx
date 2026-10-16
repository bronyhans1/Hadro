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
import type { AbsenceSummaryEmployee } from "@/lib/api/attendance.api";
import { buildAbsenceInsights, buildAbsenceStats } from "@/lib/attendance/attendanceInsightsUtils";
import { translate } from "@/lib/i18n";
import { safeApi } from "@/lib/api/safeApi";
import { toUserFacingApiError } from "@/lib/api/userFacingError";

export default function AbsenceSummaryPage() {
  const { start: defaultStart, end: defaultEnd } = getCurrentMonthRange();
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [data, setData] = useState<attendanceApi.AbsenceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await safeApi(attendanceApi.getAbsenceSummary(start, end));
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

  const stats = useMemo(() => (data ? buildAbsenceStats(data) : []), [data]);
  const insights = useMemo(() => (data ? buildAbsenceInsights(data) : []), [data]);
  const rows = useMemo(() => data?.employees ?? [], [data]);

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: translate("attendance.employee"),
        render: (row: AbsenceSummaryEmployee) => <EmployeeInsightCell name={row.name} />,
      },
      { key: "absence_count", header: translate("attendance.absenceCount") },
      {
        key: "repeated_absence",
        header: translate("attendance.repeatedAbsence"),
        render: (row: AbsenceSummaryEmployee) =>
          row.repeated_absence ? <Badge variant="warning">{translate("attendance.yes")}</Badge> : <span style={{ color: "var(--ds-color-text-muted)" }}>{translate("attendance.no")}</span>,
      },
      {
        key: "absence_dates",
        header: translate("attendance.absenceDates"),
        render: (row: AbsenceSummaryEmployee) => (
          <span className="text-xs" style={{ color: "var(--ds-color-text-secondary)" }}>
            {row.absence_dates?.join(", ") ?? "—"}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <MainContent>
      <div className="space-y-8">
        <AttendanceInsightPageHeader
          title={translate("attendance.absenceSummary")}
          subtitle={translate("attendance.absenceSubtitle")}
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
            summary={<AttendanceInsightSummaryGrid stats={stats} loading={loading && !data} ariaLabel={translate("attendance.absenceSummary")} />}
            insight={<AttendanceInsightPanel items={insights} />}
            results={
              <AttendanceInsightResults
                title={translate("attendance.absencesByEmployee")}
                columns={columns}
                rows={rows}
                keyExtractor={(row) => row.user_id}
                loading={loading && !data}
                refreshing={loading && Boolean(data)}
                emptyTitle={translate("attendance.noAbsencesInPeriod")}
                emptyDescription={translate("attendance.noAbsencesRecorded")}
              />
            }
          />
        ) : null}
      </div>
    </MainContent>
  );
}
