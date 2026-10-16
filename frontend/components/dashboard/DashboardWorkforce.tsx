"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { SessionTypeBadge } from "@/components/attendance/SessionTypeBadge";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { AvatarPhoto } from "@/components/ui/AvatarPhoto";
import { formatBusinessDateTime } from "@/lib/utils/businessDateTime";
import { translate } from "@/lib/i18n";

export interface WorkforceSession {
  user_id: string;
  check_in: string | null;
  attendance_mode?: string | null;
  remote_approval_status?: string | null;
  displayName?: string;
  photoUrl?: string | null;
}

interface DashboardWorkforceProps {
  canViewCompanyOps: boolean;
  activeSessions: WorkforceSession[];
  employeesActiveCount: number | null;
  employeesRestrictedCount: number | null;
  businessTimeZone: string;
  overviewPresent?: number;
  overviewCompleted?: number;
  overviewActive?: number;
}

function Avatar({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
  const initial = (name[0] ?? "?").toUpperCase();
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold"
      style={{ background: "var(--ds-color-primary-muted)", color: "var(--ds-color-primary)" }}
    >
      {photoUrl ? (
        <AvatarPhoto src={photoUrl} alt="" size={36} className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </div>
  );
}

export function DashboardWorkforce({
  canViewCompanyOps,
  activeSessions,
  employeesActiveCount,
  employeesRestrictedCount,
  businessTimeZone,
  overviewPresent = 0,
  overviewCompleted = 0,
  overviewActive = 0,
}: DashboardWorkforceProps) {
  if (!canViewCompanyOps) {
    const checkedIn = overviewActive > 0;
    const present = overviewPresent > 0;
    return (
      <Card padding={false}>
        <CardHeader title={translate("dashboard.yourDay")} />
        <CardBody>
          <p className="text-sm" style={{ color: "var(--ds-color-text-secondary)" }}>
            {checkedIn
              ? translate("attendance.youreClockedIn")
              : present
                ? translate("attendance.presentNoActive")
                : overviewCompleted > 0
                  ? translate("attendance.completedSessionToday")
                  : translate("attendance.noAttendanceToday")}
          </p>
          <Link
            href="/attendance"
            className="mt-3 inline-block text-sm font-medium"
            style={{ color: "var(--ds-color-primary)" }}
          >
            {translate("attendance.viewMyAttendance")}
          </Link>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card padding={false}>
        <CardHeader title={translate("dashboard.currentlyWorking")} />
        <CardBody>
          {employeesActiveCount !== null && employeesRestrictedCount !== null ? (
            <p className="mb-4 text-sm" style={{ color: "var(--ds-color-text-muted)" }}>
              <span className="font-semibold" style={{ color: "var(--ds-color-text-primary)" }}>
                {employeesActiveCount}
              </span>{" "}
              {translate("dashboard.activeAccounts")}
              {" · "}
              <span className="font-semibold" style={{ color: "var(--ds-color-text-primary)" }}>
                {employeesRestrictedCount}
              </span>{" "}
              {translate("dashboard.inactiveOrSuspended")}
            </p>
          ) : null}

          {activeSessions.length === 0 ? (
            <EmptyState
              title={translate("dashboard.noOneClockedIn")}
              description={translate("dashboard.noEmployeesWorking")}
              icon={<Users className="h-5 w-5" />}
            />
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto pr-1" role="list">
              {activeSessions.slice(0, 12).map((s) => {
                const name = s.displayName ?? `${s.user_id.slice(0, 8)}…`;
                return (
                  <li
                    key={`${s.user_id}-${s.check_in ?? ""}`}
                    className="flex items-center gap-3 rounded-xl border px-3 py-2.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    style={{ borderColor: "var(--ds-color-border)", background: "var(--ds-color-surface)" }}
                  >
                    <Avatar name={name} photoUrl={s.photoUrl} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" style={{ color: "var(--ds-color-text-primary)" }}>
                        {name}
                      </p>
                      <p className="text-xs tabular-nums" style={{ color: "var(--ds-color-text-muted)" }}>
                        {translate("dashboard.clockedInAt", {
                          values: { time: formatBusinessDateTime(s.check_in, businessTimeZone) },
                        })}
                      </p>
                    </div>
                    <SessionTypeBadge
                      attendanceMode={s.attendance_mode}
                      remoteApprovalStatus={s.remote_approval_status}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
        <CardFooter>
          <Link href="/employees" className="text-sm font-medium" style={{ color: "var(--ds-color-primary)" }}>
            {translate("dashboard.viewEmployees")}
          </Link>
        </CardFooter>
      </Card>

      <Card padding={false}>
        <CardHeader title={translate("dashboard.todaysAttendanceSummary")} />
        <CardBody>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="ds-label">{translate("attendance.present")}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">{overviewPresent}</dd>
            </div>
            <div>
              <dt className="ds-label">{translate("attendance.completed")}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">{overviewCompleted}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm" style={{ color: "var(--ds-color-text-muted)" }}>
            {translate("dashboard.liveWorkforceHint")}
          </p>
        </CardBody>
        <CardFooter>
          <Link href="/attendance" className="text-sm font-medium" style={{ color: "var(--ds-color-primary)" }}>
            {translate("dashboard.attendanceOverviewLink")}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
