"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  FileWarning,
  ShieldCheck,
  Wallet,
  Wifi,
} from "lucide-react";
import type { PayrollHealthResponse } from "@/lib/api/payroll.api";
import type { FlagsSummary } from "@/lib/api/attendance.api";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { presentPayrollReadiness, translate } from "@/lib/i18n";
import { cn } from "@/lib/design-system/cn";
import { STATUS_TONE_STYLES, type StatusTone } from "@/lib/design-system/statusTones";

interface HealthItem {
  id: string;
  label: string;
  value: string;
  href: string;
  attention: boolean;
  badge?: string;
  icon: ReactNode;
  tone: StatusTone;
}

interface DashboardOperationalHealthProps {
  canViewCompanyOps: boolean;
  payrollEnabled: boolean;
  /** Admin/HR company payroll health card */
  showPayrollHealth?: boolean;
  /** Admin/HR/manager draft OT queue */
  showManualOt?: boolean;
  pendingLeaveCount: number;
  pendingRemoteCount: number;
  draftManualOtCount: number;
  flagsSummary: FlagsSummary | null;
  repeatedLateCount: number;
  repeatedAbsenceCount: number;
  payrollHealth: PayrollHealthResponse | null;
  payrollGross?: number;
  currencyCode?: "GHS" | "USD";
  employeeLeavePending?: number;
}

function HealthRow({ item }: { item: HealthItem }) {
  const tone = STATUS_TONE_STYLES[item.tone];
  const wrapStyle: CSSProperties = {
    borderColor: tone.borderColor,
    background: tone.background,
  };

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-4 rounded-xl border px-4 py-3.5 shadow-sm transition duration-200",
        "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
      )}
      style={{
        borderColor: item.attention ? "var(--ds-color-warning-border)" : "var(--ds-color-border)",
        background: item.attention ? "var(--ds-color-warning-subtle)" : "var(--ds-color-surface)",
      }}
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-transform duration-200 group-hover:scale-105"
        style={wrapStyle}
        aria-hidden
      >
        <span style={{ color: tone.color }}>{item.icon}</span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium" style={{ color: "var(--ds-color-text-primary)" }}>
          {item.label}
        </p>
        <p className="ds-caption">
          {item.value}
        </p>
      </div>
      {item.badge ? (
        <Badge variant={item.attention ? "warning" : "neutral"}>{item.badge}</Badge>
      ) : null}
      <ArrowRight
        className="ml-auto h-4 w-4 shrink-0 text-[var(--ds-color-text-muted)] transition-transform duration-200 group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}

export function DashboardOperationalHealth({
  canViewCompanyOps,
  payrollEnabled,
  showPayrollHealth = false,
  showManualOt = false,
  pendingLeaveCount,
  pendingRemoteCount,
  draftManualOtCount,
  flagsSummary,
  repeatedLateCount,
  repeatedAbsenceCount,
  payrollHealth,
  payrollGross,
  currencyCode = "GHS",
  employeeLeavePending = 0,
}: DashboardOperationalHealthProps) {
  const items: HealthItem[] = [];

  if (canViewCompanyOps) {
    if (showPayrollHealth && payrollEnabled && payrollHealth) {
      const needsAttention = payrollHealth.readiness.status !== "ready";
      const readinessText = presentPayrollReadiness(payrollHealth.readiness.status);
      items.push({
        id: "payroll-health",
        label: translate("payroll.payrollHealth"),
        value: readinessText,
        href: "/payroll",
        attention: needsAttention,
        badge: readinessText,
        icon: <Wallet className="h-5 w-5" />,
        tone: needsAttention ? "warning" : "success",
      });
    } else if (showPayrollHealth && payrollEnabled && payrollGross !== undefined) {
      items.push({
        id: "payroll-snapshot",
        label: translate("payroll.payrollSnapshot"),
        value: translate("dashboard.grossPayAmount", { values: { amount: formatCurrency(payrollGross, currencyCode) } }),
        href: "/payroll",
        attention: false,
        icon: <Wallet className="h-5 w-5" />,
        tone: "orange",
      });
    }

    items.push({
      id: "leave-pending",
      label: translate("dashboard.pendingLeaveReviews"),
      value: pendingLeaveCount === 0 ? translate("leave.noRequestsAwaitingReview") : translate("dashboard.requestsNeedActionParen", { values: { count: pendingLeaveCount } }),
      href: "/leave",
      attention: pendingLeaveCount > 0,
      badge: pendingLeaveCount > 0 ? String(pendingLeaveCount) : undefined,
      icon: <CalendarClock className="h-5 w-5" />,
      tone: pendingLeaveCount > 0 ? "danger" : "neutral",
    });

    items.push({
      id: "remote-pending",
      label: translate("attendance.pendingRemoteReviews"),
      value: pendingRemoteCount === 0 ? translate("attendance.noRemoteAwaitingShort") : translate("attendance.sessionsPending", { values: { count: pendingRemoteCount } }),
      href: "/attendance/remote-review",
      attention: pendingRemoteCount > 0,
      badge: pendingRemoteCount > 0 ? String(pendingRemoteCount) : undefined,
      icon: <Wifi className="h-5 w-5" />,
      tone: pendingRemoteCount > 0 ? "info" : "neutral",
    });

    const flagged = flagsSummary?.summary.highRiskEmployees ?? 0;
    items.push({
      id: "attendance-flags",
      label: translate("navigation.attendanceFlags"),
      value: flagged === 0 ? translate("attendance.noHighRiskMonthShort") : translate("attendance.highRiskEmployees", { values: { count: flagged } }),
      href: "/attendance/flags",
      attention: flagged > 0,
      badge: flagged > 0 ? String(flagged) : undefined,
      icon: <ShieldCheck className="h-5 w-5" />,
      tone: flagged > 0 ? "warning" : "success",
    });

    if (repeatedLateCount > 0) {
      items.push({
        id: "repeated-late",
        label: translate("attendance.repeatedLateness"),
        value: translate("attendance.repeatedLatenessCount", { values: { count: repeatedLateCount } }),
        href: "/attendance/lateness",
        attention: true,
        badge: String(repeatedLateCount),
        icon: <AlertTriangle className="h-5 w-5" />,
        tone: "warning",
      });
    }

    if (repeatedAbsenceCount > 0) {
      items.push({
        id: "repeated-absence",
        label: translate("attendance.repeatedAbsence"),
        value: translate("attendance.repeatedAbsenceCount", { values: { count: repeatedAbsenceCount } }),
        href: "/attendance/absence",
        attention: true,
        badge: String(repeatedAbsenceCount),
        icon: <FileWarning className="h-5 w-5" />,
        tone: "danger",
      });
    }

    if (showManualOt) {
      items.push({
        id: "manual-ot",
        label: translate("dashboard.manualOtAwaiting"),
        value: draftManualOtCount === 0 ? translate("dashboard.noDraftManualOt") : translate("dashboard.draftEntry", { count: draftManualOtCount }),
        href: "/payroll/manual-overtime",
        attention: draftManualOtCount > 0,
        badge: draftManualOtCount > 0 ? String(draftManualOtCount) : undefined,
        icon: <CalendarClock className="h-5 w-5" />,
        tone: draftManualOtCount > 0 ? "violet" : "neutral",
      });
    }
  } else {
    items.push({
      id: "my-leave",
      label: translate("dashboard.myLeaveRequests"),
      value: employeeLeavePending === 0 ? translate("dashboard.noPendingLeaveRequests") : translate("dashboard.pendingRequestsParen", { values: { count: employeeLeavePending } }),
      href: "/leave",
      attention: employeeLeavePending > 0,
      badge: employeeLeavePending > 0 ? String(employeeLeavePending) : undefined,
      icon: <CalendarClock className="h-5 w-5" />,
      tone: employeeLeavePending > 0 ? "danger" : "neutral",
    });

    if (payrollEnabled && payrollGross !== undefined) {
      items.push({
        id: "my-payroll",
        label: translate("payroll.payrollSnapshot"),
        value: translate("dashboard.grossEarningsAmount", { values: { amount: formatCurrency(payrollGross, currencyCode) } }),
        href: "/payroll",
        attention: false,
        icon: <Wallet className="h-5 w-5" />,
        tone: "orange",
      });
    }
  }

  return items.length === 0 ? (
    <EmptyState
      title={translate("dashboard.noOperationalSignals")}
      description={translate("dashboard.healthWillAppear")}
      icon={<ShieldCheck className="h-5 w-5" />}
    />
  ) : (
    <div className="space-y-3" role="list">
      {items.map((item) => (
        <HealthRow key={item.id} item={item} />
      ))}
    </div>
  );
}
