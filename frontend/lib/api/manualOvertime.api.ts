import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types/api";

export type ManualOvertimeEntryStatus =
  | "draft"
  | "approved"
  | "rejected"
  | "cancelled";

export interface ManualOvertimeEntry {
  id: string;
  user_id: string;
  employee_name: string | null;
  earnings_date: string;
  hours: number;
  reason: string;
  reason_code: string | null;
  status: ManualOvertimeEntryStatus;
  created_by: string;
  created_by_name: string | null;
  approved_by: string | null;
  approved_at: string | null;
  payroll_record_id: string | null;
  overlap_warning_acknowledged: boolean;
  created_at: string;
}

export interface ManualOvertimeOverlapSummary {
  earnings_date: string;
  automatic_overtime_minutes: number;
  automatic_overtime_hours: number;
  existing_manual_overtime_minutes: number;
  existing_manual_overtime_hours: number;
  proposed_hours: number;
  combined_overtime_hours: number;
  attendance_session_count: number;
  existing_manual_entry_count: number;
}

export interface OverlapCheckResult {
  summary: ManualOvertimeOverlapSummary;
  requires_acknowledgment: boolean;
  allowed: boolean;
  error: string | null;
}

export async function listManualOvertime(params: {
  year: number;
  month: number;
  user_id?: string;
  status?: ManualOvertimeEntryStatus;
}): Promise<ApiResponse<ManualOvertimeEntry[]>> {
  const q = new URLSearchParams({
    year: String(params.year),
    month: String(params.month),
  });
  if (params.user_id) q.set("user_id", params.user_id);
  if (params.status) q.set("status", params.status);
  return apiClient.get<ManualOvertimeEntry[]>(`/api/manual-overtime?${q.toString()}`);
}

export async function checkManualOvertimeOverlap(params: {
  user_id: string;
  earnings_date: string;
  hours: number;
}): Promise<ApiResponse<OverlapCheckResult>> {
  const q = new URLSearchParams({
    user_id: params.user_id,
    earnings_date: params.earnings_date,
    hours: String(params.hours),
  });
  return apiClient.get<OverlapCheckResult>(`/api/manual-overtime/overlap-check?${q.toString()}`);
}

export async function createManualOvertime(input: {
  user_id: string;
  earnings_date: string;
  hours: number;
  reason: string;
  reason_code?: string;
  overlap_warning_acknowledged?: boolean;
}): Promise<ApiResponse<ManualOvertimeEntry>> {
  return apiClient.post<ManualOvertimeEntry>("/api/manual-overtime", input);
}

export async function cancelManualOvertime(
  entryId: string
): Promise<ApiResponse<ManualOvertimeEntry>> {
  return apiClient.post<ManualOvertimeEntry>(`/api/manual-overtime/${entryId}/cancel`, {});
}
