import { supabaseAdmin } from "../../config/supabase";
import { DEFAULT_BUSINESS_TIMEZONE } from "../../lib/businessCalendar";
import {
  DEFAULT_OVERTIME_POLICY_MODE,
  type OvertimePolicyMode,
} from "../../constants/overtimePolicyMode";

export interface CompanyPolicyRecord {
  id: string;
  company_id: string;
  default_daily_hours: number;
  overtime_multiplier: number;
  /** Phase 1: configuration only; payroll still uses duration until Phase 2. */
  overtime_policy_mode?: OvertimePolicyMode;
  /** Manual OT overlap with attendance OT: warn | block | allow. */
  manual_ot_stacking_mode?: string;
  /** OT pay method: multiplier (default) or fixed_rate. */
  overtime_compensation_method?: string;
  /** Company fixed OT hourly rate when method is fixed_rate. */
  fixed_overtime_hourly_rate?: number | null;
  /** When false, clock-in stores late_minutes as 0 (no lateness analytics). */
  lateness_tracking_enabled: boolean;
  /** When true and payroll is on, reduce gross by time value of late_minutes. */
  late_pay_deduction_enabled: boolean;
  /**
   * First attendance date (YYYY-MM-DD) from which late pay deductions may apply.
   * NULL ⇒ deductions must not apply even if enabled.
   */
  late_pay_deduction_effective_from?: string | null;
  /** When false, payroll/earnings/wage APIs are disabled; attendance continues. */
  payroll_enabled: boolean;
  /** IANA timezone for company calendar "today" in earnings (default UTC). */
  business_timezone: string;
  /** When true, company may define cross-midnight shifts (see shifts.spans_midnight). Sprint 1: default false. */
  overnight_shifts_enabled?: boolean;
  /** When true, employees may remote clock-in/out (approval-gated payroll). */
  remote_attendance_enabled?: boolean;
  attendance_day_classification_enabled: boolean;
  /** Completed minutes below this do not count for monthly salary. */
  minimum_minutes_for_counted_day: number;
  /** Completed minutes >= this count as full day (1.0); from min up to (not including) this = half day when classification on. */
  full_day_minutes_threshold: number;
  /** Payroll display currency (company-wide). */
  currency_code: string;
  /** JSON array of weekday numbers 1=Mon … 7=Sun */
  working_weekdays: unknown;
  created_at: string;
  updated_at: string;
}

export interface CreatePolicyData {
  company_id: string;
  default_daily_hours?: number;
  overtime_multiplier?: number;
  lateness_tracking_enabled?: boolean;
  late_pay_deduction_enabled?: boolean;
  late_pay_deduction_effective_from?: string | null;
  payroll_enabled?: boolean;
  business_timezone?: string;
  attendance_day_classification_enabled?: boolean;
  minimum_minutes_for_counted_day?: number;
  full_day_minutes_threshold?: number;
  currency_code?: string;
  working_weekdays?: unknown;
  overnight_shifts_enabled?: boolean;
  remote_attendance_enabled?: boolean;
}

export interface UpdatePolicyData {
  default_daily_hours?: number;
  overtime_multiplier?: number;
  lateness_tracking_enabled?: boolean;
  late_pay_deduction_enabled?: boolean;
  late_pay_deduction_effective_from?: string | null;
  payroll_enabled?: boolean;
  business_timezone?: string;
  overnight_shifts_enabled?: boolean;
  remote_attendance_enabled?: boolean;
  attendance_day_classification_enabled?: boolean;
  minimum_minutes_for_counted_day?: number;
  full_day_minutes_threshold?: number;
  currency_code?: string;
  working_weekdays?: unknown;
  overtime_policy_mode?: string;
  overtime_compensation_method?: string;
  fixed_overtime_hourly_rate?: number | null;
}

export async function getPolicyByCompany(
  companyId: string
): Promise<CompanyPolicyRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("company_policies")
    .select("*")
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) throw error;
  return data as CompanyPolicyRecord | null;
}

export async function createPolicy(
  companyId: string,
  data: Partial<CreatePolicyData>
): Promise<CompanyPolicyRecord> {
  const payload = {
    company_id: companyId,
    default_daily_hours: data.default_daily_hours ?? 8,
    overtime_multiplier: data.overtime_multiplier ?? 1.5,
    overtime_policy_mode: DEFAULT_OVERTIME_POLICY_MODE,
    lateness_tracking_enabled: data.lateness_tracking_enabled ?? true,
    late_pay_deduction_enabled: data.late_pay_deduction_enabled ?? false,
    late_pay_deduction_effective_from: data.late_pay_deduction_effective_from ?? null,
    payroll_enabled: data.payroll_enabled ?? true,
    business_timezone: data.business_timezone ?? DEFAULT_BUSINESS_TIMEZONE,
    overnight_shifts_enabled: data.overnight_shifts_enabled ?? false,
    attendance_day_classification_enabled: data.attendance_day_classification_enabled ?? false,
    minimum_minutes_for_counted_day: data.minimum_minutes_for_counted_day ?? 60,
    full_day_minutes_threshold: data.full_day_minutes_threshold ?? 480,
    currency_code: data.currency_code,
    working_weekdays: data.working_weekdays ?? [1, 2, 3, 4, 5],
  };

  const { data: row, error } = await supabaseAdmin
    .from("company_policies")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return row as CompanyPolicyRecord;
}

export async function updatePolicy(
  companyId: string,
  data: UpdatePolicyData
): Promise<CompanyPolicyRecord | null> {
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (data.default_daily_hours !== undefined) {
    updates.default_daily_hours = data.default_daily_hours;
  }
  if (data.overtime_multiplier !== undefined) {
    updates.overtime_multiplier = data.overtime_multiplier;
  }
  if (data.lateness_tracking_enabled !== undefined) {
    updates.lateness_tracking_enabled = data.lateness_tracking_enabled;
  }
  if (data.late_pay_deduction_enabled !== undefined) {
    updates.late_pay_deduction_enabled = data.late_pay_deduction_enabled;
  }
  if (data.late_pay_deduction_effective_from !== undefined) {
    updates.late_pay_deduction_effective_from = data.late_pay_deduction_effective_from;
  }
  if (data.payroll_enabled !== undefined) {
    updates.payroll_enabled = data.payroll_enabled;
  }
  if (data.currency_code !== undefined) {
    updates.currency_code = data.currency_code;
  }
  if (data.working_weekdays !== undefined) {
    updates.working_weekdays = data.working_weekdays;
  }
  if (data.business_timezone !== undefined) {
    updates.business_timezone = data.business_timezone;
  }
  if (data.attendance_day_classification_enabled !== undefined) {
    updates.attendance_day_classification_enabled = data.attendance_day_classification_enabled;
  }
  if (data.minimum_minutes_for_counted_day !== undefined) {
    updates.minimum_minutes_for_counted_day = data.minimum_minutes_for_counted_day;
  }
  if (data.full_day_minutes_threshold !== undefined) {
    updates.full_day_minutes_threshold = data.full_day_minutes_threshold;
  }
  if (data.overnight_shifts_enabled !== undefined) {
    updates.overnight_shifts_enabled = data.overnight_shifts_enabled;
  }
  if (data.remote_attendance_enabled !== undefined) {
    updates.remote_attendance_enabled = data.remote_attendance_enabled;
  }
  if (data.overtime_policy_mode !== undefined) {
    updates.overtime_policy_mode = data.overtime_policy_mode;
  }
  if (data.overtime_compensation_method !== undefined) {
    updates.overtime_compensation_method = data.overtime_compensation_method;
  }
  if (data.fixed_overtime_hourly_rate !== undefined) {
    updates.fixed_overtime_hourly_rate = data.fixed_overtime_hourly_rate;
  }

  const { data: row, error } = await supabaseAdmin
    .from("company_policies")
    .update(updates)
    .eq("company_id", companyId)
    .select("*")
    .single();

  if (error) {
    if ((error as { code?: string }).code === "PGRST116") return null;
    throw error;
  }
  return row as CompanyPolicyRecord;
}
