import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types/api";

/** Matches backend leave_requests response. */
export interface LeaveRequest {
  id: string;
  user_id: string;
  company_id: string;
  employee_name?: string | null;
  employee_email?: string | null;
  start_date: string;
  end_date: string;
  total_days: number;
  leave_type: string;
  /** Final compensation for this request (payroll / workforce events). */
  leave_compensation_type?: string | null;
  /** Company default snapshotted at create. */
  leave_compensation_default?: string | null;
  /** True when final compensation differs from company default. */
  leave_compensation_overridden?: boolean;
  leave_compensation_source?: "default" | "override";
  /** HR-only; omitted on employee my-leave responses. */
  leave_override_reason?: string | null;
  reason: string | null;
  /** API returns PENDING | APPROVED | REJECTED | CANCELLED | TERMINATED | COMPLETED */
  status: string;
  approved_by?: string | null;
  approved_at?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  cancelled_at?: string | null;
  terminated_at?: string | null;
  terminated_by?: string | null;
  termination_reason?: string | null;
  actual_return_date?: string | null;
  restored_days?: number | null;
  actual_used_days?: number | null;
  completed_at?: string | null;
}

export interface RequestLeaveInput {
  start_date: string;
  end_date: string;
  leave_type: string;
  reason?: string | null;
}

export async function getMyLeaveRequests(): Promise<ApiResponse<LeaveRequest[]>> {
  return apiClient.get<LeaveRequest[]>("/api/leave/my");
}

export async function getCompanyLeaveRequests(
  status?:
    | "pending"
    | "approved"
    | "rejected"
    | "cancelled"
    | "terminated"
    | "completed"
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED"
    | "TERMINATED"
    | "COMPLETED"
    | ""
): Promise<ApiResponse<LeaveRequest[]>> {
  const q =
    status && String(status).trim() !== ""
      ? `?status=${encodeURIComponent(String(status).toLowerCase())}`
      : "";
  return apiClient.get<LeaveRequest[]>(`/api/leave/company${q}`);
}

export async function requestLeave(
  input: RequestLeaveInput
): Promise<ApiResponse<LeaveRequest>> {
  return apiClient.post<LeaveRequest>("/api/leave", input);
}

export async function approveLeave(leaveId: string): Promise<ApiResponse<LeaveRequest>> {
  return apiClient.patch<LeaveRequest>(`/api/leave/${leaveId}/approve`, {});
}

export async function rejectLeave(leaveId: string): Promise<ApiResponse<LeaveRequest>> {
  return apiClient.patch<LeaveRequest>(`/api/leave/${leaveId}/reject`, {});
}

export async function reviewLeave(
  leaveId: string,
  action: "approve" | "reject",
  options?: {
    leave_compensation_type?: "paid" | "unpaid";
    leave_override_reason?: string;
  }
): Promise<ApiResponse<LeaveRequest>> {
  return apiClient.patch<LeaveRequest>(`/api/leave/${leaveId}/review`, {
    action,
    ...(options?.leave_compensation_type
      ? { leave_compensation_type: options.leave_compensation_type }
      : {}),
    ...(options?.leave_override_reason != null
      ? { leave_override_reason: options.leave_override_reason }
      : {}),
  });
}

export async function updateLeaveCompensation(
  leaveId: string,
  leave_compensation_type: "paid" | "unpaid",
  leave_override_reason?: string
): Promise<ApiResponse<LeaveRequest>> {
  return apiClient.patch<LeaveRequest>(`/api/leave/${leaveId}/compensation`, {
    leave_compensation_type,
    ...(leave_override_reason != null ? { leave_override_reason } : {}),
  });
}

export async function cancelLeave(leaveId: string): Promise<ApiResponse<LeaveRequest>> {
  return apiClient.patch<LeaveRequest>(`/api/leave/${leaveId}/cancel`, {});
}

export async function terminateLeave(
  leaveId: string,
  input: { actual_return_date: string; reason?: string | null }
): Promise<ApiResponse<LeaveRequest>> {
  return apiClient.patch<LeaveRequest>(`/api/leave/${leaveId}/terminate`, input);
}

export interface CurrentlyOnLeaveRow {
  id: string;
  user_id: string;
  employee_name: string | null;
  employee_email: string | null;
  department: string | null;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  days_remaining: number;
  status: string;
}

export async function getCurrentlyOnLeave(): Promise<ApiResponse<CurrentlyOnLeaveRow[]>> {
  return apiClient.get<CurrentlyOnLeaveRow[]>("/api/leave/currently-on-leave");
}
