import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types/api";

export interface RemoteSessionRow {
  id: string;
  user_id: string;
  employee_name?: string | null;
  employee_email?: string | null;
  check_in: string | null;
  check_out: string | null;
  status: string;
  attendance_date?: string | null;
  attendance_mode?: string;
  remote_approval_status?: string | null;
  branch_name?: string | null;
  department_name?: string | null;
}

export async function getPendingRemoteSessions(): Promise<
  ApiResponse<RemoteSessionRow[]>
> {
  return apiClient.get<RemoteSessionRow[]>("/api/sessions/remote/pending");
}

export async function approveRemoteSession(
  sessionId: string,
  reviewNote?: string
): Promise<ApiResponse<RemoteSessionRow>> {
  return apiClient.patch<RemoteSessionRow>(
    `/api/sessions/${sessionId}/remote/approve`,
    { review_note: reviewNote ?? null }
  );
}

export async function rejectRemoteSession(
  sessionId: string,
  reviewNote?: string
): Promise<ApiResponse<RemoteSessionRow>> {
  return apiClient.patch<RemoteSessionRow>(
    `/api/sessions/${sessionId}/remote/reject`,
    { review_note: reviewNote ?? null }
  );
}
