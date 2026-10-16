import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types/api";

/** Matches backend company_policies / CompanyPolicyRecord. */
export interface CompanyPolicy {
  id: string;
  company_id: string;
  default_daily_hours: number;
  overtime_multiplier: number;
  /** Phase 1: configuration only; payroll still uses duration. */
  overtime_policy_mode?: "duration" | "shift_end" | "greater_of" | "manual_only" | "none";
  /** OT pay method: multiplier (default) or fixed_rate. */
  overtime_compensation_method?: "multiplier" | "fixed_rate";
  /** Company fixed OT hourly rate when method is fixed_rate. */
  fixed_overtime_hourly_rate?: number | null;
  /** When false, late_minutes are not stored at clock-in. */
  lateness_tracking_enabled?: boolean;
  /** When true and payroll is on, late minutes reduce gross pay. */
  late_pay_deduction_enabled?: boolean;
  /**
   * First attendance date (YYYY-MM-DD) from which late pay deductions may apply.
   * Null/omitted ⇒ deductions must not apply even if enabled.
   */
  late_pay_deduction_effective_from?: string | null;
  /** When false, payroll features are off (attendance-only). Omitted/undefined treated as true. */
  payroll_enabled?: boolean;
  /** IANA timezone for earnings “today” (default UTC). */
  business_timezone?: string;
  /** When true, cross-midnight shift definitions are allowed (Sprint 2+). */
  overnight_shifts_enabled?: boolean;
  /** When true, authorized employees may use remote clock-in/out (manager approval for payroll). */
  remote_attendance_enabled?: boolean;
  attendance_day_classification_enabled?: boolean;
  minimum_minutes_for_counted_day?: number;
  full_day_minutes_threshold?: number;
  /** From GET only: true when payroll cannot be turned off (payroll rows or wage assignments exist). */
  payroll_disable_blocked?: boolean;
  currency_code: "GHS" | "USD";
  /** Weekdays 1=Mon … 7=Sun */
  working_weekdays?: number[];
  created_at: string;
  updated_at: string;
}

export interface UpdatePolicyInput {
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
  currency_code?: "GHS" | "USD";
  working_weekdays?: number[];
  overtime_policy_mode?: "duration" | "shift_end" | "greater_of" | "manual_only" | "none";
  overtime_compensation_method?: "multiplier" | "fixed_rate";
  fixed_overtime_hourly_rate?: number | null;
}

export async function getPolicy(): Promise<ApiResponse<CompanyPolicy>> {
  return apiClient.get<CompanyPolicy>("/api/company-policy");
}

export async function updatePolicy(
  data: UpdatePolicyInput
): Promise<ApiResponse<CompanyPolicy>> {
  return apiClient.patch<CompanyPolicy>("/api/company-policy", data);
}
