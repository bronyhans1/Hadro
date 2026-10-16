import { apiClient } from "./client";
import type { ApiResponse } from "@/types/api";

export interface CompanyPolicy {
  id: string;
  company_id: string;
  default_daily_hours: number;
  overtime_multiplier: number;
  overtime_policy_mode?: "duration" | "shift_end" | "greater_of" | "manual_only" | "none";
  lateness_tracking_enabled?: boolean;
  late_pay_deduction_enabled?: boolean;
  payroll_enabled?: boolean;
  payroll_disable_blocked?: boolean;
  currency_code: "GHS" | "USD";
  remote_attendance_enabled?: boolean;
  working_weekdays?: number[];
  created_at: string;
  updated_at: string;
}

export async function getPolicy(): Promise<ApiResponse<CompanyPolicy>> {
  return apiClient.get<CompanyPolicy>("/api/company-policy");
}

