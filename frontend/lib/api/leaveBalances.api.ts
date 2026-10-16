import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types/api";

export interface LeaveBalanceRecord {
  id: string;
  user_id: string;
  company_id: string;
  leave_type: string;
  allocated_days: number;
  used_days: number;
  remaining_days: number;
  total_days: number;
  leave_compensation_type: "paid" | "unpaid";
  leave_type_label: string;
  updated_at: string;
}

export async function getMyLeaveBalances(): Promise<ApiResponse<LeaveBalanceRecord[]>> {
  return apiClient.get<LeaveBalanceRecord[]>("/api/leave-balances/me");
}

export async function getUserLeaveBalances(
  userId: string
): Promise<ApiResponse<LeaveBalanceRecord[]>> {
  return apiClient.get<LeaveBalanceRecord[]>(`/api/leave-balances/user/${userId}`);
}

/** @deprecated Use getUserLeaveBalances — returns first/annual row for legacy callers. */
export async function getUserLeaveBalance(
  userId: string
): Promise<ApiResponse<LeaveBalanceRecord | null>> {
  const res = await getUserLeaveBalances(userId);
  if (!res.success) return res as ApiResponse<LeaveBalanceRecord | null>;
  const list = res.data ?? [];
  const annual = list.find((b) => b.leave_type === "annual") ?? list[0] ?? null;
  return { success: true, data: annual };
}

export async function createLeaveBalance(input: {
  user_id: string;
  leave_type: string;
  total_days: number;
}): Promise<ApiResponse<LeaveBalanceRecord>> {
  return apiClient.post<LeaveBalanceRecord>("/api/leave-balances", input);
}

/** Allocation only — used_days is lifecycle-managed on the server. */
export async function updateLeaveBalance(
  id: string,
  input: { total_days?: number }
): Promise<ApiResponse<LeaveBalanceRecord>> {
  return apiClient.patch<LeaveBalanceRecord>(`/api/leave-balances/${id}`, input);
}
