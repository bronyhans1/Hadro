"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  CalendarClock,
  ChevronRight,
  Clock3,
  FileSpreadsheet,
  UserPlus2,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getDashboardQuickActions } from "@/lib/dashboard/quickActions";
import { cn } from "@/lib/design-system/cn";
import { STATUS_TONE_STYLES, type StatusTone } from "@/lib/design-system/statusTones";

const ACTION_STYLES: Record<
  string,
  {
    icon: ReactNode;
    tone: StatusTone;
  }
> = {
  "/employees": {
    icon: <UserPlus2 className="h-5 w-5" />,
    tone: "primary",
  },
  "/attendance": {
    icon: <Clock3 className="h-5 w-5" />,
    tone: "success",
  },
  "/payroll": {
    icon: <Wallet className="h-5 w-5" />,
    tone: "orange",
  },
  "/payroll/manual-overtime": {
    icon: <CalendarClock className="h-5 w-5" />,
    tone: "violet",
  },
  "/reports": {
    icon: <FileSpreadsheet className="h-5 w-5" />,
    tone: "info",
  },
  "/leave": {
    icon: <CalendarClock className="h-5 w-5" />,
    tone: "danger",
  },
};

export function DashboardQuickActions() {
  const { user } = useAuth();
  const payrollEnabled = user?.payrollEnabled !== false;

  const actions = useMemo(
    () => getDashboardQuickActions({ roles: user?.roles, payrollEnabled }),
    [user?.roles, payrollEnabled]
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {actions.map((action) => {
        const style = ACTION_STYLES[action.href] ?? ACTION_STYLES["/reports"];
        const tone = STATUS_TONE_STYLES[style.tone];
        return (
          <Link
            key={action.href}
            href={action.href}
            className={cn(
              "group flex items-center gap-4 rounded-xl border p-4 shadow-sm transition duration-200",
              "hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
            )}
            style={{
              borderColor: "var(--ds-color-border)",
              background:
                "linear-gradient(180deg, var(--ds-color-surface), var(--ds-color-surface-muted))",
              color: "var(--ds-color-text-primary)",
            }}
          >
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-transform duration-200 group-hover:scale-105"
              style={{
                borderColor: tone.borderColor,
                background: tone.background,
              }}
              aria-hidden
            >
              <span style={{ color: tone.color }}>{style.icon}</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{action.label}</span>
              <span className="mt-1 block ds-caption">
                {action.description}
              </span>
            </span>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-[var(--ds-color-text-muted)] transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        );
      })}
    </div>
  );
}
