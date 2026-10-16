/** Backend GET /api/auth/me body (unwrapped or inside `data`). */
export interface MeResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company: {
    id: string;
    name: string;
    branch_name?: string | null;
    payroll_enabled?: boolean;
    business_timezone?: string | null;
    status?: "active" | "inactive" | "suspended";
    remote_attendance_enabled?: boolean;
  };
  remote_attendance_allowed?: boolean;
  effective_remote_attendance_enabled?: boolean;
  branch?: { id: string; name: string } | null;
  date_of_birth?: string | null;
  gender?: string | null;
  phone_number?: string | null;
  profile_photo_url?: string | null;
  must_change_password?: boolean;
  theme_preference?: "light" | "dark" | "system";
  language?: "en" | "fr" | "pt" | "ar" | "sw" | "es" | null;
  department?: { id: string; name: string } | null;
  profile_completion?: {
    required_complete: boolean;
    missing_required_fields: string[];
    recommended_missing_fields: string[];
  };
  roles: string[];
  status?: "active" | "inactive" | "suspended";
}
