/**
 * Canonical role names aligned with backend.
 * Platform-level: PLATFORM_ADMIN.
 * Company-level: admin, manager, HR, employee.
 */
export type AppRole = "admin" | "manager" | "HR" | "employee" | "PLATFORM_ADMIN";

export interface AuthUser {
  userId: string;
  email: string;
  companyId: string;
  roles: AppRole[];
  /** From GET /api/auth/me — user's assigned branch (manager/HR scoping). */
  branch: { id: string; name: string } | null;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  profilePhotoUrl: string | null;
  mustChangePassword: boolean;
  themePreference: "light" | "dark" | "system";
  /** Explicit personal locale. Null when the user has not chosen a language. */
  language: "en" | "fr" | "pt" | "ar" | "sw" | "es" | null;
  department: { id: string; name: string } | null;
  companyName: string;
  /** Tenant company logo URL from GET /api/auth/me — never replaces HADRO branding. */
  companyLogoUrl: string | null;
  /** Company payroll feature flag from GET /api/auth/me (default true). */
  payrollEnabled: boolean;
  /** IANA zone from `company_policies.business_timezone` (earnings / display). */
  businessTimeZone: string;
  /** `users.status` from GET /api/auth/me. */
  accountStatus: "active" | "inactive" | "suspended";
  /** `companies.status` from GET /api/auth/me. */
  companyAccountStatus: "active" | "inactive" | "suspended";
  profileCompletion: {
    requiredComplete: boolean;
    missingRequiredFields: string[];
    recommendedMissingFields: string[];
  };
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
}
