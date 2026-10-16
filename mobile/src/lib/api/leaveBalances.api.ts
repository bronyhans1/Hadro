import { apiClient } from "./client";
import type { ApiResponse } from "@/types/api";

export interface LeaveBalanceItem {
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

export async function getMyLeaveBalances(): Promise<ApiResponse<LeaveBalanceItem[]>> {
  return apiClient.get<LeaveBalanceItem[]>("/api/leave-balances/me");
}
