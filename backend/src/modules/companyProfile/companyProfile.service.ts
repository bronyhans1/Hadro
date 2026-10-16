import * as repo from "./companyProfile.repository";
import {
  companyInitials,
  companyProfileCompletionPercent,
  companyProfileMissingFields,
  formatCompanyLocation,
  type CompanyProfileFields,
} from "./companyProfile.completion";
import * as companyPolicyService from "../companyPolicy/companyPolicy.service";

export type CompanyProfileDto = {
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

function trimOrNull(raw: unknown): string | null {
  if (raw === null) return null;
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  return t ? t : null;
}

function toDto(
  row: repo.CompanyProfileRecord,
  businessTimezone: string
): CompanyProfileDto {
  const fields: CompanyProfileFields = {
    name: row.name,
    logo_url: row.logo_url,
    industry: row.industry,
    country: row.country,
    region: row.region,
    city: row.city,
    street_address: row.street_address,
    postal_code: row.postal_code,
    business_phone: row.business_phone,
    website: row.website,
    registration_number: row.registration_number,
    tax_number: row.tax_number,
  };
  return {
    id: row.id,
    name: row.name,
    company_code: row.company_code,
    logo_url: row.logo_url ?? null,
    industry: row.industry ?? null,
    country: row.country ?? null,
    region: row.region ?? null,
    city: row.city ?? null,
    street_address: row.street_address ?? null,
    postal_code: row.postal_code ?? null,
    business_phone: row.business_phone ?? null,
    website: row.website ?? null,
    registration_number: row.registration_number ?? null,
    tax_number: row.tax_number ?? null,
    business_timezone: businessTimezone,
    profile_setup_dismissed_at: row.profile_setup_dismissed_at ?? null,
    location_label: formatCompanyLocation(row),
    initials: companyInitials(row.name),
    completion_percent: companyProfileCompletionPercent(fields),
    missing_fields: companyProfileMissingFields(fields),
  };
}

export async function getCompanyProfile(
  companyId: string
): Promise<{ data: CompanyProfileDto | null; error?: string }> {
  const row = await repo.getCompanyProfile(companyId);
  if (!row) return { data: null, error: "Company not found" };
  const policy = await companyPolicyService.getPolicy(companyId);
  const tz =
    (policy as { business_timezone?: string } | null)?.business_timezone ??
    "Africa/Accra";
  return { data: toDto(row, tz) };
}

export async function updateCompanyProfile(
  companyId: string,
  body: Record<string, unknown>,
  options?: { allowRename?: boolean }
): Promise<{ data: CompanyProfileDto | null; error?: string }> {
  const patch: repo.CompanyProfilePatch = {};

  if (options?.allowRename && typeof body.name === "string" && body.name.trim()) {
    patch.name = body.name.trim();
  }

  const nullableKeys = [
    "logo_url",
    "industry",
    "country",
    "region",
    "city",
    "street_address",
    "postal_code",
    "business_phone",
    "website",
    "registration_number",
    "tax_number",
  ] as const;

  for (const key of nullableKeys) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      patch[key] = trimOrNull(body[key]);
    }
  }

  if (Object.keys(patch).length === 0) {
    return { data: null, error: "No profile fields to update" };
  }

  // Basic website sanity (optional field)
  if (patch.website && !/^https?:\/\//i.test(patch.website) && patch.website.includes(".")) {
    patch.website = `https://${patch.website}`;
  }

  // Soft path check: our storage URLs must live under this company's folder
  if (patch.logo_url) {
    const url = patch.logo_url;
    if (url.includes("/company-logos/") && !url.includes(`/company-logos/${companyId}/`)) {
      return { data: null, error: "logo_url must reference this company's logo folder" };
    }
  }

  const row = await repo.updateCompanyProfile(companyId, patch);
  if (!row) return { data: null, error: "Company not found" };

  const policy = await companyPolicyService.getPolicy(companyId);
  const tz =
    (policy as { business_timezone?: string } | null)?.business_timezone ??
    "Africa/Accra";
  return { data: toDto(row, tz) };
}

export async function dismissCompanyProfileSetup(
  companyId: string
): Promise<{ data: CompanyProfileDto | null; error?: string }> {
  const row = await repo.dismissCompanyProfileSetup(companyId);
  if (!row) return { data: null, error: "Company not found" };
  const policy = await companyPolicyService.getPolicy(companyId);
  const tz =
    (policy as { business_timezone?: string } | null)?.business_timezone ??
    "Africa/Accra";
  return { data: toDto(row, tz) };
}

export type CompanyDirectoryItem = {
  company_id: string;
  company_name: string;
  company_code: string;
  logo_url: string | null;
  initials: string;
  industry: string | null;
  location_label: string;
  plan: string;
  employees_count: number;
  branches_count: number;
  branch_limit: number | null;
  administrator_name: string | null;
  administrator_email: string | null;
  admin_emails: string[];
  joined_at: string | null;
  last_activity_at: string | null;
  status: "active" | "inactive" | "suspended";
};

export async function buildCompanyDirectory(params: {
  branchCounts: Map<string, number>;
  branchLimits: Map<string, number | null>;
  adminEmails: Map<string, string[]>;
}): Promise<CompanyDirectoryItem[]> {
  const companies = await repo.listCompaniesForDirectory();
  const ids = companies.map((c) => c.id);
  const [employees, lastActivity, admins] = await Promise.all([
    repo.countUsersByCompanyIds(ids),
    repo.latestAuditAtByCompanyIds(ids),
    repo.listPrimaryAdminsByCompany(),
  ]);

  return companies.map((c) => {
    const st = (c.status ?? "active").toLowerCase();
    const status =
      st === "inactive" || st === "suspended" ? st : ("active" as const);
    const admin = admins.get(c.id);
    const emails = params.adminEmails.get(c.id) ?? [];
    return {
      company_id: c.id,
      company_name: c.name,
      company_code: c.company_code,
      logo_url: c.logo_url ?? null,
      initials: companyInitials(c.name),
      industry: c.industry ?? null,
      location_label: formatCompanyLocation(c),
      plan: "Standard",
      employees_count: employees.get(c.id) ?? 0,
      branches_count: params.branchCounts.get(c.id) ?? 0,
      branch_limit: params.branchLimits.get(c.id) ?? null,
      administrator_name: admin?.name ?? null,
      administrator_email: admin?.email ?? emails[0] ?? null,
      admin_emails: emails,
      joined_at: c.created_at ?? null,
      last_activity_at: lastActivity.get(c.id) ?? c.created_at ?? null,
      status,
    };
  });
}
