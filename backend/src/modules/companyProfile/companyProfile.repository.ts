import { supabaseAdmin } from "../../config/supabase";

export type CompanyProfileRecord = {
  id: string;
  name: string;
  company_code: string;
  status?: string | null;
  logo_url?: string | null;
  industry?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  street_address?: string | null;
  postal_code?: string | null;
  business_phone?: string | null;
  website?: string | null;
  registration_number?: string | null;
  tax_number?: string | null;
  profile_setup_dismissed_at?: string | null;
  created_at?: string | null;
};

const PROFILE_SELECT =
  "id, name, company_code, status, logo_url, industry, country, region, city, street_address, postal_code, business_phone, website, registration_number, tax_number, profile_setup_dismissed_at, created_at";

export async function getCompanyProfile(
  companyId: string
): Promise<CompanyProfileRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("companies")
    .select(PROFILE_SELECT)
    .eq("id", companyId)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as CompanyProfileRecord | null;
}

export type CompanyProfilePatch = {
  name?: string;
  logo_url?: string | null;
  industry?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  street_address?: string | null;
  postal_code?: string | null;
  business_phone?: string | null;
  website?: string | null;
  registration_number?: string | null;
  tax_number?: string | null;
};

export async function updateCompanyProfile(
  companyId: string,
  patch: CompanyProfilePatch
): Promise<CompanyProfileRecord | null> {
  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) updates[key] = value;
  }
  if (Object.keys(updates).length === 0) {
    return getCompanyProfile(companyId);
  }

  const { data, error } = await supabaseAdmin
    .from("companies")
    .update(updates)
    .eq("id", companyId)
    .select(PROFILE_SELECT)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as CompanyProfileRecord | null;
}

export async function dismissCompanyProfileSetup(
  companyId: string
): Promise<CompanyProfileRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("companies")
    .update({ profile_setup_dismissed_at: new Date().toISOString() })
    .eq("id", companyId)
    .select(PROFILE_SELECT)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as CompanyProfileRecord | null;
}

export async function listCompaniesForDirectory(): Promise<CompanyProfileRecord[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("companies")
      .select(PROFILE_SELECT)
      .order("name", { ascending: true });
    if (error) throw error;
    return (data ?? []) as CompanyProfileRecord[];
  } catch {
    const { data, error } = await supabaseAdmin
      .from("companies")
      .select("id, name, company_code, status, created_at")
      .order("name", { ascending: true });
    if (error) throw error;
    return (data ?? []) as CompanyProfileRecord[];
  }
}

export async function countUsersByCompanyIds(
  companyIds: string[]
): Promise<Map<string, number>> {
  const unique = [...new Set(companyIds.filter(Boolean))];
  const out = new Map<string, number>();
  if (unique.length === 0) return out;

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("company_id")
    .in("company_id", unique);

  if (error) throw error;
  for (const row of data ?? []) {
    const id = (row as { company_id?: string }).company_id;
    if (!id) continue;
    out.set(id, (out.get(id) ?? 0) + 1);
  }
  return out;
}

export async function latestAuditAtByCompanyIds(
  companyIds: string[]
): Promise<Map<string, string>> {
  const unique = [...new Set(companyIds.filter(Boolean))];
  const out = new Map<string, string>();
  if (unique.length === 0) return out;

  // Fetch recent audit rows and keep max per company (bounded for platform scale).
  const { data, error } = await supabaseAdmin
    .from("audit_logs")
    .select("company_id, created_at")
    .in("company_id", unique)
    .order("created_at", { ascending: false })
    .limit(Math.min(unique.length * 20, 2000));

  if (error) throw error;
  for (const row of data ?? []) {
    const id = (row as { company_id?: string }).company_id;
    const at = (row as { created_at?: string }).created_at;
    if (!id || !at || out.has(id)) continue;
    out.set(id, at);
  }
  return out;
}

export type CompanyAdminInfo = {
  name: string;
  email: string;
};

export async function listPrimaryAdminsByCompany(): Promise<Map<string, CompanyAdminInfo>> {
  const { data: roles, error: roleErr } = await supabaseAdmin
    .from("roles")
    .select("id")
    .eq("name", "admin")
    .maybeSingle();
  if (roleErr) throw roleErr;
  const adminRoleId = (roles as { id?: string } | null)?.id;
  if (!adminRoleId) return new Map();

  const { data: ur, error: urErr } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role_id", adminRoleId);
  if (urErr) throw urErr;
  const userIds = (ur ?? [])
    .map((r) => (r as { user_id?: string }).user_id)
    .filter(Boolean) as string[];
  if (userIds.length === 0) return new Map();

  const { data: users, error: usersErr } = await supabaseAdmin
    .from("users")
    .select("id, email, first_name, last_name, company_id")
    .in("id", userIds);
  if (usersErr) throw usersErr;

  const out = new Map<string, CompanyAdminInfo>();
  for (const u of users ?? []) {
    const row = u as {
      company_id?: string | null;
      email?: string | null;
      first_name?: string | null;
      last_name?: string | null;
    };
    if (!row.company_id || out.has(row.company_id)) continue;
    const name =
      [row.first_name, row.last_name].filter(Boolean).join(" ").trim() ||
      row.email ||
      "Administrator";
    out.set(row.company_id, {
      name,
      email: row.email ?? "",
    });
  }
  return out;
}
