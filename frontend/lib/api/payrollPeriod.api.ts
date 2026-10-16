import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types/api";

export type PayrollPeriodStatus =
  | "draft"
  | "processing"
  | "approved"
  | "locked"
  | "archived"
  /** @deprecated legacy alias — normalized to processing */
  | "review"
  /** @deprecated legacy alias — normalized to archived */
  | "closed";

export interface PayrollPeriod {
  id: string;
  company_id: string;
  payroll_year: number;
  payroll_month: number;
  status: PayrollPeriodStatus;
  business_timezone: string;
  generated_at: string | null;
  generated_by: string | null;
  generated_by_name: string | null;
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
  period_label: string;
  submitted_by_name: string | null;
  approved_by_name: string | null;
  locked_by_name: string | null;
  closed_by_name: string | null;
  reopened_by_name: string | null;
  reopen_reason_label: string | null;
}

export interface PayrollPeriodListResult {
  periods: PayrollPeriod[];
  total: number;
}

export async function listPayrollPeriods(params?: {
  year?: number;
  status?: PayrollPeriodStatus;
  limit?: number;
  offset?: number;
}): Promise<ApiResponse<PayrollPeriodListResult>> {
  const search = new URLSearchParams();
  if (params?.year !== undefined) search.set("year", String(params.year));
  if (params?.status) search.set("status", String(params.status));
  if (params?.limit !== undefined) search.set("limit", String(params.limit));
  if (params?.offset !== undefined) search.set("offset", String(params.offset));
  const qs = search.toString();
  return apiClient.get<PayrollPeriodListResult>(
    `/api/payroll-periods${qs ? `?${qs}` : ""}`
  );
}

export async function getPayrollPeriod(
  year: number,
  month: number,
  createIfMissing = false
): Promise<ApiResponse<PayrollPeriod>> {
  const qs = createIfMissing ? "?create_if_missing=true" : "";
  return apiClient.get<PayrollPeriod>(`/api/payroll-periods/${year}/${month}${qs}`);
}

export async function getPayrollPeriodById(
  id: string
): Promise<ApiResponse<PayrollPeriod>> {
  return apiClient.get<PayrollPeriod>(`/api/payroll-periods/${id}`);
}

export async function submitPayrollPeriodForReview(
  id: string
): Promise<ApiResponse<PayrollPeriod>> {
  return apiClient.post<PayrollPeriod>(`/api/payroll-periods/${id}/submit-review`);
}

export async function approvePayrollPeriod(
  id: string
): Promise<ApiResponse<PayrollPeriod>> {
  return apiClient.post<PayrollPeriod>(`/api/payroll-periods/${id}/approve`);
}

export async function lockPayrollPeriod(
  id: string
): Promise<ApiResponse<PayrollPeriod>> {
  return apiClient.post<PayrollPeriod>(`/api/payroll-periods/${id}/lock`);
}

export async function unlockPayrollPeriod(
  id: string
): Promise<ApiResponse<PayrollPeriod>> {
  return apiClient.post<PayrollPeriod>(`/api/payroll-periods/${id}/unlock`);
}

export async function closePayrollPeriod(
  id: string
): Promise<ApiResponse<PayrollPeriod>> {
  return apiClient.post<PayrollPeriod>(`/api/payroll-periods/${id}/close`);
}

export type ReopenPayrollPeriodPayload = {
  reason_code: string;
  explanation: string;
};

export async function reopenPayrollPeriod(
  id: string,
  payload: ReopenPayrollPeriodPayload
): Promise<ApiResponse<PayrollPeriod>> {
  return apiClient.post<PayrollPeriod>(`/api/payroll-periods/${id}/reopen`, payload);
}

export async function regeneratePayrollPeriod(
  id: string,
  reason?: string
): Promise<ApiResponse<PayrollPeriod>> {
  return apiClient.post<PayrollPeriod>(`/api/payroll-periods/${id}/regenerate`, {
    reason: reason ?? null,
  });
}
