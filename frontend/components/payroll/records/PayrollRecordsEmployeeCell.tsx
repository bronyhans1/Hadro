"use client";

import type { EmployeePayrollRollup } from "@/lib/payroll/payrollDashboardAggregates";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

interface PayrollRecordsEmployeeCellProps {
  row: EmployeePayrollRollup;
}

export function PayrollRecordsEmployeeCell({ row }: PayrollRecordsEmployeeCellProps) {
  const initials = initialsFromName(row.employeeName);

  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
        style={{ background: "var(--ds-color-primary-muted)", color: "var(--ds-color-primary)" }}
        aria-hidden
      >
        {initials}
      </div>
      <div className="min-w-0">
        <span className="block font-medium text-theme">{row.employeeName}</span>
        {row.employeeEmail && row.employeeName !== row.employeeEmail ? (
          <span className="mt-0.5 block truncate text-xs text-theme-muted">{row.employeeEmail}</span>
        ) : null}
      </div>
    </div>
  );
}
