"use client";

import { EmployeeAvatar } from "@/components/employees/EmployeeAvatar";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { LeaveDayDetail } from "@/lib/leave/leaveCalendarUtils";
import { leaveToAvatarUser } from "@/lib/leave/leaveCalendarUtils";
import { leaveTypeLabel } from "@/lib/leave/leaveTypes";
import { formatMonthLabel } from "@/lib/utils/date";
import { translate } from "@/lib/i18n";

interface LeaveCalendarDayPanelProps {
  selectedDate: string | null;
  year: number;
  month: number;
  details: LeaveDayDetail[];
}

function formatSelectedDateLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function LeaveCalendarDayPanel({
  selectedDate,
  year,
  month,
  details,
}: LeaveCalendarDayPanelProps) {
  const title = selectedDate ? formatSelectedDateLabel(selectedDate) : formatMonthLabel(year, month);

  return (
    <Card padding={false} className="h-full">
      <CardHeader title={selectedDate ? translate("leave.dayDetails") : translate("leave.selectADay")} />
      <CardBody>
        {!selectedDate ? (
          <p className="text-sm" style={{ color: "var(--ds-color-text-muted)" }}>
            {translate("leave.chooseADay")}
          </p>
        ) : details.length === 0 ? (
          <EmptyState
            title={translate("leave.noLeaveOnSelectedDay")}
            description={translate("leave.noLeaveOnDate")}
            className="border-0 py-6"
          />
        ) : (
          <div className="space-y-4">
            <p className="text-sm font-medium" style={{ color: "var(--ds-color-text-secondary)" }}>
              {title}
            </p>
            <ul className="space-y-3" role="list" aria-label={translate("leave.leaveOnDate", { values: { date: selectedDate } })}>
              {details.map((detail) => (
                <li
                  key={detail.leave.id}
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: "var(--ds-color-border)",
                    background: "var(--ds-color-surface-muted)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <EmployeeAvatar user={leaveToAvatarUser(detail.leave)} size="md" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div>
                        <p className="font-semibold" style={{ color: "var(--ds-color-text-primary)" }}>
                          {detail.employeeName}
                        </p>
                        <Badge variant="default" className="mt-1">
                          {leaveTypeLabel(detail.leave.leave_type)}
                        </Badge>
                      </div>
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                        <div>
                          <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("attendance.department")}</dt>
                          <dd style={{ color: "var(--ds-color-text-primary)" }}>{detail.department}</dd>
                        </div>
                        <div>
                          <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("attendance.branch")}</dt>
                          <dd style={{ color: "var(--ds-color-text-primary)" }}>{detail.branch}</dd>
                        </div>
                        <div>
                          <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("leave.startDateTitle")}</dt>
                          <dd className="tabular-nums" style={{ color: "var(--ds-color-text-primary)" }}>
                            {detail.leave.start_date}
                          </dd>
                        </div>
                        <div>
                          <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("leave.endDateTitle")}</dt>
                          <dd className="tabular-nums" style={{ color: "var(--ds-color-text-primary)" }}>
                            {detail.leave.end_date}
                          </dd>
                        </div>
                        <div>
                          <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("leave.returnDate")}</dt>
                          <dd className="tabular-nums" style={{ color: "var(--ds-color-text-primary)" }}>
                            {detail.returnDate}
                          </dd>
                        </div>
                        {detail.remainingDays !== null ? (
                          <div>
                            <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("leave.remainingDays")}</dt>
                            <dd className="tabular-nums" style={{ color: "var(--ds-color-text-primary)" }}>
                              {detail.remainingDays}
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
