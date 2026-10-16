/**
 * Company-owned Supabase Storage assets — path helpers + registered buckets.
 * One source of truth for folder layout: `<bucket>/<company_id>/…`
 */

/** Buckets that may hold per-company folders. Register future assets here. */
export const REGISTERED_COMPANY_ASSET_BUCKETS = [
  "company-logos",
  "company-banners",
  "company-documents",
  "company-branding",
  "company-certificates",
  "company-letterheads",
  "company-stamps",
] as const;

export type RegisteredCompanyAssetBucket =
  (typeof REGISTERED_COMPANY_ASSET_BUCKETS)[number];

/** Canonical logo object filename (extension supplied by caller). */
export const COMPANY_LOGO_BASENAME = "logo";

/**
 * Company folder prefix inside a bucket (no trailing slash).
 * Used as the Storage `list` path and as the parent of object keys.
 */
export function getCompanyAssetFolder(companyId: string): string {
  return companyId.trim();
}

/**
 * Object key for an asset under a company folder.
 * Example: `1f8d3a72/banner.png`
 */
export function getCompanyAssetObjectPath(
  companyId: string,
  fileName: string
): string {
  const folder = getCompanyAssetFolder(companyId);
  const name = fileName.replace(/^\/+/, "");
  return `${folder}/${name}`;
}

/**
 * Canonical company logo object key: `<company_id>/logo.<ext>`
 */
export function getCompanyLogoPath(companyId: string, ext: string): string {
  const safe = ext.trim().toLowerCase().replace(/^\./, "");
  const normalized = safe === "jpeg" ? "jpg" : safe;
  return getCompanyAssetObjectPath(
    companyId,
    `${COMPANY_LOGO_BASENAME}.${normalized || "png"}`
  );
}
