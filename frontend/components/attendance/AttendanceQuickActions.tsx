"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { hasRole } from "@/lib/auth/roles";
import { getAttendanceQuickActions } from "@/lib/attendance/attendanceQuickActions";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/design-system/cn";
import { translate } from "@/lib/i18n";

export function AttendanceQuickActions() {
  const { user } = useAuth();
  const canRecordManualAttendance = hasRole(user?.roles, ["admin", "manager", "HR"]);

  const actions = useMemo(
    () => getAttendanceQuickActions({ roles: user?.roles, canRecordManualAttendance }),
    [user?.roles, canRecordManualAttendance]
  );

  if (actions.length === 0) return null;

  return (
    <Card padding={false}>
      <CardHeader title={translate("attendance.quickActions")} />
      <CardBody>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => (
            <Link
              key={`${action.href}-${action.label}`}
              href={action.href}
              className={cn(
                "flex flex-col gap-1 rounded-lg border px-4 py-3 text-left transition-colors",
                "hover:bg-[var(--ds-color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
              )}
              style={{ borderColor: "var(--ds-color-border)", color: "var(--ds-color-text-primary)" }}
            >
              <span className="text-sm font-semibold">{action.label}</span>
              <span className="text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
                {action.description}
              </span>
            </Link>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
