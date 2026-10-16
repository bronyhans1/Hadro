import { supabaseAdmin } from "../../config/supabase";

export type OnboardingRequestStatus =
  | "interested"
  | "contacted"
  | "demo_scheduled"
  | "onboarded"
  | "rejected";

export interface OnboardingRequestRow {
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

export interface CreateOnboardingRequestInput {
  company_name: string;
  full_name: string;
  work_email: string;
  phone?: string | null;
  role?: string | null;
  industry?: string | null;
  employee_count?: string | null;
  country?: string | null;
  city?: string | null;
  notes?: string | null;
}

export async function insertOnboardingRequest(
  input: CreateOnboardingRequestInput
): Promise<OnboardingRequestRow> {
  const { data, error } = await supabaseAdmin
    .from("onboarding_requests")
    .insert({
      company_name: input.company_name,
      full_name: input.full_name,
      work_email: input.work_email,
      phone: input.phone ?? null,
      role: input.role ?? null,
      industry: input.industry ?? null,
      employee_count: input.employee_count ?? null,
      country: input.country ?? null,
      city: input.city ?? null,
      notes: input.notes ?? null,
      status: "interested",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as OnboardingRequestRow;
}

export async function listOnboardingRequests(options: {
  status?: OnboardingRequestStatus;
  search?: string;
  limit: number;
  offset: number;
}): Promise<{ rows: OnboardingRequestRow[]; total: number }> {
  let q = supabaseAdmin
    .from("onboarding_requests")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (options.status) {
    q = q.eq("status", options.status);
  }
  const search = options.search?.trim().replace(/[%_]/g, "");
  if (search) {
    q = q.or(
      `company_name.ilike.%${search}%,full_name.ilike.%${search}%,work_email.ilike.%${search}%,industry.ilike.%${search}%`
    );
  }

  const { data, error, count } = await q.range(options.offset, options.offset + options.limit - 1);
  if (error) throw error;
  return { rows: (data ?? []) as OnboardingRequestRow[], total: count ?? 0 };
}

export async function getOnboardingRequestById(id: string): Promise<OnboardingRequestRow | null> {
  const { data, error } = await supabaseAdmin
    .from("onboarding_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as OnboardingRequestRow | null;
}

/** Active = in-progress statuses (not rejected / onboarded). */
const ACTIVE_STATUSES: OnboardingRequestStatus[] = [
  "interested",
  "contacted",
  "demo_scheduled",
];

export async function findActiveOnboardingRequestByEmail(
  workEmail: string
): Promise<OnboardingRequestRow | null> {
  const email = workEmail.trim().toLowerCase();
  if (!email) return null;
  const { data, error } = await supabaseAdmin
    .from("onboarding_requests")
    .select("*")
    .ilike("work_email", email)
    .in("status", ACTIVE_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as OnboardingRequestRow | null;
}

export async function updateOnboardingRequest(
  id: string,
  patch: { status?: OnboardingRequestStatus; admin_notes?: string | null }
): Promise<OnboardingRequestRow> {
  const { data, error } = await supabaseAdmin
    .from("onboarding_requests")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as OnboardingRequestRow;
}

export async function listPlatformAdminUserIds(): Promise<string[]> {
  const { data: roleRow, error: roleErr } = await supabaseAdmin
    .from("roles")
    .select("id")
    .eq("name", "PLATFORM_ADMIN")
    .maybeSingle();
  if (roleErr) throw roleErr;
  if (!roleRow?.id) return [];

  const { data: userRoles, error: urErr } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role_id", roleRow.id);
  if (urErr) throw urErr;
  return [...new Set((userRoles ?? []).map((r) => r.user_id as string))];
}

export async function insertPlatformNotifications(
  userIds: string[],
  payload: { type: string; title: string; body: string; metadata?: Record<string, unknown> }
): Promise<void> {
  if (userIds.length === 0) return;
  const rows = userIds.map((user_id) => ({
    user_id,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    metadata: payload.metadata ?? {},
  }));
  const { error } = await supabaseAdmin.from("platform_notifications").insert(rows);
  if (error) throw error;
}

export async function listPlatformNotifications(
  userId: string,
  limit: number,
  offset: number
): Promise<{ rows: PlatformNotificationRow[]; total: number }> {
  const { data, error, count } = await supabaseAdmin
    .from("platform_notifications")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return { rows: (data ?? []) as PlatformNotificationRow[], total: count ?? 0 };
}

export async function countUnreadPlatformNotifications(userId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("platform_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) throw error;
  return count ?? 0;
}

export async function markPlatformNotificationRead(
  userId: string,
  notificationId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("platform_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId);
  if (error) throw error;
}

export interface PlatformNotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  read_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
