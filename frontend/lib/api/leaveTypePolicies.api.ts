import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types/api";

export type LeaveCompensationType = "paid" | "unpaid";

export interface LeaveTypePolicy {
  leave_type: string;
  label: string;
  compensation_type: LeaveCompensationType;
}

export async function listLeaveTypePolicies(): Promise<ApiResponse<LeaveTypePolicy[]>> {
  return apiClient.get<LeaveTypePolicy[]>("/api/leave-type-policies");
}

export async function updateLeaveTypePolicy(
  leaveType: string,
  compensation_type: LeaveCompensationType
): Promise<ApiResponse<LeaveTypePolicy>> {
  return apiClient.patch<LeaveTypePolicy>(
    `/api/leave-type-policies/${encodeURIComponent(leaveType)}`,
    { compensation_type }
  );
}
