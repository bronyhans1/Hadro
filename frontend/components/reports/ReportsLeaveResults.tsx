"use client";

import type { LeaveReportRow } from "@/lib/api/reports.api";
import { LeaveCompensationDisplay } from "@/components/leave/LeaveCompensationDisplay";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { TablePagination } from "@/components/ui/TablePagination";
import { leaveTypeLabel } from "@/lib/leave/leaveTypes";
import {
  reportsDesktopTableClass,
  reportsMobileCardsClass,
} from "@/lib/reports/reportsMobileLayout";
import { cn } from "@/lib/design-system/cn";
import { formatBusinessDateTime } from "@/lib/utils/businessDateTime";
import { translate } from "@/lib/i18n";

interface ReportsLeaveResultsProps {
  rows: LeaveReportRow[];
  total: number;
  page: number;
  limit: number;
  loading?: boolean;
  businessTimeZone: string;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

function statusBadge(status: string) {
  const s = status?.toLowerCase() ?? "";
  if (s === "approved") return <Badge variant="success">{translate("leave.approved")}</Badge>;
  if (s === "rejected") return <Badge variant="danger">{translate("leave.rejected")}</Badge>;
  if (s === "cancelled") return <Badge variant="default">{translate("leave.cancelled")}</Badge>;
  if (s === "terminated") return <Badge variant="default">{translate("leave.terminated")}</Badge>;
  if (s === "completed") return <Badge variant="default">{translate("attendance.completed")}</Badge>;
  return <Badge variant="warning">{translate("leave.pending")}</Badge>;
}

export function ReportsLeaveResults({
  rows,
  total,
  page,
  limit,
  loading,
  businessTimeZone,
  onPreviousPage,
  onNextPage,
}: ReportsLeaveResultsProps) {
  if (loading && rows.length === 0) {
    return <LoadingState message={translate("reports.loadingReport")} className="min-h-[120px]" />;
  }

  if (rows.length === 0) {
    return <EmptyState message={translate("reports.noLeaveRows")} />;
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
        itemLabel={translate("reports.requestNoun", { count: total })}
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
                  {formatBusinessDateTime(r.reviewed_at, businessTimeZone)}
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
            <li key={r.id} className="min-w-0">
              <Card padding={false} className="overflow-hidden">
                <CardBody className="space-y-3">
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold" style={{ color: "var(--ds-color-text-primary)" }}>
                        {r.employee_name}
                      </p>
                      <p className="break-all text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
                        {r.employee_email}
                      </p>
                    </div>
                    {statusBadge(r.status)}
                  </div>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    <div className="min-w-0">
                      <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("attendance.type")}</dt>
                      <dd className="mt-0.5" style={{ color: "var(--ds-color-text-primary)" }}>
                        {leaveTypeLabel(r.leave_type)}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("leave.daysColumn")}</dt>
                      <dd className="mt-0.5" style={{ color: "var(--ds-color-text-primary)" }}>
                        {r.total_days}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("leave.start")}</dt>
                      <dd className="mt-0.5" style={{ color: "var(--ds-color-text-primary)" }}>
                        {r.start_date}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("leave.end")}</dt>
                      <dd className="mt-0.5" style={{ color: "var(--ds-color-text-primary)" }}>
                        {r.end_date}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("leave.compensation")}</dt>
                      <dd className="mt-0.5">
                        <LeaveCompensationDisplay
                          compensation={r.leave_compensation_type}
                          overridden={
                            r.leave_compensation_overridden ??
                            r.leave_compensation_source === "override"
                          }
                          variant="hr"
                        />
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("attendance.branch")}</dt>
                      <dd className="mt-0.5 truncate" style={{ color: "var(--ds-color-text-primary)" }}>
                        {r.branch_name || "—"}
                      </dd>
                    </div>
                    <div className="min-w-0 col-span-2">
                      <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("reports.reviewedBy")}</dt>
                      <dd className="mt-0.5 truncate" style={{ color: "var(--ds-color-text-primary)" }}>
                        {r.reviewed_by_name || "—"}
                      </dd>
                    </div>
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
