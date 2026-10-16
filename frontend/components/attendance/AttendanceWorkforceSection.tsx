"use client";

import Link from "next/link";
import { SessionTypeBadge } from "@/components/attendance/SessionTypeBadge";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { AvatarPhoto } from "@/components/ui/AvatarPhoto";
import { formatMinutes } from "@/lib/dashboard/formatters";
import { formatBusinessDateTime } from "@/lib/utils/businessDateTime";
import { cn } from "@/lib/design-system/cn";
import { translate } from "@/lib/i18n";

export interface WorkforceSessionRow {
  user_id: string;
  check_in: string | null;
  department_id?: string | null;
  attendance_mode?: string | null;
  remote_approval_status?: string | null;
  displayName?: string;
  photoUrl?: string | null;
  departmentName?: string | null;
}

interface AttendanceWorkforceSectionProps {
  canViewCompany: boolean;
  activeSessions: WorkforceSessionRow[];
  businessTimeZone: string;
  overviewPresent: number;
  overviewCompleted: number;
  overviewLate: number;
  overviewAbsent: number;
  overviewWorkedMinutes: number;
  onEmployeeClick?: (userId: string) => void;
}

function SessionAvatar({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
  const initial = (name[0] ?? "?").toUpperCase();
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold"
      style={{ background: "var(--ds-color-primary-muted)", color: "var(--ds-color-primary)" }}
      aria-hidden
    >
      {photoUrl ? (
        <AvatarPhoto src={photoUrl} alt="" size={40} className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="ds-label">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums" style={{ color: "var(--ds-color-text-primary)" }}>
        {value}
      </dd>
    </div>
  );
}

export function AttendanceWorkforceSection({
  canViewCompany,
  activeSessions,
  businessTimeZone,
  overviewPresent,
  overviewCompleted,
  overviewLate,
  overviewAbsent,
  overviewWorkedMinutes,
  onEmployeeClick,
}: AttendanceWorkforceSectionProps) {
  if (!canViewCompany) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Card padding={false}>
          <CardHeader title={translate("attendance.yourDay")} />
          <CardBody>
            <dl className="grid grid-cols-2 gap-4">
              <SummaryStat label={translate("attendance.present")} value={overviewPresent} />
              <SummaryStat label={translate("attendance.completed")} value={overviewCompleted} />
            </dl>
            <p className="mt-4 text-sm" style={{ color: "var(--ds-color-text-muted)" }}>
              {translate("attendance.companyWideTotals")}
            </p>
          </CardBody>
          <CardFooter>
            <Link href="/attendance/history" className="text-sm font-medium" style={{ color: "var(--ds-color-primary)" }}>
              {translate("attendance.attendanceHistory")} →
            </Link>
          </CardFooter>
        </Card>

        <Card padding={false}>
          <CardHeader title={translate("attendance.todaysAttendanceSummary")} />
          <CardBody>
            <dl className="grid grid-cols-2 gap-4">
              <SummaryStat label={translate("attendance.late")} value={overviewLate} />
              <SummaryStat label={translate("attendance.workedTime")} value={formatMinutes(overviewWorkedMinutes)} />
            </dl>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card padding={false}>
        <CardHeader title={translate("attendance.currentlyWorking")} />
        <CardBody>
          {activeSessions.length === 0 ? (
            <EmptyState title={translate("attendance.noOneClockedIn")} description={translate("attendance.noEmployeesWorking")} />
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto pr-1" role="list" aria-label={translate("attendance.employeesCurrentlyWorking")}>
              {activeSessions.map((s) => {
                const name = s.displayName ?? `${s.user_id.slice(0, 8)}…`;
                const clickable = Boolean(onEmployeeClick);
                return (
                  <li key={`${s.user_id}-${s.check_in ?? ""}`}>
                    <button
                      type="button"
                      onClick={() => onEmployeeClick?.(s.user_id)}
                      disabled={!clickable}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                        clickable &&
                          "hover:bg-[var(--ds-color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
                      )}
                      style={{ borderColor: "var(--ds-color-border)" }}
                      aria-label={clickable ? `View profile for ${name}` : undefined}
                    >
                      <SessionAvatar name={name} photoUrl={s.photoUrl} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium" style={{ color: "var(--ds-color-text-primary)" }}>
                          {name}
                        </p>
                        <p className="truncate text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
                          {s.departmentName ?? translate("attendance.noDepartment")} · {translate("attendance.inLabel")}{" "}
                          {formatBusinessDateTime(s.check_in, businessTimeZone)}
                        </p>
                      </div>
                      <SessionTypeBadge
                        attendanceMode={s.attendance_mode}
                        remoteApprovalStatus={s.remote_approval_status}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card padding={false}>
        <CardHeader title={translate("attendance.todaysAttendanceSummary")} />
        <CardBody>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <SummaryStat label={translate("attendance.present")} value={overviewPresent} />
            <SummaryStat label={translate("attendance.completed")} value={overviewCompleted} />
            <SummaryStat label={translate("attendance.late")} value={overviewLate} />
            <SummaryStat label={translate("attendance.absent")} value={overviewAbsent} />
            <SummaryStat label={translate("attendance.workedTime")} value={formatMinutes(overviewWorkedMinutes)} />
          </dl>
        </CardBody>
        <CardFooter className="flex flex-wrap gap-4">
          <Link href="/attendance/history" className="text-sm font-medium" style={{ color: "var(--ds-color-primary)" }}>
            {translate("attendance.attendanceHistory")} →
          </Link>
          <Link href="/employees" className="text-sm font-medium" style={{ color: "var(--ds-color-primary)" }}>
            Employees →
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
