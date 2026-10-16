import * as repo from "./payroll.repository";
import { supabaseAdmin } from "../../config/supabase";
import { isSalaryDailyPayrollRecord, PAYROLL_RECORD_TYPE_SESSION_HOURLY } from "../../lib/payrollSemantics";
import { refreshUserPayrollForDashboardMonth } from "./payrollRefresh.service";
import {
  buildShadowOvertimeForRecord,
  sumShadowOvertimeTotals,
  type ShadowOvertimeTotals,
} from "../../lib/overtime/shadowOvertimeReporting";

export interface PayrollReportResult {
  records: repo.PayrollRecord[];
  total_hours: number;
  total_overtime_minutes: number;
  /** Sum of gross_earnings (payable / after late deduction). */
  total_gross_pay: number;
  /** Sum of base before late deduction (transparency; equals net where no split stored). */
  total_base_before_late: number;
  total_late_deduction: number;
  /** Reporting-only duration vs shift OT comparison (Phase 1). */
  shadow_overtime: ShadowOvertimeTotals;
}

export async function getUserPayroll(
  userId: string,
  companyId: string
): Promise<PayrollReportResult> {
  await refreshUserPayrollForDashboardMonth(userId, companyId);
  const records = await repo.getPayrollByUser(userId, companyId);
  const enriched = await enrichPayrollShadowOvertime(records);
  return computeTotals(enriched);
}

export async function getCompanyPayroll(
  companyId: string
): Promise<PayrollReportResult> {
  const records = await repo.getPayrollByCompany(companyId);
  const withEmployees = await enrichPayrollEmployees(records);
  const enriched = await enrichPayrollShadowOvertime(withEmployees);
  return computeTotals(enriched);
}

export async function getMonthlyPayroll(
  companyId: string,
  year: number,
  month: number
): Promise<PayrollReportResult> {
  const records = await repo.getPayrollByMonth(companyId, year, month);
  const withEmployees = await enrichPayrollEmployees(records);
  const enriched = await enrichPayrollShadowOvertime(withEmployees);
  return computeTotals(enriched);
}

function computeTotals(
  records: repo.PayrollRecord[]
): PayrollReportResult {
  let totalHours = 0;
  let totalOvertimeMinutes = 0;
  let totalGrossPay = 0;
  let totalBaseBeforeLate = 0;
  let totalLateDeduction = 0;

  for (const r of records) {
    if (isSalaryDailyPayrollRecord(r.record_type)) {
      if (typeof r.gross_earnings === "number") totalGrossPay += r.gross_earnings;
      const br = repo.payrollRecordEarningsBreakdown(r);
      totalBaseBeforeLate += br.baseBeforeLate;
      totalLateDeduction += br.lateDeduction;
      continue;
    }
    if (typeof r.hours_worked === "number") totalHours += r.hours_worked;
    if (typeof r.overtime_minutes === "number")
      totalOvertimeMinutes += r.overtime_minutes;
    if (typeof r.gross_earnings === "number") totalGrossPay += r.gross_earnings;
    const br = repo.payrollRecordEarningsBreakdown(r);
    totalBaseBeforeLate += br.baseBeforeLate;
    totalLateDeduction += br.lateDeduction;
  }

  return {
    records,
    total_hours: Math.round(totalHours * 100) / 100,
    total_overtime_minutes: totalOvertimeMinutes,
    total_gross_pay: Math.round(totalGrossPay * 100) / 100,
    total_base_before_late: Math.round(totalBaseBeforeLate * 100) / 100,
    total_late_deduction: Math.round(totalLateDeduction * 100) / 100,
    shadow_overtime: sumShadowOvertimeTotals(records),
  };
}

async function enrichPayrollShadowOvertime(
  records: repo.PayrollRecord[]
): Promise<repo.PayrollRecord[]> {
  if (records.length === 0) return records;

  const sessionIds = Array.from(
    new Set(
      records
        .filter(
          (r) =>
            (r.record_type ?? PAYROLL_RECORD_TYPE_SESSION_HOURLY) ===
              PAYROLL_RECORD_TYPE_SESSION_HOURLY && r.session_id
        )
        .map((r) => r.session_id as string)
    )
  );

  const shiftOvertimeBySessionId = new Map<string, number | null>();

  if (sessionIds.length > 0) {
    try {
      const { data, error } = await supabaseAdmin
        .from("work_sessions")
        .select("id, shift_overtime_minutes")
        .in("id", sessionIds);

      if (error) {
        console.error("enrichPayrollShadowOvertime sessions lookup error", error);
      } else {
        for (const row of data ?? []) {
          const id = (row as { id?: string }).id;
          if (!id) continue;
          const shiftOt = (row as { shift_overtime_minutes?: number | null })
            .shift_overtime_minutes;
          shiftOvertimeBySessionId.set(
            id,
            typeof shiftOt === "number" ? shiftOt : null
          );
        }
      }
    } catch (err) {
      console.error("enrichPayrollShadowOvertime exception", err);
    }
  }

  return records.map((r) => ({
    ...r,
    shadow_overtime: buildShadowOvertimeForRecord(r, shiftOvertimeBySessionId),
  }));
}

async function enrichPayrollEmployees(
  records: repo.PayrollRecord[]
): Promise<repo.PayrollRecord[]> {
  if (records.length === 0) return records;

  const userIds = Array.from(
    new Set(
      records
        .map((r) => r.user_id)
        .filter((id) => typeof id === "string" && id.length > 0)
    )
  );

  if (userIds.length === 0) {
    return records.map((r) => ({ ...r, employee_name: null, employee_email: null }));
  }

  try {
    const { data: users, error } = await supabaseAdmin
      .from("users")
      .select("id, first_name, last_name, email")
      .in("id", userIds);

    if (error) {
      console.error("enrichPayrollEmployees users lookup error", error);
      return records.map((r) => ({ ...r, employee_name: null, employee_email: null }));
    }

    const userById = new Map<
      string,
      { name: string; email: string | null }
    >(
      (users ?? []).map((u: { id: string; first_name?: string; last_name?: string; email?: string }) => [
        u.id,
        {
          name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(),
          email: u.email ?? null,
        },
      ])
    );

    return records.map((r) => {
      const resolved = userById.get(r.user_id);
      return {
        ...r,
        employee_name: resolved?.name ?? null,
        employee_email: resolved?.email ?? null,
      };
    });
  } catch (err) {
    console.error("enrichPayrollEmployees exception", err);
    return records.map((r) => ({ ...r, employee_name: null, employee_email: null }));
  }
}
