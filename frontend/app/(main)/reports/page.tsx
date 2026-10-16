"use client";

import { useMemo, useState } from "react";
import { MainContent } from "@/components/layout/MainContent";
import { Button } from "@/components/ui";
import { FilterChip } from "@/components/ui/FilterChip";
import { Card } from "@/components/ui/Card";
import { DateRangeFilter } from "@/components/ui/DateRangeFilter";
import { Select } from "@/components/ui/FormControls";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { AccessDeniedState } from "@/components/ui/AccessDeniedState";
import { useAuth } from "@/lib/auth/AuthContext";
import { canAccessManagerFeatures } from "@/lib/auth/roles";
import { getCurrentMonthRange, getYearMonthPreset } from "@/lib/utils/date";
import * as attendanceApi from "@/lib/api/attendance.api";
import * as payrollApi from "@/lib/api/payroll.api";
import { ReportDatePresetButtons } from "@/components/ui/ReportDatePresetButtons";
import { ExportSuccessNotice } from "@/components/ui/ExportSuccessNotice";
import { PayrollSection } from "@/components/payroll/PayrollSection";
import { ReportsPageHeader } from "@/components/reports/ReportsPageHeader";
import { ReportsOperationalCards } from "@/components/reports/ReportsOperationalCards";
import { ReportsFilterSubsection } from "@/components/reports/ReportsFilterSubsection";
import { safeApi } from "@/lib/api/safeApi";
import { translate } from "@/lib/i18n";

function currentYearMonth(): { year: number; month: number } {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export default function ReportsPage() {
  const { user } = useAuth();
  const allowed = canAccessManagerFeatures(user?.roles);
  const payrollEnabled = user?.payrollEnabled !== false;

  const { start: defaultStart, end: defaultEnd } = getCurrentMonthRange();
  const { year: defaultYear, month: defaultMonth } = useMemo(currentYearMonth, []);

  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [attendanceLoading, setAttendanceLoading] = useState<string | null>(null);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [attendanceExportOk, setAttendanceExportOk] = useState<string | null>(null);

  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);
  const [payrollLoading, setPayrollLoading] = useState<string | null>(null);
  const thisMonthPreset = useMemo(() => getYearMonthPreset("this_month"), []);
  const lastMonthPreset = useMemo(() => getYearMonthPreset("last_month"), []);
  const [payrollError, setPayrollError] = useState<string | null>(null);
  const [payrollExportOk, setPayrollExportOk] = useState<string | null>(null);

  async function runAttendanceExport(kind: "lateness" | "flags" | "absence") {
    setAttendanceError(null);
    if (!start || !end) {
      setAttendanceError(translate("reports.datesRequired"));
      return;
    }
    setAttendanceLoading(kind);
    try {
      const fn =
        kind === "lateness"
          ? attendanceApi.downloadLatenessSummaryExcel
          : kind === "flags"
            ? attendanceApi.downloadFlagsSummaryExcel
            : attendanceApi.downloadAbsenceSummaryExcel;
      const result = await fn(start, end);
      if (!result.ok) {
        setAttendanceError(result.error ?? translate("payroll.downloadFailed"));
      }
    } finally {
      setAttendanceLoading(null);
    }
  }

  async function runPayrollExport(kind: "csv" | "excel") {
    setPayrollError(null);
    setPayrollExportOk(null);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      setPayrollError(translate("reports.validYear"));
      return;
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      setPayrollError(translate("reports.validMonth"));
      return;
    }
    setPayrollLoading(kind);
    try {
      const result =
        kind === "csv"
          ? await payrollApi.downloadPayrollCsv(year, month)
          : await payrollApi.downloadPayrollExcel(year, month);
      if (!result.ok) {
        setPayrollError(result.error ?? translate("payroll.exportFailed"));
      } else {
        setPayrollExportOk(translate("reports.downloadStarted"));
      }
    } finally {
      setPayrollLoading(null);
    }
  }

  return (
    <MainContent>
      <div className="space-y-8">
        <ReportsPageHeader
          title={translate("navigation.reports")}
          subtitle={translate("reports.subtitle")}
        />

        {!allowed ? (
          <AccessDeniedState description={translate("reports.accessDenied")} />
        ) : (
          <>
            <PayrollSection title={translate("reports.operationalReports")}>
              <Card>
                <ReportsOperationalCards />
              </Card>
            </PayrollSection>

            <PayrollSection title={translate("reports.attendanceExports")}>
              <Card>
                <div className="space-y-5">
                  <ReportsFilterSubsection title={translate("reports.quickRange")}>
                    <ReportDatePresetButtons
                      hideLabel
                      disabled={attendanceLoading !== null}
                      start={start}
                      end={end}
                      onSelect={(s, e) => {
                        setStart(s);
                        setEnd(e);
                      }}
                    />
                  </ReportsFilterSubsection>

                  <ReportsFilterSubsection title={translate("attendance.dateRange")}>
                    <DateRangeFilter
                      start={start}
                      end={end}
                      onStartChange={setStart}
                      onEndChange={setEnd}
                      onApply={() => {}}
                      loading={false}
                      showApply={false}
                    />
                  </ReportsFilterSubsection>

                  <ReportsFilterSubsection title={translate("reports.exportActions")}>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => runAttendanceExport("lateness")}
                        disabled={attendanceLoading !== null}
                        loading={attendanceLoading === "lateness"}
                      >
                        {translate("reports.latenessExcel")}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => runAttendanceExport("flags")}
                        disabled={attendanceLoading !== null}
                        loading={attendanceLoading === "flags"}
                      >
                        {translate("reports.flagsExcel")}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => runAttendanceExport("absence")}
                        disabled={attendanceLoading !== null}
                        loading={attendanceLoading === "absence"}
                      >
                        {translate("reports.absenceExcel")}
                      </Button>
                    </div>
                  </ReportsFilterSubsection>
                </div>

                {attendanceError ? (
                  <div className="mt-4">
                    <ErrorState message={attendanceError} />
                  </div>
                ) : null}
                <div className="mt-3">
                  <ExportSuccessNotice message={attendanceExportOk} />
                </div>
              </Card>
            </PayrollSection>

            {payrollEnabled ? (
              <PayrollSection title={translate("reports.payrollExports")}>
                <Card>
                  <div className="space-y-5">
                    <ReportsFilterSubsection title={translate("reports.quickPeriod")}>
                      <div className="flex flex-wrap gap-2">
                        <FilterChip
                          disabled={payrollLoading !== null}
                          selected={year === thisMonthPreset.year && month === thisMonthPreset.month}
                          onClick={() => {
                            setYear(thisMonthPreset.year);
                            setMonth(thisMonthPreset.month);
                          }}
                        >
                          {translate("reports.thisMonthSentence")}
                        </FilterChip>
                        <FilterChip
                          disabled={payrollLoading !== null}
                          selected={year === lastMonthPreset.year && month === lastMonthPreset.month}
                          onClick={() => {
                            setYear(lastMonthPreset.year);
                            setMonth(lastMonthPreset.month);
                          }}
                        >
                          {translate("reports.lastMonthSentence")}
                        </FilterChip>
                      </div>
                    </ReportsFilterSubsection>

                    <div className="flex flex-wrap items-end gap-4">
                      <div>
                        <label htmlFor="reports-year" className="mb-1 block text-xs font-medium text-theme-muted">
                          {translate("leave.year")}
                        </label>
                        <input
                          id="reports-year"
                          type="number"
                          min={2000}
                          max={2100}
                          value={year}
                          onChange={(e) => setYear(Number(e.target.value) || defaultYear)}
                          className="input-field w-24 py-1.5"
                        />
                      </div>
                      <div>
                        <label htmlFor="reports-month" className="mb-1 block text-xs font-medium text-theme-muted">
                          {translate("leave.month")}
                        </label>
                        <Select
                          id="reports-month"
                          value={String(month)}
                          onChange={(e) => setMonth(Number(e.target.value))}
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => runPayrollExport("csv")}
                          disabled={payrollLoading !== null}
                          loading={payrollLoading === "csv"}
                        >
                          {translate("reports.payrollCsv")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => runPayrollExport("excel")}
                          disabled={payrollLoading !== null}
                          loading={payrollLoading === "excel"}
                        >
                          {translate("reports.payrollExcel")}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {payrollError ? (
                    <div className="mt-4">
                      <ErrorState message={payrollError} />
                    </div>
                  ) : null}
                  <div className="mt-3">
                    <ExportSuccessNotice message={payrollExportOk} />
                  </div>
                </Card>
              </PayrollSection>
            ) : null}
          </>
        )}
      </div>
    </MainContent>
  );
}
