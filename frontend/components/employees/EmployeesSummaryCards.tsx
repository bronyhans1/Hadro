"use client";

import { Building2, MapPin, ShieldBan, UserCheck, UserX, Users } from "lucide-react";
import type { EmployeeSummaryStats } from "@/lib/employees/employeeUtils";
import { formatAccountStatusLabel } from "@/lib/format/displayLabels";
import { translate } from "@/lib/i18n";
import { StatCard } from "@/components/ui/StatCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { MotionStagger } from "@/components/ui/Motion";

interface EmployeesSummaryCardsProps {
  stats: EmployeeSummaryStats;
  loading?: boolean;
}

export function EmployeesSummaryCards({ stats, loading }: EmployeesSummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" aria-busy aria-label={translate("employees.loadingSummary")}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border p-4"
            style={{ borderColor: "var(--ds-color-border)", background: "var(--ds-color-surface)" }}
          >
            <Skeleton className="mb-2 h-3 w-20" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <MotionStagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard title={translate("employees.totalEmployees")} value={stats.total} subtitle={translate("employees.inYourScope")} icon={<Users />} tone="working" />
      <StatCard title={formatAccountStatusLabel("active")} value={stats.active} subtitle={translate("employees.canSignIn")} icon={<UserCheck />} tone="success" />
      <StatCard title={formatAccountStatusLabel("inactive")} value={stats.inactive} subtitle={translate("employees.deactivatedAccounts")} icon={<UserX />} tone="danger" />
      <StatCard title={formatAccountStatusLabel("suspended")} value={stats.suspended} subtitle={translate("employees.accessBlocked")} icon={<ShieldBan />} tone="warning" />
      <StatCard title={translate("navigation.departments")} value={stats.departmentCount} subtitle={translate("employees.organizedUnits")} icon={<Building2 />} tone="completed" />
      <StatCard title={translate("navigation.branches")} value={stats.branchCount} subtitle={translate("employees.companyLocations")} icon={<MapPin />} tone="remote" />
    </MotionStagger>
  );
}
