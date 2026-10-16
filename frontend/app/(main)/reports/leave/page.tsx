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
import { Badge } from "@/components/ui/Badge";
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
import { leaveTypeLabel } from "@/lib/leave/leaveTypes";
import { LeaveCompensationDisplay } from "@/components/leave/LeaveCompensationDisplay";
import { toUserFacingApiError } from "@/lib/api/userFacingError";
import { translate } from "@/lib/i18n";

function statusBadge(status: string) {
  const s = status?.toLowerCase() ?? "";
  if (s === "approved") return <Badge variant="success">{translate("leave.approved")}</Badge>;
  if (s === "rejected") return <Badge variant="danger">{translate("leave.rejected")}</Badge>;
  if (s === "cancelled") return <Badge variant="default">{translate("leave.cancelled")}</Badge>;
  if (s === "terminated") return <Badge variant="default">{translate("leave.terminated")}</Badge>;
  if (s === "completed") return <Badge variant="default">{translate("attendance.completed")}</Badge>;
  return <Badge variant="warning">{translate("leave.pending")}</Badge>;
}

export default function LeaveReportPage() {
  const { user } = useAuth();
  const businessTz = user?.businessTimeZone ?? "Africa/Accra";
  const allowed = canAccessManagerFeatures(user?.roles);
  const canFilterBranch = hasRole(user?.roles, ["admin"]);

  const { start: defaultStart, end: defaultEnd } = getCurrentMonthRange();
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [employeeId, setEmployeeId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [status, setStatus] = useState<
    "" | "pending" | "approved" | "rejected" | "cancelled" | "terminated" | "completed"
  >("");
  const [employees, setEmployees] = useState<UserListItem[]>([]);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [page, setPage] = useState(1);
  const limit = 50;

  const [rows, setRows] = useState<reportsApi.LeaveReportRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportBusy, setExportBusy] = useState(false);
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
      const res = await safeApi(reportsApi.getLeaveReport({
        start,
        end,
        page,
        limit,
        user_id: employeeId.trim() || undefined,
        branch_id: canFilterBranch && branchId.trim() ? branchId.trim() : undefined,
        status: status || undefined,
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
  }, [allowed, start, end, page, limit, employeeId, branchId, status, canFilterBranch]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleExportCsv() {
    setError(null);
    setExportSuccess(null);
    if (!start || !end) {
      setError(translate("reports.startEndRequired"));
      return;
    }
    setExportBusy(true);
    try {
      const result = await reportsApi.downloadLeaveReportCsv({
        start,
        end,
        user_id: employeeId.trim() || undefined,
        branch_id: canFilterBranch && branchId.trim() ? branchId.trim() : undefined,
        status: status || undefined,
      });
      if (!result.ok) setError(result.error ?? translate("payroll.exportFailed"));
      else setExportSuccess(translate("reports.downloadStarted"));
    } finally {
      setExportBusy(false);
    }
  }

  if (!allowed) {
    return (
      <MainContent title={translate("reports.leaveReport")}>
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
            title={translate("reports.leaveReport")}
            subtitle={translate("reports.leaveReportSubtitle")}
          />
        </div>

        <PayrollSection title={translate("reports.filters")}>
          <Card>
            <div className="space-y-5">
              <ReportsFilterSubsection title={translate("reports.quickRange")}>
                <ReportDatePresetButtons
                  hideLabel
                  disabled={loading || exportBusy}
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
                  <label htmlFor="rep-lv-emp" className="mb-1 block text-xs font-medium text-theme-muted">
                    {translate("attendance.employee")}
                  </label>
                  <Select
                    id="rep-lv-emp"
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
                    <label htmlFor="rep-lv-branch" className="mb-1 block text-xs font-medium text-theme-muted">
                      {translate("attendance.branch")}
                    </label>
                    <Select
                      id="rep-lv-branch"
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
                <div>
                  <label htmlFor="rep-lv-status" className="mb-1 block text-xs font-medium text-theme-muted">
                    {translate("attendance.status")}
                  </label>
                  <Select
                    id="rep-lv-status"
                    value={status}
                    onChange={(e) => {
                      setPage(1);
                      setStatus(e.target.value as typeof status);
                    }}
                    className="input-field rounded-md py-2"
                  >
                    <option value="">{translate("leave.all")}</option>
                    <option value="pending">{translate("leave.pending")}</option>
                    <option value="approved">{translate("leave.approved")}</option>
                    <option value="rejected">{translate("leave.rejected")}</option>
                    <option value="cancelled">{translate("leave.cancelled")}</option>
                    <option value="terminated">{translate("leave.terminated")}</option>
                    <option value="completed">{translate("attendance.completed")}</option>
                  </Select>
                </div>
              </div>
            </div>
          </Card>
        </PayrollSection>

        <PayrollSection title={translate("reports.export")}>
          <Card>
            <Button
              type="button"
              size="sm"
              onClick={() => void handleExportCsv()}
              disabled={exportBusy || loading}
              loading={exportBusy}
            >
              {translate("reports.exportCsv")}
            </Button>
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
              <EmptyState message={translate("reports.noLeaveRows")} />
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
                  itemLabel={translate("reports.requestNoun", { count: total })}
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
                        <th className="py-2.5 pr-3">{translate("attendance.type")}</th>
                        <th className="py-2.5 pr-3">{translate("leave.compensation")}</th>
                        <th className="py-2.5 pr-3">{translate("reports.source")}</th>
                        <th className="py-2.5 pr-3">{translate("leave.start")}</th>
                        <th className="py-2.5 pr-3">{translate("leave.end")}</th>
                        <th className="py-2.5 pr-3">{translate("leave.daysColumn")}</th>
                        <th className="py-2.5 pr-3">{translate("attendance.status")}</th>
                        <th className="py-2.5 pr-3">{translate("reports.reviewedBy")}</th>
                        <th className="py-2.5 pr-3">{translate("reports.reviewedAt")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b"
                          style={{ borderColor: "var(--border-soft)" }}
                        >
                          <td className="py-2.5 pr-3">
                            <div className="font-medium text-theme">{r.employee_name}</div>
                            <div className="text-xs text-theme-muted">{r.employee_email}</div>
                          </td>
                          <td className="py-2.5 pr-3">{r.branch_name || "—"}</td>
                          <td className="py-2.5 pr-3">{leaveTypeLabel(r.leave_type)}</td>
                          <td className="py-2.5 pr-3">
                            <LeaveCompensationDisplay
                              compensation={r.leave_compensation_type}
                              overridden={
                                r.leave_compensation_overridden ??
                                r.leave_compensation_source === "override"
                              }
                              variant="hr"
                            />
                          </td>
                          <td className="py-2.5 pr-3 text-sm text-theme-muted">
                            {r.leave_compensation_source === "override" ||
                            r.leave_compensation_overridden
                              ? translate("leave.overrideBadge")
                              : translate("leave.defaultBadge")}
                          </td>
                          <td className="py-2.5 pr-3 whitespace-nowrap">{r.start_date}</td>
                          <td className="py-2.5 pr-3 whitespace-nowrap">{r.end_date}</td>
                          <td className="py-2.5 pr-3">{r.total_days}</td>
                          <td className="py-2.5 pr-3">{statusBadge(r.status)}</td>
                          <td className="py-2.5 pr-3">{r.reviewed_by_name || "—"}</td>
                          <td className="py-2.5 pr-3 whitespace-nowrap text-xs text-theme-muted">
                            {formatBusinessDateTime(r.reviewed_at, businessTz)}
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
