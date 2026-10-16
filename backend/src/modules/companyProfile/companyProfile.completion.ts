/**
 * Company profile field helpers — completion % and location display.
 * Pure functions; no DB access.
 */

export const COMPANY_PROFILE_TRACKED_FIELDS = [
  "logo_url",
  "industry",
  "country",
  "region",
  "city",
  "street_address",
  "business_phone",
  "website",
  "registration_number",
  "tax_number",
] as const;

export type CompanyProfileTrackedField = (typeof COMPANY_PROFILE_TRACKED_FIELDS)[number];

export type CompanyProfileFields = {
  name?: string | null;
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

function filled(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function companyProfileMissingFields(
  profile: CompanyProfileFields
): CompanyProfileTrackedField[] {
  return COMPANY_PROFILE_TRACKED_FIELDS.filter((key) => !filled(profile[key]));
}

export function companyProfileCompletionPercent(profile: CompanyProfileFields): number {
  const total = COMPANY_PROFILE_TRACKED_FIELDS.length;
  const missing = companyProfileMissingFields(profile).length;
  const complete = total - missing;
  return Math.round((complete / total) * 100);
}

/** Best available location hierarchy for directory display. */
export function formatCompanyLocation(profile: {
  city?: string | null;
  region?: string | null;
  country?: string | null;
}): string {
  const parts = [profile.city, profile.region, profile.country]
    .map((p) => (typeof p === "string" ? p.trim() : ""))
    .filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

/** Initials placeholder when no logo (e.g. "SH" for SEDVIS Hotel). */
export function companyInitials(name: string | null | undefined): string {
  const cleaned = (name ?? "").trim().replace(/\s+/g, " ");
  if (!cleaned) return "?";
  const words = cleaned.split(" ").filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}
