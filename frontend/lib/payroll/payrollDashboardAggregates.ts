import type { PayrollRecord } from "@/lib/api/payroll.api";
import {
  isAttendanceEarningRecord,
  isManualOvertimeEarningRecord,
  isPaidLeaveEarningRecord,
} from "@/lib/payroll/payrollRecordCategories";
import { isSalaryDailyPayrollRecord } from "@/lib/payroll/payrollSemantics";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Aligns with backend payrollRecordEarningsBreakdown. */
export function payrollRowBaseBeforeLate(r: PayrollRecord): number {
  const net = typeof r.gross_earnings === "number" ? r.gross_earnings : 0;
  const late =
    typeof r.late_deduction_amount === "number" && r.late_deduction_amount > 0
      ? r.late_deduction_amount
      : 0;
  const hasBase =
    typeof r.gross_before_late_deduction === "number" &&
    !Number.isNaN(r.gross_before_late_deduction);
  return hasBase ? (r.gross_before_late_deduction as number) : net + late;
}

/** Display-only OT pay from session_hourly rows (no engine change). */
export function sessionAutomaticOtPay(r: PayrollRecord): number {
  const rt = r.record_type ?? "session_hourly";
  if (rt !== "session_hourly") return 0;
  const rate = typeof r.hourly_rate === "number" ? r.hourly_rate : 0;
  const regularMin = typeof r.regular_minutes === "number" ? r.regular_minutes : 0;
  const base = payrollRowBaseBeforeLate(r);
  const regularPay = (regularMin / 60) * rate;
  return round2(Math.max(0, base - regularPay));
}

export type PayrollDashboardSummary = {
  grossPayroll: number;
  attendanceEarnings: number;
  paidLeave: number;
  automaticOt: number;
  manualOt: number;
  lateDeductions: number;
  employeesIncluded: number;
};

export function computePayrollDashboardSummary(
  records: PayrollRecord[]
): PayrollDashboardSummary {
  let grossPayroll = 0;
  let attendanceEarnings = 0;
  let paidLeave = 0;
  let automaticOt = 0;
  let manualOt = 0;
  let lateDeductions = 0;
  const userIds = new Set<string>();

  for (const r of records) {
    const gross = typeof r.gross_earnings === "number" ? r.gross_earnings : 0;
    grossPayroll += gross;
    if (r.user_id) userIds.add(r.user_id);

    const late =
      typeof r.late_deduction_amount === "number" && r.late_deduction_amount > 0
        ? r.late_deduction_amount
        : 0;
    lateDeductions += late;

    if (isManualOvertimeEarningRecord(r)) {
      manualOt += gross;
    } else if (isPaidLeaveEarningRecord(r)) {
      paidLeave += gross;
    } else if (isAttendanceEarningRecord(r)) {
      attendanceEarnings += gross;
      automaticOt += sessionAutomaticOtPay(r);
    }
  }

  return {
    grossPayroll: round2(grossPayroll),
    attendanceEarnings: round2(attendanceEarnings),
    paidLeave: round2(paidLeave),
    automaticOt: round2(automaticOt),
    manualOt: round2(manualOt),
    lateDeductions: round2(lateDeductions),
    employeesIncluded: userIds.size,
  };
}

export type EmployeeRateType = "Hourly" | "Monthly" | "Mixed";

export function inferEmployeeRateType(records: PayrollRecord[]): EmployeeRateType {
  const hasSalary = records.some((r) => isSalaryDailyPayrollRecord(r.record_type));
  const hasHourlyLike = records.some(
    (r) =>
      r.record_type === "session_hourly" ||
      r.record_type === "leave_hourly" ||
      r.record_type === "manual_overtime"
  );
  if (hasSalary && hasHourlyLike) return "Mixed";
  if (hasSalary) return "Monthly";
  return "Hourly";
}

export type EmployeePayrollRollup = {
  userId: string;
  employeeName: string;
  employeeEmail: string | null;
  rateType: EmployeeRateType;
  attendanceEarnings: number;
  paidLeave: number;
  manualOt: number;
  grossPayroll: number;
  statusSummary: string;
  draftCount: number;
  approvedCount: number;
  lockedCount: number;
  records: PayrollRecord[];
};

function statusCounts(records: PayrollRecord[]): {
  draft: number;
  approved: number;
  locked: number;
  summary: string;
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
  const parts: string[] = [];
  if (draft) parts.push(`${draft} draft`);
  if (approved) parts.push(`${approved} approved`);
  if (locked) parts.push(`${locked} locked`);
  return {
    draft,
    approved,
    locked,
    summary: parts.length ? parts.join(" · ") : "—",
  };
}

export function computeEmployeeRollups(records: PayrollRecord[]): EmployeePayrollRollup[] {
  const byUser = new Map<string, PayrollRecord[]>();
  for (const r of records) {
    const uid = r.user_id;
    if (!uid) continue;
    const list = byUser.get(uid) ?? [];
    list.push(r);
    byUser.set(uid, list);
  }

  const rollups: EmployeePayrollRollup[] = [];
  for (const [userId, userRecords] of Array.from(byUser.entries())) {
    let attendanceEarnings = 0;
    let paidLeave = 0;
    let manualOt = 0;
    let grossPayroll = 0;

    for (const r of userRecords) {
      const gross = typeof r.gross_earnings === "number" ? r.gross_earnings : 0;
      grossPayroll += gross;
      if (isManualOvertimeEarningRecord(r)) manualOt += gross;
      else if (isPaidLeaveEarningRecord(r)) paidLeave += gross;
      else if (isAttendanceEarningRecord(r)) attendanceEarnings += gross;
    }

    const first = userRecords[0];
    const statuses = statusCounts(userRecords);

    rollups.push({
      userId,
      employeeName: first.employee_name?.trim() || first.employee_email || userId.slice(0, 8) + "…",
      employeeEmail: first.employee_email ?? null,
      rateType: inferEmployeeRateType(userRecords),
      attendanceEarnings: round2(attendanceEarnings),
      paidLeave: round2(paidLeave),
      manualOt: round2(manualOt),
      grossPayroll: round2(grossPayroll),
      statusSummary: statuses.summary,
      draftCount: statuses.draft,
      approvedCount: statuses.approved,
      lockedCount: statuses.locked,
      records: userRecords,
    });
  }

  rollups.sort((a, b) => b.grossPayroll - a.grossPayroll || a.employeeName.localeCompare(b.employeeName));
  return rollups;
}

import { translate } from "@/lib/i18n";

const MONTH_KEYS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

export function formatPayrollPeriodLabel(year: number, month: number): string {
  const key = MONTH_KEYS[month - 1];
  const name = key ? translate(`payroll.months.${key}`) : String(month);
  return translate("payroll.monthYear", { values: { month: name, year } });
}

export function employeeRateTypeLabel(rateType: EmployeeRateType): string {
  if (rateType === "Monthly") return translate("payroll.monthly");
  if (rateType === "Mixed") return translate("payroll.mixed");
  return translate("payroll.hourly");
}

/** Client-side filter when API returns broader data (e.g. /me). */
export function recordInPayrollMonth(
  r: PayrollRecord,
  year: number,
  month: number
): boolean {
  const raw = r.payroll_date ?? r.earnings_date ?? "";
  if (!raw || raw.length < 7) return false;
  const y = Number(raw.slice(0, 4));
  const m = Number(raw.slice(5, 7));
  return y === year && m === month;
}

export function filterRecordsForMonth(
  records: PayrollRecord[],
  year: number,
  month: number
): PayrollRecord[] {
  return records.filter((r) => recordInPayrollMonth(r, year, month));
}
