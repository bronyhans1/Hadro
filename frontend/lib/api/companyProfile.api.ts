import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types/api";

export type CompanyProfile = {
  id: string;
  name: string;
  company_code: string;
  logo_url: string | null;
  industry: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  street_address: string | null;
  postal_code: string | null;
  business_phone: string | null;
  website: string | null;
  registration_number: string | null;
  tax_number: string | null;
  business_timezone: string;
  profile_setup_dismissed_at: string | null;
  location_label: string;
  initials: string;
  completion_percent: number;
  missing_fields: string[];
};

export type CompanyProfileUpdate = Partial<{
  name: string;
  logo_url: string | null;
  industry: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  street_address: string | null;
  postal_code: string | null;
  business_phone: string | null;
  website: string | null;
  registration_number: string | null;
  tax_number: string | null;
}>;

export async function getCompanyProfile(): Promise<ApiResponse<CompanyProfile>> {
  return apiClient.get<CompanyProfile>("/api/company-profile");
}

export async function updateCompanyProfile(
  body: CompanyProfileUpdate
): Promise<ApiResponse<CompanyProfile>> {
  return apiClient.patch<CompanyProfile>("/api/company-profile", body);
}

export async function dismissCompanyProfileSetup(): Promise<ApiResponse<CompanyProfile>> {
  return apiClient.post<CompanyProfile>("/api/company-profile/dismiss-setup", {});
}
