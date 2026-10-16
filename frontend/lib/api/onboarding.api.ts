import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types/api";

export type OnboardingRequestStatus =
  | "interested"
  | "contacted"
  | "demo_scheduled"
  | "onboarded"
  | "rejected";

export interface OnboardingRequest {
  id: string;
  company_name: string;
  full_name: string;
  work_email: string;
  phone: string | null;
  role: string | null;
  industry: string | null;
  employee_count: string | null;
  country: string | null;
  city: string | null;
  notes: string | null;
  status: OnboardingRequestStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmitOnboardingRequestInput {
  company_name: string;
  full_name: string;
  work_email: string;
  phone?: string;
  role?: string;
  /** Maps to backend `notes`. */
  notes?: string;
  country?: string;
  employee_count?: string;
  /** Not collected on the public form — left null server-side. */
  industry?: string;
  city?: string;
}

export interface SubmitOnboardingRequestResult {
  id: string;
  message: string;
  /** True when an active request already exists for this work email (no new insert). */
  already_exists: boolean;
}

/** Public — no auth required. */
export async function submitOnboardingRequest(
  input: SubmitOnboardingRequestInput
): Promise<ApiResponse<SubmitOnboardingRequestResult>> {
  return apiClient.post<SubmitOnboardingRequestResult>("/api/onboarding/request", input);
}

export interface PlatformNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
