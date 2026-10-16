import type { PayrollPeriodStatus } from "./payrollPeriod.constants";

export interface PayrollPeriodRecord {
  id: string;
  company_id: string;
  payroll_year: number;
  payroll_month: number;
  status: PayrollPeriodStatus;
  business_timezone: string;
  generated_at: string | null;
  generated_by: string | null;
  submitted_for_review_at: string | null;
  submitted_by: string | null;
  approved_at: string | null;
  approved_by: string | null;
  locked_at: string | null;
  locked_by: string | null;
  closed_at: string | null;
  closed_by: string | null;
  reopened_at: string | null;
  reopened_by: string | null;
  reopen_reason: string | null;
  reopen_explanation: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollPeriodListOptions {
  year?: number;
  status?: PayrollPeriodStatus;
  limit?: number;
  offset?: number;
}

export interface PayrollPeriodListResult {
  periods: PayrollPeriodRecord[];
  total: number;
}

export interface PayrollPeriodResponse extends PayrollPeriodRecord {
  period_label: string;
  generated_by_name: string | null;
  submitted_by_name: string | null;
  approved_by_name: string | null;
  locked_by_name: string | null;
  closed_by_name: string | null;
  reopened_by_name: string | null;
  reopen_reason_label: string | null;
}

export interface ReopenPayrollPeriodInput {
  reason_code: string;
  explanation: string;
}

export interface PayrollPeriodTransitionUpdate {
  status: PayrollPeriodStatus;
  submitted_for_review_at?: string | null;
  submitted_by?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  locked_at?: string | null;
  locked_by?: string | null;
  closed_at?: string | null;
  closed_by?: string | null;
  reopened_at?: string | null;
  reopened_by?: string | null;
  reopen_reason?: string | null;
  reopen_explanation?: string | null;
  updated_at: string;
}

export interface CreatePayrollPeriodData {
  company_id: string;
  payroll_year: number;
  payroll_month: number;
  business_timezone: string;
  generated_by?: string | null;
}
