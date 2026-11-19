"use client";

import type { AttendanceReportRow } from "@/lib/api/reports.api";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { TablePagination } from "@/components/ui/TablePagination";
import {
  reportsDesktopTableClass,
  reportsMobileCardsClass,
} from "@/lib/reports/reportsMobileLayout";
import { cn } from "@/lib/design-system/cn";
import { formatBusinessDateTime } from "@/lib/utils/businessDateTime";
import { translate } from "@/lib/i18n";

interface ReportsAttendanceResultsProps {
  rows: AttendanceReportRow[];
  total: number;
  page: number;
  limit: number;
  loading?: boolean;
  businessTimeZone: string;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

export function ReportsAttendanceResults({
  rows,
  total,
  page,
  limit,
  loading,
  businessTimeZone,
  onPreviousPage,
  onNextPage,
}: ReportsAttendanceResultsProps) {
  if (loading && rows.length === 0) {
    return <LoadingState message={translate("reports.loadingReport")} className="min-h-[120px]" />;
  }

  if (rows.length === 0) {
    return <EmptyState message={translate("reports.noAttendanceRows")} />;
  }

  return (
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
        onPrevious={onPreviousPage}
        onNext={onNextPage}
      />

      <div className={cn(reportsDesktopTableClass(), "overflow-x-auto")}>
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
                <td className="py-2.5 pr-3 whitespace-nowrap">
                  {formatBusinessDateTime(r.check_in, businessTimeZone)}
                </td>
                <td className="py-2.5 pr-3 whitespace-nowrap">
                  {formatBusinessDateTime(r.check_out, businessTimeZone)}
                </td>
                <td className="py-2.5 pr-3">{r.status}</td>
                <td className="py-2.5 pr-3">
                  {r.duration_minutes != null
                    ? translate("reports.durationMinutes", { values: { minutes: r.duration_minutes } })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section
        className={cn(reportsMobileCardsClass())}
        aria-label={translate("attendance.results")}
      >
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.session_id} className="min-w-0">
              <Card padding={false} className="overflow-hidden">
                <CardBody className="space-y-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold" style={{ color: "var(--ds-color-text-primary)" }}>
                      {r.employee_name}
                    </p>
                    <p className="break-all text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
                      {r.employee_email}
                    </p>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    <div className="min-w-0">
                      <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("attendance.attendanceDay")}</dt>
                      <dd className="mt-0.5" style={{ color: "var(--ds-color-text-primary)" }}>
                        {r.attendance_date ?? (r.check_in ? r.check_in.slice(0, 10) : "—")}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("attendance.status")}</dt>
                      <dd className="mt-0.5" style={{ color: "var(--ds-color-text-primary)" }}>
                        {r.status}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("reports.clockIn")}</dt>
                      <dd className="mt-0.5 break-words tabular-nums" style={{ color: "var(--ds-color-text-primary)" }}>
                        {formatBusinessDateTime(r.check_in, businessTimeZone)}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("reports.clockOut")}</dt>
                      <dd className="mt-0.5 break-words tabular-nums" style={{ color: "var(--ds-color-text-primary)" }}>
                        {formatBusinessDateTime(r.check_out, businessTimeZone)}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("attendance.duration")}</dt>
                      <dd className="mt-0.5" style={{ color: "var(--ds-color-text-primary)" }}>
                        {r.duration_minutes != null
                          ? translate("reports.durationMinutes", { values: { minutes: r.duration_minutes } })
                          : "—"}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("attendance.branch")}</dt>
                      <dd className="mt-0.5 truncate" style={{ color: "var(--ds-color-text-primary)" }}>
                        {r.branch_name || "—"}
                      </dd>
                    </div>
                    {r.department_name ? (
                      <div className="min-w-0 col-span-2">
                        <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("attendance.department")}</dt>
                        <dd className="mt-0.5 truncate" style={{ color: "var(--ds-color-text-primary)" }}>
                          {r.department_name}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
