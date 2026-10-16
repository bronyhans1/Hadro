"use client";

import { useCallback, useEffect, useState } from "react";
import { MainContent } from "@/components/layout/MainContent";
import { Button } from "@/components/ui";
import { Card } from "@/components/ui/Card";
import { DateRangeFilter } from "@/components/ui/DateRangeFilter";
import { Select } from "@/components/ui/FormControls";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { AccessDeniedState } from "@/components/ui/AccessDeniedState";
import { useAuth } from "@/lib/auth/AuthContext";
import { canAccessManagerFeatures, hasRole } from "@/lib/auth/roles";
import { getCurrentMonthRange } from "@/lib/utils/date";
import { ReportDatePresetButtons } from "@/components/ui/ReportDatePresetButtons";
import { TablePagination } from "@/components/ui/TablePagination";
import { ExportSuccessNotice } from "@/components/ui/ExportSuccessNotice";
import { PayrollSection } from "@/components/payroll/PayrollSection";
import { ReportsBackLink } from "@/components/reports/ReportsBackLink";
import { ReportsPageHeader } from "@/components/reports/ReportsPageHeader";
import { ReportsFilterSubsection } from "@/components/reports/ReportsFilterSubsection";
import * as reportsApi from "@/lib/api/reports.api";
import * as usersApi from "@/lib/api/users.api";
import * as branchesApi from "@/lib/api/branches.api";
import { isApiError } from "@/lib/types/api";
import type { UserListItem } from "@/lib/api/users.api";
import type { BranchDto } from "@/lib/api/branches.api";
import { formatBusinessDateTime } from "@/lib/utils/businessDateTime";
import { safeApi } from "@/lib/api/safeApi";
import { toUserFacingApiError } from "@/lib/api/userFacingError";
import { translate } from "@/lib/i18n";

export default function AttendanceReportPage() {
  const { user } = useAuth();
  const businessTz = user?.businessTimeZone ?? "Africa/Accra";
  const allowed = canAccessManagerFeatures(user?.roles);
  const canFilterBranch = hasRole(user?.roles, ["admin"]);

  const { start: defaultStart, end: defaultEnd } = getCurrentMonthRange();
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [employeeId, setEmployeeId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [employees, setEmployees] = useState<UserListItem[]>([]);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [page, setPage] = useState(1);
  const limit = 50;

  const [rows, setRows] = useState<reportsApi.AttendanceReportRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportBusy, setExportBusy] = useState<"csv" | "xlsx" | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    (async () => {
      const u = await safeApi(usersApi.getUsers());
      if (!isApiError(u)) setEmployees(u.data ?? []);
      try {
        const b = await safeApi(branchesApi.getBranches());
        if (!isApiError(b)) setBranches(b.data ?? []);
      } catch {
        setBranches([]);
      }
    })();
  }, [allowed]);

  const load = useCallback(async () => {
    if (!allowed) return;
    setError(null);
    setLoading(true);
    try {
      const res = await safeApi(reportsApi.getAttendanceReport({
        start,
        end,
        page,
        limit,
        user_id: employeeId.trim() || undefined,
        branch_id: canFilterBranch && branchId.trim() ? branchId.trim() : undefined,
      }));
      if (isApiError(res)) {
        setError(res.error ?? translate("reports.failedLoadReport"));
        setRows([]);
        setTotal(0);
        return;
      }
      setRows(res.data?.rows ?? []);
      setTotal(res.data?.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : translate("reports.failedLoad"));
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [allowed, start, end, page, limit, employeeId, branchId, canFilterBranch]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleExport(kind: "csv" | "xlsx") {
    setError(null);
    setExportSuccess(null);
    if (!start || !end) {
      setError(translate("reports.startEndRequired"));
      return;
    }
    setExportBusy(kind);
    try {
      const fn =
        kind === "csv"
          ? reportsApi.downloadAttendanceReportCsv
          : reportsApi.downloadAttendanceReportExcel;
      const result = await fn({
        start,
        end,
        user_id: employeeId.trim() || undefined,
        branch_id: canFilterBranch && branchId.trim() ? branchId.trim() : undefined,
      });
      if (!result.ok) setError(result.error ?? translate("payroll.exportFailed"));
      else setExportSuccess(translate("reports.downloadStarted"));
    } finally {
      setExportBusy(null);
    }
  }

  if (!allowed) {
    return (
      <MainContent title={translate("reports.attendanceReport")}>
        <AccessDeniedState description={translate("reports.reportAccessDenied")} />
      </MainContent>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <MainContent>
      <div className="space-y-8">
        <div className="space-y-4">
          <ReportsBackLink />
          <ReportsPageHeader
            title={translate("reports.attendanceReport")}
            subtitle={translate("reports.attendanceReportSubtitle")}
          />
        </div>

        <PayrollSection title={translate("reports.filters")}>
          <Card>
            <div className="space-y-5">
              <ReportsFilterSubsection title={translate("reports.quickRange")}>
                <ReportDatePresetButtons
                  hideLabel
                  disabled={loading || exportBusy !== null}
                  start={start}
                  end={end}
                  onSelect={(s, e) => {
                    setPage(1);
                    setStart(s);
                    setEnd(e);
                  }}
                />
              </ReportsFilterSubsection>

              <ReportsFilterSubsection title={translate("attendance.dateRange")}>
                <DateRangeFilter
                  start={start}
                  end={end}
                  onStartChange={(v) => {
                    setPage(1);
                    setStart(v);
                  }}
                  onEndChange={(v) => {
                    setPage(1);
                    setEnd(v);
                  }}
                  onApply={() => undefined}
                  showApply={false}
                  loading={loading}
                />
              </ReportsFilterSubsection>

              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label htmlFor="rep-att-emp" className="mb-1 block text-xs font-medium text-theme-muted">
                    {translate("attendance.employee")}
                  </label>
                  <Select
                    id="rep-att-emp"
                    value={employeeId}
                    onChange={(e) => {
                      setPage(1);
                      setEmployeeId(e.target.value);
                    }}
                    className="input-field max-w-xs rounded-md py-2"
                  >
                    <option value="">{translate("reports.allInScope")}</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {[e.first_name, e.last_name].filter(Boolean).join(" ") || e.email}
                      </option>
                    ))}
                  </Select>
                </div>
                {canFilterBranch ? (
                  <div>
                    <label htmlFor="rep-att-branch" className="mb-1 block text-xs font-medium text-theme-muted">
                      {translate("attendance.branch")}
                    </label>
                    <Select
                      id="rep-att-branch"
                      value={branchId}
                      onChange={(e) => {
                        setPage(1);
                        setBranchId(e.target.value);
                      }}
                      className="input-field max-w-xs rounded-md py-2"
                    >
                      <option value="">{translate("employees.allBranches")}</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                          {b.is_default ? translate("employees.defaultSuffix") : ""}
                        </option>
                      ))}
                    </Select>
                  </div>
                ) : null}
              </div>
            </div>
          </Card>
        </PayrollSection>

        <PayrollSection title={translate("reports.export")}>
          <Card>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => void handleExport("csv")}
                disabled={exportBusy !== null || loading}
                loading={exportBusy === "csv"}
              >
                {translate("reports.exportCsv")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleExport("xlsx")}
                disabled={exportBusy !== null || loading}
                loading={exportBusy === "xlsx"}
              >
                {translate("reports.exportExcel")}
              </Button>
            </div>
            <div className="mt-3">
              <ExportSuccessNotice message={exportSuccess} />
            </div>
          </Card>
        </PayrollSection>

        {error ? (
          <ErrorState message={toUserFacingApiError(error)} onRetry={load} />
        ) : null}

        <PayrollSection title={translate("attendance.results")}>
          <Card>
            {loading && rows.length === 0 ? (
              <LoadingState message={translate("reports.loadingReport")} className="min-h-[120px]" />
            ) : rows.length === 0 ? (
              <EmptyState message={translate("reports.noAttendanceRows")} />
            ) : (
              <>
                {loading ? (
                  <p className="mb-2 ds-caption text-[var(--ds-color-primary)]" aria-live="polite">
                    {translate("reports.updatingResults")}
                  </p>
                ) : null}
                <TablePagination
                  className="mb-4"
                  page={page}
                  pageSize={limit}
                  total={total}
                  currentCount={rows.length}
                  loading={loading}
                  itemLabel={translate("reports.recordNoun", { count: total })}
                  onPrevious={() => setPage((p) => Math.max(1, p - 1))}
                  onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                />
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm text-theme">
                    <thead>
                      <tr
                        className="border-b text-xs uppercase text-theme-muted"
                        style={{ borderColor: "var(--border-soft)" }}
                      >
                        <th className="py-2.5 pr-3">{translate("attendance.employee")}</th>
                        <th className="py-2.5 pr-3">{translate("attendance.branch")}</th>
                        <th className="py-2.5 pr-3">{translate("attendance.department")}</th>
                        <th className="py-2.5 pr-3">{translate("attendance.attendanceDay")}</th>
                        <th className="py-2.5 pr-3">{translate("reports.clockIn")}</th>
                        <th className="py-2.5 pr-3">{translate("reports.clockOut")}</th>
                        <th className="py-2.5 pr-3">{translate("attendance.status")}</th>
                        <th className="py-2.5 pr-3">{translate("attendance.duration")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr
                          key={r.session_id}
                          className="border-b"
                          style={{ borderColor: "var(--border-soft)" }}
                        >
                          <td className="py-2.5 pr-3">
                            <div className="font-medium text-theme">{r.employee_name}</div>
                            <div className="text-xs text-theme-muted">{r.employee_email}</div>
                          </td>
                          <td className="py-2.5 pr-3">{r.branch_name || "—"}</td>
                          <td className="py-2.5 pr-3">{r.department_name}</td>
                          <td className="py-2.5 pr-3 whitespace-nowrap">
                            {r.attendance_date ?? (r.check_in ? r.check_in.slice(0, 10) : "—")}
                          </td>
                          <td className="py-2.5 pr-3 whitespace-nowrap">{formatBusinessDateTime(r.check_in, businessTz)}</td>
                          <td className="py-2.5 pr-3 whitespace-nowrap">{formatBusinessDateTime(r.check_out, businessTz)}</td>
                          <td className="py-2.5 pr-3">{r.status}</td>
                          <td className="py-2.5 pr-3">
                            {r.duration_minutes != null ? translate("reports.durationMinutes", { values: { minutes: r.duration_minutes } }) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
        </PayrollSection>
      </div>
    </MainContent>
  );
}
