import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types/api";
import type {
  OnboardingRequest,
  OnboardingRequestStatus,
  PlatformNotification,
} from "@/lib/api/onboarding.api";

export interface ProvisionCompanyInput {
  company_name: string;
  company_code?: string | null;
  admin_first_name: string;
  admin_last_name: string;
  admin_email: string;
  temporary_password: string;
  /** NULL => unlimited */
  branch_limit?: number | null;
}

export interface ProvisionCompanyData {
  company_id: string;
  company_name: string;
  company_code: string;
  admin_user_id: string;
  admin_email: string;
  temporary_password_set: boolean;
}

export interface PlatformCompanyListItem {
  company_id: string;
  company_name: string;
  company_code: string;
  created_at?: string;
  admin_emails: string[];
  /** NULL => unlimited */
  branch_limit: number | null;
  branches_count: number;
  status: "active" | "inactive" | "suspended";
  logo_url?: string | null;
  initials?: string;
  industry?: string | null;
  location_label?: string;
  plan?: string;
  employees_count?: number;
  administrator_name?: string | null;
  administrator_email?: string | null;
  joined_at?: string | null;
  last_activity_at?: string | null;
}

export interface PlatformDashboardData {
  totals: {
    companies: number;
    companies_active: number;
    companies_inactive: number;
    branches: number;
    departments: number;
    users_total: number;
    users_active: number;
    users_inactive: number;
  };
  recent_activity: Array<{
    id: string;
    action: string;
    entity_type: string | null;
    entity_id: string | null;
    created_at: string;
    company_id: string;
    company_name: string | null;
    metadata?: unknown;
  }>;
}

export interface PlatformSupportSettings {
  support_email: string | null;
  support_phone: string | null;
  support_whatsapp_url: string | null;
  updated_at?: string;
}

/** POST /api/platform/companies — PLATFORM_ADMIN only. */
export async function provisionCompany(
  input: ProvisionCompanyInput
): Promise<ApiResponse<ProvisionCompanyData>> {
  return apiClient.post<ProvisionCompanyData>("/api/platform/companies", input);
}

/** GET /api/platform/companies — PLATFORM_ADMIN only. */
export async function getCompanies(): Promise<ApiResponse<PlatformCompanyListItem[]>> {
  return apiClient.get<PlatformCompanyListItem[]>("/api/platform/companies");
}

export async function patchCompany(
  companyId: string,
  body: { branch_limit?: number | null; status?: "active" | "inactive" | "suspended" }
): Promise<ApiResponse<null>> {
  return apiClient.patch<null>(`/api/platform/companies/${companyId}`, body);
}

/** GET /api/platform/companies/:id/profile — PLATFORM_ADMIN only. */
export async function getCompanyProfileForPlatform(
  companyId: string
): Promise<ApiResponse<import("./companyProfile.api").CompanyProfile>> {
  return apiClient.get(`/api/platform/companies/${companyId}/profile`);
}

/** PATCH /api/platform/companies/:id/profile — PLATFORM_ADMIN only. */
export async function updateCompanyProfileForPlatform(
  companyId: string,
  body: import("./companyProfile.api").CompanyProfileUpdate
): Promise<ApiResponse<import("./companyProfile.api").CompanyProfile>> {
  return apiClient.patch(`/api/platform/companies/${companyId}/profile`, body);
}

export async function updateCompanyBranchLimit(
  companyId: string,
  branchLimit: number | null
): Promise<ApiResponse<null>> {
  return patchCompany(companyId, { branch_limit: branchLimit });
}

export async function getPlatformDashboard(): Promise<ApiResponse<PlatformDashboardData>> {
  return apiClient.get<PlatformDashboardData>("/api/platform/dashboard");
}

/** Cross-company audit row for Platform Audit Center. */
export interface PlatformAuditLog {
  id: string;
  company_id: string;
  company_name: string | null;
  actor_id: string;
  actor_name?: string | null;
  actor_email?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: string | Record<string, unknown> | null;
  created_at: string;
}

/**
 * GET /api/platform/audit — PLATFORM_ADMIN only.
 * Optional `limit` (default 500) for future pagination hooks.
 */
export async function getPlatformAuditLogs(
  limit = 500
): Promise<ApiResponse<PlatformAuditLog[]>> {
  const q = typeof limit === "number" && Number.isFinite(limit) ? `?limit=${Math.floor(limit)}` : "";
  return apiClient.get<PlatformAuditLog[]>(`/api/platform/audit${q}`);
}

/** GET /api/platform/support-settings — authenticated users. */
export async function getSupportSettings(): Promise<ApiResponse<PlatformSupportSettings>> {
  return apiClient.get<PlatformSupportSettings>("/api/platform/support-settings");
}

/** PATCH /api/platform/support-settings — PLATFORM_ADMIN only. */
export async function updateSupportSettings(input: {
  support_email?: string | null;
  support_phone?: string | null;
  support_whatsapp_url?: string | null;
}): Promise<ApiResponse<PlatformSupportSettings>> {
  return apiClient.patch<PlatformSupportSettings>("/api/platform/support-settings", input);
}

export async function deleteCompany(
  companyId: string,
  confirmCompanyName: string
): Promise<ApiResponse<null>> {
  return apiClient.delete<null>(`/api/platform/companies/${companyId}`, {
    body: JSON.stringify({ confirm_company_name: confirmCompanyName }),
    headers: { "Content-Type": "application/json" },
  });
}

export async function listOnboardingRequests(params?: {
  status?: OnboardingRequestStatus;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<
  ApiResponse<{ rows: OnboardingRequest[]; page: number; limit: number; total: number }>
> {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.search?.trim()) q.set("search", params.search.trim());
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return apiClient.get(`/api/platform/onboarding-requests${suffix}`);
}

export async function updateOnboardingRequest(
  id: string,
  body: { status?: OnboardingRequestStatus; admin_notes?: string | null }
): Promise<ApiResponse<OnboardingRequest>> {
  return apiClient.patch<OnboardingRequest>(`/api/platform/onboarding-requests/${id}`, body);
}

export async function getPlatformNotifications(params?: {
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{ rows: PlatformNotification[]; page: number; limit: number; total: number }>> {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return apiClient.get(`/api/platform/notifications${suffix}`);
}

export async function getPlatformUnreadCount(): Promise<ApiResponse<{ count: number }>> {
  return apiClient.get<{ count: number }>("/api/platform/notifications/unread-count");
}

export async function markPlatformNotificationRead(id: string): Promise<ApiResponse<null>> {
  return apiClient.patch<null>(`/api/platform/notifications/${id}/read`, {});
}

