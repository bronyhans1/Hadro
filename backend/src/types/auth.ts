import { Request } from "express";

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

/** Set by `contextMiddleware` after auth. */
export interface RequestContext {
  userId: string;
  companyId: string | null;
  branchId: string | null;
  roles: string[];
}

/** After `authMiddleware`; includes Supabase user on the request. */
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/** After `contextMiddleware`; includes tenant/platform context. */
export interface ContextRequest extends AuthenticatedRequest {
  context?: RequestContext;
}

export interface MeResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string | null;
  gender?: string | null;
  phone_number?: string | null;
  profile_photo_url?: string | null;
  must_change_password?: boolean;
  theme_preference?: "light" | "dark" | "system";
  /** Explicit personal locale. Null when the user has not chosen a language. */
  language?: "en" | "fr" | "pt" | "ar" | "sw" | "es" | null;
  department?: { id: string; name: string } | null;
  profile_completion?: {
    required_complete: boolean;
    missing_required_fields: string[];
    recommended_missing_fields: string[];
  };
  company: {
    id: string;
    name: string;
    /** Present when `companies.branch_name` exists in DB; otherwise omitted/null. */
    branch_name?: string | null;
    /** Tenant logo URL — never replaces HADRO platform branding. */
    logo_url?: string | null;
    industry?: string | null;
    country?: string | null;
    region?: string | null;
    city?: string | null;
    /** From `company_policies.payroll_enabled`; default true when no policy row. */
    payroll_enabled: boolean;
    /** IANA zone from `company_policies.business_timezone` (earnings / “today”). */
    business_timezone: string;
    /** `companies.status`: active | inactive | suspended */
    status: "active" | "inactive" | "suspended";
    /** From `company_policies.remote_attendance_enabled`. */
    remote_attendance_enabled?: boolean;
  };
  /** Per-employee remote authorization (`users.remote_attendance_allowed`). */
  remote_attendance_allowed?: boolean;
  /** Company remote flag AND employee authorization — use for UI visibility. */
  effective_remote_attendance_enabled?: boolean;
  /** `users.status`: active | inactive | suspended */
  status: "active" | "inactive" | "suspended";
  /** User's branch from `users.branch_id` + `branches` (Phase 1). */
  branch: { id: string; name: string } | null;
  roles: string[];
}
