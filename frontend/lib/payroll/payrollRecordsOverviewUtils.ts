import type { PayrollRecord } from "@/lib/api/payroll.api";
import type { PayrollPeriod } from "@/lib/api/payrollPeriod.api";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { translate } from "@/lib/i18n";
import type { EmployeePayrollRollup, PayrollDashboardSummary } from "./payrollDashboardAggregates";
import { buildPayrollRecentActivity, type PayrollActivityItem, type PayrollStatItem } from "./payrollOverviewUtils";

export type PayrollRecordsSummaryItem = {
  id: string;
  label: string;
  value: string;
};

function countRecordsByStatus(records: PayrollRecord[]): {
  draft: number;
  approved: number;
  locked: number;
} {
  let draft = 0;
  let approved = 0;
  let locked = 0;
  for (const r of records) {
    const s = (r.status ?? "draft").toLowerCase();
    if (s === "locked") locked += 1;
    else if (s === "approved") approved += 1;
    else draft += 1;
  }
  return { draft, approved, locked };
}

export function buildPayrollRecordsSnapshot(opts: {
  records: PayrollRecord[];
  summary: PayrollDashboardSummary;
  currencyCode: "GHS" | "USD";
}): PayrollStatItem[] {
  const { records, summary, currencyCode } = opts;
  const statusCounts = countRecordsByStatus(records);

  return [
    {
      title: translate("navigation.payrollRecords"),
      value: String(records.length),
      subtitle: translate("payroll.inSelectedPeriod"),
    },
    {
      title: translate("payroll.employeesPaid"),
      value: String(summary.employeesIncluded),
      subtitle: records.length > 0 ? translate("payroll.withPayrollRows") : undefined,
    },
    {
      title: translate("payroll.draftRecords"),
      value: String(statusCounts.draft),
      subtitle: statusCounts.draft > 0 ? translate("payroll.awaitingApproval") : undefined,
    },
    {
      title: translate("payroll.approvedRecords"),
      value: String(statusCounts.approved),
      subtitle: translate("payroll.approvedInPeriod"),
    },
    {
      title: translate("payroll.lockedRecords"),
      value: String(statusCounts.locked),
      subtitle: statusCounts.locked > 0 ? translate("payroll.lockedInPeriod") : undefined,
    },
    {
      title: translate("payroll.grossPayroll"),
      value: formatCurrency(summary.grossPayroll, currencyCode),
      subtitle: translate("payroll.sumOfGross"),
    },
  ];
}

export function buildPayrollRecordsSummaryPanel(opts: {
  rollups: EmployeePayrollRollup[];
  records: PayrollRecord[];
  currencyCode: "GHS" | "USD";
}): PayrollRecordsSummaryItem[] {
  const { rollups, records, currencyCode } = opts;
  const grossValues = rollups.map((r) => r.grossPayroll);
  const total = grossValues.reduce((sum, value) => sum + value, 0);
  const average = rollups.length > 0 ? total / rollups.length : 0;
  const highest = grossValues.length > 0 ? Math.max(...grossValues) : 0;
  const lowest = grossValues.length > 0 ? Math.min(...grossValues) : 0;
  const statusCounts = countRecordsByStatus(records);

  return [
    {
      id: "total-payroll",
      label: translate("payroll.totalPayroll"),
      value: formatCurrency(total, currencyCode),
    },
    {
      id: "average-payroll",
      label: translate("payroll.averagePayroll"),
      value: rollups.length > 0 ? formatCurrency(average, currencyCode) : "—",
    },
    {
      id: "highest-payroll",
      label: translate("payroll.highestPayroll"),
      value: grossValues.length > 0 ? formatCurrency(highest, currencyCode) : "—",
    },
    {
      id: "lowest-payroll",
      label: translate("payroll.lowestPayroll"),
      value: grossValues.length > 0 ? formatCurrency(lowest, currencyCode) : "—",
    },
    {
      id: "draft-records",
      label: translate("payroll.draftRecordsSentence"),
      value: String(statusCounts.draft),
    },
    {
      id: "approved-records",
      label: translate("payroll.approvedRecordsSentence"),
      value: String(statusCounts.approved),
    },
  ];
}

export function buildPayrollRecordsRecentActivity(
  records: PayrollRecord[],
  period: PayrollPeriod | null
): PayrollActivityItem[] {
  return buildPayrollRecentActivity(records, period);
}
