"use client";

import Link from "next/link";
import { cn } from "@/lib/design-system/cn";
import { translate } from "@/lib/i18n";

const REPORTS = [
  {
    id: "attendance",
    href: "/reports/attendance",
    labelKey: "reports.attendanceReport",
    descriptionKey: "reports.attendanceReportDescription",
  },
  {
    id: "leave",
    href: "/reports/leave",
    labelKey: "reports.leaveReport",
    descriptionKey: "reports.leaveReportDescription",
  },
] as const;

export function ReportsOperationalCards() {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {REPORTS.map((report) => (
        <Link
          key={report.id}
          href={report.href}
          className={cn(
            "flex min-h-[4.75rem] flex-col justify-center gap-1.5 rounded-lg border px-4 py-4 text-left transition-colors",
            "hover:bg-[var(--ds-color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
          )}
          style={{ borderColor: "var(--ds-color-border)", color: "var(--ds-color-text-primary)" }}
        >
          <span className="text-sm font-semibold">{translate(report.labelKey)}</span>
          <span className="text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
            {translate(report.descriptionKey)}
          </span>
        </Link>
      ))}
    </div>
  );
}
