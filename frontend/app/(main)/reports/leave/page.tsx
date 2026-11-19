"use client";

import { useCallback, useEffect, useState } from "react";
import { MainContent } from "@/components/layout/MainContent";
import { Button } from "@/components/ui";
import { Card } from "@/components/ui/Card";
import { DateRangeFilter } from "@/components/ui/DateRangeFilter";
import { Select } from "@/components/ui/FormControls";
import { ErrorState } from "@/components/ui/ErrorState";
import { AccessDeniedState } from "@/components/ui/AccessDeniedState";
import { ResponsiveFilterCard } from "@/components/ui/FilterCard";
import { useAuth } from "@/lib/auth/AuthContext";
import { canAccessManagerFeatures, hasRole } from "@/lib/auth/roles";
import { getCurrentMonthRange } from "@/lib/utils/date";
import { ReportDatePresetButtons } from "@/components/ui/ReportDatePresetButtons";
import { ExportSuccessNotice } from "@/components/ui/ExportSuccessNotice";
import { PayrollSection } from "@/components/payroll/PayrollSection";
import { ReportsBackLink } from "@/components/reports/ReportsBackLink";
import { ReportsPageHeader } from "@/components/reports/ReportsPageHeader";
import { ReportsFilterSubsection } from "@/components/reports/ReportsFilterSubsection";
import { ReportsLeaveResults } from "@/components/reports/ReportsLeaveResults";
import * as reportsApi from "@/lib/api/reports.api";
import * as usersApi from "@/lib/api/users.api";
import * as branchesApi from "@/lib/api/branches.api";
import { isApiError } from "@/lib/types/api";
import type { UserListItem } from "@/lib/api/users.api";
import type { BranchDto } from "@/lib/api/branches.api";
import { safeApi } from "@/lib/api/safeApi";
import { toUserFacingApiError } from "@/lib/api/userFacingError";
import {
  reportsExportActionClass,
  reportsExportActionsRowClass,
} from "@/lib/reports/reportsMobileLayout";
import { translate } from "@/lib/i18n";

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

        <ResponsiveFilterCard mobileId="reports-leave-filters">
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

            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="min-w-0 w-full sm:max-w-xs">
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
                  className="input-field w-full rounded-md py-2"
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
                <div className="min-w-0 w-full sm:max-w-xs">
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
                    className="input-field w-full rounded-md py-2"
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
              <div className="min-w-0 w-full sm:max-w-xs">
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
                  className="input-field w-full rounded-md py-2"
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
        </ResponsiveFilterCard>

        <PayrollSection title={translate("reports.export")}>
          <Card>
            <div className={reportsExportActionsRowClass()}>
              <Button
                type="button"
                size="sm"
                className={reportsExportActionClass()}
                onClick={() => void handleExportCsv()}
                disabled={exportBusy || loading}
                loading={exportBusy}
              >
                {translate("reports.exportCsv")}
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
            <ReportsLeaveResults
              rows={rows}
              total={total}
              page={page}
              limit={limit}
              loading={loading}
              businessTimeZone={businessTz}
              onPreviousPage={() => setPage((p) => Math.max(1, p - 1))}
              onNextPage={() => setPage((p) => Math.min(totalPages, p + 1))}
            />
          </Card>
        </PayrollSection>
      </div>
    </MainContent>
  );
}
