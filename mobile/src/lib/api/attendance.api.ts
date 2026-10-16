import { apiClient } from "./client";
import type { ApiResponse } from "@/types/api";

/** POST /api/branches/validate-qr — body: { qr_code, latitude, longitude } */
export interface ValidateQrPayload {
  qr_code: string;
  latitude: number;
  longitude: number;
}

export interface ValidateQrData {
  branch_id: string;
  name: string;
}

export async function validateAttendanceQr(
  payload: ValidateQrPayload
): Promise<ApiResponse<ValidateQrData>> {
  return apiClient.post<ValidateQrData>("/api/branches/validate-qr", payload);
}

/**
 * POST /api/sessions/clock-in
 * Self-service requires branch_id + GPS (server validates geofence).
 */
export interface ClockInPayload {
  branch_id: string;
  latitude: number;
  longitude: number;
  /** Optional department within the branch. */
  department_id?: string;
}

export interface WorkSessionData {
  id: string;
  check_in: string;
  status: string;
  attendance_date?: string | null;
  overnight_session?: boolean;
  [key: string]: unknown;
}

export async function clockIn(
  payload: ClockInPayload
): Promise<ApiResponse<WorkSessionData>> {
  return apiClient.post<WorkSessionData>("/api/sessions/clock-in", payload);
}

/** POST /api/sessions/clock-out — body: { latitude, longitude } */
export interface ClockOutPayload {
  latitude: number;
  longitude: number;
}

export async function clockOut(
  payload: ClockOutPayload
): Promise<ApiResponse<WorkSessionData>> {
  return apiClient.post<WorkSessionData>("/api/sessions/clock-out", payload);
}

/** POST /api/sessions/remote-clock-in — no QR/geofence; requires company remote flag */
export async function remoteClockIn(): Promise<ApiResponse<WorkSessionData>> {
  return apiClient.post<WorkSessionData>("/api/sessions/remote-clock-in", {});
}

/** POST /api/sessions/remote-clock-out */
export async function remoteClockOut(): Promise<ApiResponse<WorkSessionData>> {
  return apiClient.post<WorkSessionData>("/api/sessions/remote-clock-out", {});
}

/** GET /api/sessions/today — current user's sessions today */
export interface SessionRecord {
  id: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  attendance_date?: string | null;
  overnight_session?: boolean;
  attendance_mode?: string;
  remote_approval_status?: string | null;
  duration_minutes?: number | null;
  [key: string]: unknown;
}

export async function getTodaySessions(): Promise<
  ApiResponse<SessionRecord[]>
> {
  return apiClient.get<SessionRecord[]>("/api/sessions/today");
}

/** GET /api/sessions/history — enriched rows, optional start/end (YYYY-MM-DD), page, limit */
export interface SessionHistoryItem {
  id: string;
  user_id: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  duration_minutes: number | null;
  total_hours: number | null;
  branch_id: string | null;
  branch_name: string | null;
  department_id: string | null;
  department_name: string | null;
  employee_name?: string | null;
  employee_email?: string | null;
  /** V2 ownership day (YYYY-MM-DD); may differ from check-in for overnight. */
  attendance_date?: string | null;
  overnight_session?: boolean;
  attendance_mode?: string;
  remote_approval_status?: string | null;
}

export interface SessionHistoryResponse {
  rows: SessionHistoryItem[];
  total: number;
  page: number;
  limit: number;
}

function sessionHistoryQuery(params: {
  page?: number;
  limit?: number;
  start?: string;
  end?: string;
}): string {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.start) qs.set("start", params.start);
  if (params.end) qs.set("end", String(params.end));
  const q = qs.toString();
  return q ? `?${q}` : "";
}

export async function getMySessionHistory(params?: {
  page?: number;
  limit?: number;
  start?: string;
  end?: string;
}): Promise<ApiResponse<SessionHistoryResponse>> {
  return apiClient.get<SessionHistoryResponse>(
    `/api/sessions/history${sessionHistoryQuery(params ?? {})}`
  );
}
