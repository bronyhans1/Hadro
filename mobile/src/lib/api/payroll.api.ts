import { apiClient } from "./client";
import type { ApiResponse } from "@/types/api";

/** Matches backend payroll_records (GET /api/payroll/me). */
export interface PayrollRecord {
  id: string;
  user_id: string;
  regular_minutes?: number | null;
  overtime_minutes?: number | null;
  hours_worked?: number | null;
  hourly_rate?: number | null;
  gross_earnings: number;
  payroll_date: string;
  earnings_date?: string | null;
  status?: string;
  record_type?: string | null;
  shadow_overtime?: {
    duration_ot_minutes: number | null;
    shift_ot_minutes: number | null;
  } | null;
}

export interface PayrollReportResult {
  records: PayrollRecord[];
  total_hours: number;
  total_overtime_minutes: number;
  total_gross_pay: number;
  total_base_before_late?: number;
  total_late_deduction?: number;
  shadow_overtime?: {
    total_duration_ot_minutes: number;
    total_shift_ot_minutes: number;
  };
}

export async function getMyPayroll(): Promise<ApiResponse<PayrollReportResult>> {
  return apiClient.get<PayrollReportResult>("/api/payroll/me");
}

export interface EarningsSummary {
  rate_type: "hourly" | "monthly" | "none";
  monthly_salary: number | null;
  expected_monthly_salary: number | null;
  daily_rate: number | null;
  payable_days_in_month: number;
  paid_days: number;
  unpaid_days: number;
  today_earned: number;
  today_base_before_late?: number;
  today_late_deduction?: number;
  month_earned_total: number;
  month_base_before_late?: number;
  month_late_deduction_total?: number;
  month_earned_salary_daily: number;
  month_earned_hourly: number;
  divisor_type: string | null;
  /** IANA timezone used for calendar “today” (company policy). */
  business_timezone?: string;
  calendar_today?: string;
  earnings_period_label?: string;
  attendance_thresholds?: {
    minimum_minutes_for_counted_day: number;
    full_day_minutes_threshold: number;
  };
  /** Leave awareness for today — metadata only; does not change API math. */
  payroll_leave_readiness?: {
    today_payroll_day_classification: "WORKING" | "PAID_LEAVE" | "UNPAID_LEAVE";
    today_covered_by_approved_paid_leave: boolean;
    today_leave_request_id: string | null;
  };
  daily_history: Array<{
    date: string;
    gross: number;
    record_type: string;
    earning_source?: string | null;
    base_before_late?: number;
    late_deduction?: number;
    payroll_day_classification?: "WORKING" | "PAID_LEAVE" | "UNPAID_LEAVE";
  }>;
}

export async function getMyEarningsSummary(): Promise<ApiResponse<EarningsSummary>> {
  return apiClient.get<EarningsSummary>("/api/payroll/earnings/me");
}
