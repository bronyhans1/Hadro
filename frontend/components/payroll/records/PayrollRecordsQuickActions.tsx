"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getPayrollRecordsQuickActions } from "@/lib/payroll/payrollRecordsQuickActions";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { translate } from "@/lib/i18n";
import { cn } from "@/lib/design-system/cn";

export function PayrollRecordsQuickActions() {
  const { user } = useAuth();

  const actions = useMemo(
    () =>
      getPayrollRecordsQuickActions({
        roles: user?.roles,
        payrollEnabled: user?.payrollEnabled !== false,
      }),
    [user?.roles, user?.payrollEnabled]
  );

  if (actions.length === 0) return null;

  return (
    <Card padding={false}>
      <CardHeader title={translate("attendance.quickActions")} />
      <CardBody>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              className={cn(
                "flex min-h-[4.75rem] flex-col justify-center gap-1.5 rounded-lg border px-4 py-4 text-left transition-colors",
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
