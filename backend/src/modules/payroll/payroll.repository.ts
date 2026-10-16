import { supabaseAdmin } from "../../config/supabase";
import { isPayrollRecordProtected } from "./payrollRecordProtection";

export interface PayrollRecord {
  id: string;
  user_id: string;
  company_id: string;
  /** Human-friendly employee display name (resolved from users table when possible). */
  employee_name?: string | null;
  /** Human-friendly employee email (resolved from users table when possible). */
  employee_email?: string | null;
  session_id: string | null;
  regular_minutes: number;
  overtime_minutes: number;
  hours_worked: number;
  hourly_rate: number;
  /** Net gross after late deduction when applicable. */
  gross_earnings: number;
  /** Accrual before late pay deduction; null if not stored / no split. */
  gross_before_late_deduction?: number | null;
  /** Late deduction amount; null if none. */
  late_deduction_amount?: number | null;
  payroll_date: string;
  status?: string;
  created_at?: string;
  record_type?: string;
  earnings_date?: string | null;
  /** attendance | paid_leave */
  earning_source?: string | null;
  leave_request_id?: string | null;
  /** OT multiplier at row creation; null on legacy rows or fixed_rate mode. */
  overtime_multiplier_applied?: number | null;
  /** OT compensation method snapshot; null on legacy rows (multiplier fallback). */
  overtime_compensation_method_applied?: string | null;
  /** Fixed OT rate snapshot when method is fixed_rate. */
  fixed_overtime_rate_applied?: number | null;
  /** Set when record_type = manual_overtime. */
  manual_overtime_entry_id?: string | null;
  /** Reporting-only side-by-side OT comparison (Phase 1). */
  shadow_overtime?: {
    duration_ot_minutes: number | null;
    shift_ot_minutes: number | null;
  } | null;
}

/** Legacy rows: no columns → base = net, late = 0. */
export function payrollRecordEarningsBreakdown(r: PayrollRecord): {
  net: number;
  baseBeforeLate: number;
  lateDeduction: number;
} {
  const net = typeof r.gross_earnings === "number" ? r.gross_earnings : 0;
  const late =
    typeof r.late_deduction_amount === "number" && r.late_deduction_amount > 0
      ? r.late_deduction_amount
      : 0;
  const hasBase =
    typeof r.gross_before_late_deduction === "number" &&
    !Number.isNaN(r.gross_before_late_deduction);
  const baseBeforeLate = hasBase ? (r.gross_before_late_deduction as number) : net + late;
  return { net, baseBeforeLate, lateDeduction: late };
}

export interface CreatePayrollRecordData {
  user_id: string;
  company_id: string;
  session_id: string;
  regular_minutes: number;
  overtime_minutes: number;
  hours_worked: number;
  hourly_rate: number;
  gross_earnings: number;
  payroll_date: string;
  gross_before_late_deduction?: number | null;
  late_deduction_amount?: number | null;
  overtime_multiplier_applied?: number | null;
  overtime_compensation_method_applied?: string | null;
  fixed_overtime_rate_applied?: number | null;
  payroll_period_id?: string | null;
}

export async function getPayrollBySessionId(
  sessionId: string,
  companyId: string
): Promise<PayrollRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("payroll_records")
    .select("*")
    .eq("session_id", sessionId)
    .eq("company_id", companyId)
    .eq("record_type", "session_hourly")
    .maybeSingle();

  if (error) throw error;
  return data as PayrollRecord | null;
}

export async function getSalaryDailyRecord(
  userId: string,
  companyId: string,
  earningsDate: string
): Promise<PayrollRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("payroll_records")
    .select("*")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .eq("record_type", "salary_daily")
    .eq("earnings_date", earningsDate)
    .maybeSingle();

  if (error) throw error;
  return data as PayrollRecord | null;
}

export async function createPayrollRecord(
  data: CreatePayrollRecordData
): Promise<PayrollRecord> {
  const existing = await getPayrollBySessionId(data.session_id, data.company_id);
  if (existing && isPayrollRecordProtected(existing.status)) {
    return existing;
  }

  const rowPayload: Record<string, unknown> = {
    user_id: data.user_id,
    company_id: data.company_id,
    session_id: data.session_id,
    regular_minutes: data.regular_minutes,
    overtime_minutes: data.overtime_minutes,
    hours_worked: data.hours_worked,
    hourly_rate: data.hourly_rate,
    gross_earnings: data.gross_earnings,
    payroll_date: data.payroll_date,
    record_type: "session_hourly",
    earnings_date: null,
    status: "draft",
    earning_source: "attendance",
  };
  rowPayload.gross_before_late_deduction = data.gross_before_late_deduction ?? null;
  rowPayload.late_deduction_amount = data.late_deduction_amount ?? null;
  if (data.payroll_period_id !== undefined) {
    rowPayload.payroll_period_id = data.payroll_period_id;
  }
  if (data.overtime_multiplier_applied !== undefined) {
    rowPayload.overtime_multiplier_applied = data.overtime_multiplier_applied;
  }
  if (data.overtime_compensation_method_applied !== undefined) {
    rowPayload.overtime_compensation_method_applied =
      data.overtime_compensation_method_applied;
  }
  if (data.fixed_overtime_rate_applied !== undefined) {
    rowPayload.fixed_overtime_rate_applied = data.fixed_overtime_rate_applied;
  }

  const { data: row, error } = await supabaseAdmin
    .from("payroll_records")
    .upsert(rowPayload, { onConflict: "record_type,session_id" })
    .select("*")
    .single();

  if (error) throw error;
  return row as PayrollRecord;
}

export async function getPayrollById(
  payrollId: string
): Promise<PayrollRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("payroll_records")
    .select("*")
    .eq("id", payrollId)
    .maybeSingle();

  if (error) throw error;
  return data as PayrollRecord | null;
}

export async function getPayrollByIdAndCompany(
  id: string,
  companyId: string
): Promise<PayrollRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("payroll_records")
    .select("*")
    .eq("id", id)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) throw error;
  return data as PayrollRecord | null;
}

export async function approvePayrollRecord(
  id: string,
  companyId: string
): Promise<PayrollRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("payroll_records")
    .update({ status: "approved" })
    .eq("id", id)
    .eq("company_id", companyId)
    .eq("status", "draft")
    .select("*")
    .single();

  if (error) {
    if ((error as { code?: string }).code === "PGRST116") return null;
    throw error;
  }
  return data as PayrollRecord;
}

export async function lockPayrollRecord(
  id: string,
  companyId: string
): Promise<PayrollRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("payroll_records")
    .update({ status: "locked" })
    .eq("id", id)
    .eq("company_id", companyId)
    .eq("status", "approved")
    .select("*")
    .single();

  if (error) {
    if ((error as { code?: string }).code === "PGRST116") return null;
    throw error;
  }
  return data as PayrollRecord;
}

export async function getPayrollByUser(
  userId: string,
  companyId: string
): Promise<PayrollRecord[]> {
  const { data, error } = await supabaseAdmin
    .from("payroll_records")
    .select("*")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .order("payroll_date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as PayrollRecord[];
}

export async function getPayrollByCompany(
  companyId: string
): Promise<PayrollRecord[]> {
  const { data, error } = await supabaseAdmin
    .from("payroll_records")
    .select("*")
    .eq("company_id", companyId)
    .order("payroll_date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as PayrollRecord[];
}

export async function companyHasAnyPayrollRecords(companyId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("payroll_records")
    .select("id")
    .eq("company_id", companyId)
    .limit(1);
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

function getMonthRange(
  year: number,
  month: number
): { monthStart: string; monthEnd: string } {
  const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return {
    monthStart: monthStart.toISOString().slice(0, 10),
    monthEnd: monthEnd.toISOString().slice(0, 10),
  };
}

export async function getPayrollByMonth(
  companyId: string,
  year: number,
  month: number
): Promise<PayrollRecord[]> {
  const { monthStart, monthEnd } = getMonthRange(year, month);

  const { data, error } = await supabaseAdmin
    .from("payroll_records")
    .select("*")
    .eq("company_id", companyId)
    .gte("payroll_date", monthStart)
    .lte("payroll_date", monthEnd)
    .order("payroll_date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as PayrollRecord[];
}

/**
 * Payroll records for a given month (for export).
 */
export async function getPayrollExportByMonth(
  companyId: string,
  year: number,
  month: number
): Promise<PayrollRecord[]> {
  return getPayrollByMonth(companyId, year, month);
}

export async function getLeaveHourlyRecord(
  userId: string,
  companyId: string,
  earningsDate: string
): Promise<PayrollRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("payroll_records")
    .select("*")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .eq("record_type", "leave_hourly")
    .eq("earnings_date", earningsDate)
    .maybeSingle();

  if (error) throw error;
  return data as PayrollRecord | null;
}

/** Removes draft leave_hourly rows only; approved/locked rows are preserved. */
export async function deleteDraftLeaveHourlyForUserMonth(
  userId: string,
  companyId: string,
  year: number,
  month: number
): Promise<void> {
  const first = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastD = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const last = `${year}-${String(month).padStart(2, "0")}-${String(lastD).padStart(2, "0")}`;
  const { error } = await supabaseAdmin
    .from("payroll_records")
    .delete()
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .eq("record_type", "leave_hourly")
    .eq("status", "draft")
    .gte("earnings_date", first)
    .lte("earnings_date", last);
  if (error) throw error;
}

export async function insertLeaveHourlyRecord(data: {
  user_id: string;
  company_id: string;
  earnings_date: string;
  leave_request_id: string;
  regular_minutes: number;
  hours_worked: number;
  hourly_rate: number;
  gross_earnings: number;
  payroll_period_id?: string | null;
}): Promise<PayrollRecord> {
  const existing = await getLeaveHourlyRecord(
    data.user_id,
    data.company_id,
    data.earnings_date
  );
  if (existing && isPayrollRecordProtected(existing.status)) {
    return existing;
  }

  const payload: Record<string, unknown> = {
    user_id: data.user_id,
    company_id: data.company_id,
    session_id: null,
    regular_minutes: data.regular_minutes,
    overtime_minutes: 0,
    hours_worked: data.hours_worked,
    hourly_rate: data.hourly_rate,
    gross_earnings: data.gross_earnings,
    payroll_date: data.earnings_date,
    record_type: "leave_hourly",
    earnings_date: data.earnings_date,
    status: "draft",
    earning_source: "paid_leave",
    leave_request_id: data.leave_request_id,
  };
  if (data.payroll_period_id !== undefined) {
    payload.payroll_period_id = data.payroll_period_id;
  }

  const { data: row, error } = await supabaseAdmin
    .from("payroll_records")
    .upsert(payload, { onConflict: "record_type,user_id,company_id,earnings_date" })
    .select("*")
    .single();
  if (error) throw error;
  return row as PayrollRecord;
}

/** Removes draft salary_daily rows only; approved/locked rows are preserved. */
export async function deleteSalaryDailyForUserMonth(
  userId: string,
  companyId: string,
  year: number,
  month: number
): Promise<void> {
  const first = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastD = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const last = `${year}-${String(month).padStart(2, "0")}-${String(lastD).padStart(2, "0")}`;
  const { error } = await supabaseAdmin
    .from("payroll_records")
    .delete()
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .eq("record_type", "salary_daily")
    .eq("status", "draft")
    .gte("earnings_date", first)
    .lte("earnings_date", last);
  if (error) throw error;
}

/**
 * Monthly accrual row: `earnings_date` is the payable UTC calendar day; `payroll_date` matches it so month filters
 * (`getPayrollByUserMonth`) stay aligned with earnings_date.
 */
export async function insertSalaryDailyRecord(data: {
  user_id: string;
  company_id: string;
  earnings_date: string;
  gross_earnings: number;
  daily_rate: number;
  gross_before_late_deduction?: number | null;
  late_deduction_amount?: number | null;
  earning_source?: "attendance" | "paid_leave";
  leave_request_id?: string | null;
  payroll_period_id?: string | null;
}): Promise<PayrollRecord> {
  const existing = await getSalaryDailyRecord(
    data.user_id,
    data.company_id,
    data.earnings_date
  );
  if (existing && isPayrollRecordProtected(existing.status)) {
    return existing;
  }

  const payload: Record<string, unknown> = {
    user_id: data.user_id,
    company_id: data.company_id,
    session_id: null,
    regular_minutes: 0,
    overtime_minutes: 0,
    hours_worked: 0,
    hourly_rate: data.daily_rate,
    gross_earnings: data.gross_earnings,
    payroll_date: data.earnings_date,
    record_type: "salary_daily",
    earnings_date: data.earnings_date,
    status: "draft",
    earning_source: data.earning_source ?? "attendance",
    leave_request_id: data.leave_request_id ?? null,
  };
  payload.gross_before_late_deduction = data.gross_before_late_deduction ?? null;
  payload.late_deduction_amount = data.late_deduction_amount ?? null;
  if (data.payroll_period_id !== undefined) {
    payload.payroll_period_id = data.payroll_period_id;
  }

  const { data: row, error } = await supabaseAdmin
    .from("payroll_records")
    .upsert(payload, { onConflict: "record_type,user_id,company_id,earnings_date" })
    .select("*")
    .single();
  if (error) throw error;
  return row as PayrollRecord;
}

export async function getManualOvertimePayrollByEntryId(
  entryId: string,
  companyId: string
): Promise<PayrollRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("payroll_records")
    .select("*")
    .eq("manual_overtime_entry_id", entryId)
    .eq("company_id", companyId)
    .eq("record_type", "manual_overtime")
    .maybeSingle();

  if (error) throw error;
  return data as PayrollRecord | null;
}

/** Inserts a draft manual_overtime payroll row; never overwritten by attendance/leave sync. */
export async function insertManualOvertimePayrollRecord(data: {
  user_id: string;
  company_id: string;
  earnings_date: string;
  manual_overtime_entry_id: string;
  overtime_minutes: number;
  hourly_rate: number;
  gross_earnings: number;
  overtime_multiplier_applied?: number | null;
  overtime_compensation_method_applied?: string | null;
  fixed_overtime_rate_applied?: number | null;
}): Promise<PayrollRecord> {
  const existing = await getManualOvertimePayrollByEntryId(
    data.manual_overtime_entry_id,
    data.company_id
  );
  if (existing) {
    if (isPayrollRecordProtected(existing.status)) {
      return existing;
    }
    return existing;
  }

  const payload: Record<string, unknown> = {
    user_id: data.user_id,
    company_id: data.company_id,
    session_id: null,
    regular_minutes: 0,
    overtime_minutes: data.overtime_minutes,
    hours_worked: 0,
    hourly_rate: data.hourly_rate,
    gross_earnings: data.gross_earnings,
    payroll_date: data.earnings_date.slice(0, 10),
    record_type: "manual_overtime",
    earnings_date: data.earnings_date.slice(0, 10),
    status: "draft",
    earning_source: "manual_overtime",
    manual_overtime_entry_id: data.manual_overtime_entry_id,
    overtime_multiplier_applied: data.overtime_multiplier_applied ?? null,
    overtime_compensation_method_applied:
      data.overtime_compensation_method_applied ?? null,
    fixed_overtime_rate_applied: data.fixed_overtime_rate_applied ?? null,
    leave_request_id: null,
  };

  const { data: row, error } = await supabaseAdmin
    .from("payroll_records")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return row as PayrollRecord;
}

/** Cancel flow only — resync paths must never call this. */
export async function deleteDraftManualOvertimePayrollRecord(
  payrollId: string,
  companyId: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("payroll_records")
    .delete()
    .eq("id", payrollId)
    .eq("company_id", companyId)
    .eq("record_type", "manual_overtime")
    .eq("status", "draft")
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return !!(data as { id?: string } | null)?.id;
}

/** Payroll rows for user in a calendar month (all types). */
export async function getPayrollByUserMonth(
  userId: string,
  companyId: string,
  year: number,
  month: number
): Promise<PayrollRecord[]> {
  const { monthStart, monthEnd } = (function m(y: number, mo: number) {
    const ms = new Date(Date.UTC(y, mo - 1, 1, 0, 0, 0, 0));
    const me = new Date(Date.UTC(y, mo, 0, 23, 59, 59, 999));
    return {
      monthStart: ms.toISOString().slice(0, 10),
      monthEnd: me.toISOString().slice(0, 10),
    };
  })(year, month);

  const { data, error } = await supabaseAdmin
    .from("payroll_records")
    .select("*")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .gte("payroll_date", monthStart)
    .lte("payroll_date", monthEnd)
    .order("payroll_date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as PayrollRecord[];
}
