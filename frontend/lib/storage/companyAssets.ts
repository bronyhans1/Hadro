/**
 * Generic company asset storage helpers (logos first; reusable for banners, letterheads, etc.).
 * Bucket layout: `<bucket>/<company_id>/<canonical-filename>`.
 *
 * Path helpers are the single source of truth — prefer getCompanyLogoPath / getCompanyAssetFolder.
 */

import { supabase } from "@/lib/supabase";

/** Registered company asset buckets — create in Supabase when needed. */
export const COMPANY_ASSET_BUCKETS = {
  logos: "company-logos",
  documents: "company-documents",
  banners: "company-banners",
  branding: "company-branding",
  certificates: "company-certificates",
  letterheads: "company-letterheads",
  stamps: "company-stamps",
} as const;

export type CompanyAssetBucket = (typeof COMPANY_ASSET_BUCKETS)[keyof typeof COMPANY_ASSET_BUCKETS];

/** Ordered list for cleanup / discovery (mirrors backend registry). */
export const REGISTERED_COMPANY_ASSET_BUCKETS: readonly CompanyAssetBucket[] = [
  COMPANY_ASSET_BUCKETS.logos,
  COMPANY_ASSET_BUCKETS.banners,
  COMPANY_ASSET_BUCKETS.documents,
  COMPANY_ASSET_BUCKETS.branding,
  COMPANY_ASSET_BUCKETS.certificates,
  COMPANY_ASSET_BUCKETS.letterheads,
  COMPANY_ASSET_BUCKETS.stamps,
];

export const COMPANY_LOGO_MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export const COMPANY_LOGO_ACCEPT =
  "image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg";

const LOGO_MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

export type LogoValidationOk = { ok: true; ext: string; contentType: string };
export type LogoValidationErr = { ok: false; error: string };
export type LogoValidationResult = LogoValidationOk | LogoValidationErr;

/** Company folder prefix inside a bucket (no trailing slash). */
export function getCompanyAssetFolder(companyId: string): string {
  return companyId.trim();
}

/** Object key under a company folder: `<company_id>/<fileName>`. */
export function getCompanyAssetObjectPath(companyId: string, fileName: string): string {
  return `${getCompanyAssetFolder(companyId)}/${fileName.replace(/^\/+/, "")}`;
}

/** Canonical logo key: `<company_id>/logo.<ext>`. */
export function getCompanyLogoPath(companyId: string, ext: string): string {
  const safeExt = normalizeLogoExt(ext) ?? "png";
  return getCompanyAssetObjectPath(companyId, `logo.${safeExt}`);
}

/** @deprecated Prefer getCompanyLogoPath */
export function buildCompanyLogoObjectPath(companyId: string, ext: string): string {
  return getCompanyLogoPath(companyId, ext);
}

/** @deprecated Prefer getCompanyAssetObjectPath */
export function buildCompanyAssetObjectPath(companyId: string, fileName: string): string {
  return getCompanyAssetObjectPath(companyId, fileName);
}

export function normalizeLogoExt(raw: string): string | null {
  const e = raw.trim().toLowerCase().replace(/^\./, "");
  if (e === "jpeg") return "jpg";
  if (e === "png" || e === "jpg" || e === "webp" || e === "svg") return e;
  return null;
}

export function validateCompanyLogoFile(file: File): LogoValidationResult {
  if (!file || !(file instanceof File)) {
    return { ok: false, error: "Please choose a logo file." };
  }

  if (file.size > COMPANY_LOGO_MAX_BYTES) {
    return { ok: false, error: "Company logos must be 2 MB or smaller." };
  }

  const nameExt = normalizeLogoExt(file.name.includes(".") ? file.name.split(".").pop() || "" : "");
  const mimeExt = file.type ? LOGO_MIME_TO_EXT[file.type.toLowerCase()] ?? null : null;

  if (file.type && !LOGO_MIME_TO_EXT[file.type.toLowerCase()] && !nameExt) {
    return {
      ok: false,
      error: "Unsupported format. Use PNG, WebP, JPEG, or SVG.",
    };
  }

  const ext = mimeExt ?? nameExt;
  if (!ext) {
    return {
      ok: false,
      error: "Unsupported format. Use PNG, WebP, JPEG, or SVG.",
    };
  }

  if (file.type && !LOGO_MIME_TO_EXT[file.type.toLowerCase()] && !file.type.startsWith("image/")) {
    return {
      ok: false,
      error: "Unsupported format. Use PNG, WebP, JPEG, or SVG.",
    };
  }

  const contentType =
    file.type && LOGO_MIME_TO_EXT[file.type.toLowerCase()]
      ? file.type
      : ext === "svg"
        ? "image/svg+xml"
        : ext === "jpg"
          ? "image/jpeg"
          : `image/${ext}`;

  return { ok: true, ext, contentType };
}

/** Append or replace `v=` so browsers do not keep a stale logo after overwrite. */
export function withCacheBust(publicUrl: string, version = Date.now()): string {
  try {
    const u = new URL(publicUrl);
    u.searchParams.set("v", String(version));
    return u.toString();
  } catch {
    const base = publicUrl.split("?")[0];
    return `${base}?v=${version}`;
  }
}

const LOGO_VARIANT_EXTS = ["png", "jpg", "jpeg", "webp", "svg"] as const;

async function removeOtherLogoVariants(companyId: string, keepExt: string): Promise<void> {
  if (!supabase) return;
  const keep = normalizeLogoExt(keepExt) ?? keepExt;
  const paths = LOGO_VARIANT_EXTS.filter((e) => normalizeLogoExt(e) !== keep).map((e) =>
    getCompanyLogoPath(companyId, e)
  );
  const unique = Array.from(new Set(paths));
  await supabase.storage.from(COMPANY_ASSET_BUCKETS.logos).remove(unique);
}

export type UploadCompanyLogoResult =
  | { ok: true; publicUrl: string; objectPath: string }
  | { ok: false; error: string };

/**
 * Upload/replace the canonical company logo at `company-logos/<company_id>/logo.<ext>`.
 * Overwrites the active logo; removes other extension variants; returns a cache-busted public URL.
 */
export async function uploadCompanyLogo(
  companyId: string,
  file: File
): Promise<UploadCompanyLogoResult> {
  if (!supabase) {
    return { ok: false, error: "Cannot upload logo: storage is not configured." };
  }
  const id = companyId?.trim();
  if (!id) {
    return { ok: false, error: "Company id is required to upload a logo." };
  }

  const validation = validateCompanyLogoFile(file);
  if (!validation.ok) return validation;

  const objectPath = getCompanyLogoPath(id, validation.ext);
  const { error: upErr } = await supabase.storage
    .from(COMPANY_ASSET_BUCKETS.logos)
    .upload(objectPath, file, {
      upsert: true,
      contentType: validation.contentType,
      cacheControl: "3600",
    });

  if (upErr) {
    return { ok: false, error: upErr.message || "Logo upload failed." };
  }

  try {
    await removeOtherLogoVariants(id, validation.ext);
  } catch {
    // non-fatal
  }

  const { data } = supabase.storage.from(COMPANY_ASSET_BUCKETS.logos).getPublicUrl(objectPath);
  const publicUrl = withCacheBust(data.publicUrl, Date.now());
  return { ok: true, publicUrl, objectPath };
}

/**
 * Generic upload for future company assets (documents, banners, etc.).
 * Caller supplies bucket + object file name under the company folder.
 */
export async function uploadCompanyAsset(params: {
  bucket: CompanyAssetBucket;
  companyId: string;
  fileName: string;
  file: File;
  contentType?: string;
  maxBytes?: number;
}): Promise<UploadCompanyLogoResult> {
  if (!supabase) {
    return { ok: false, error: "Cannot upload: storage is not configured." };
  }
  const id = params.companyId.trim();
  if (!id) return { ok: false, error: "Company id is required." };
  if (params.maxBytes != null && params.file.size > params.maxBytes) {
    return {
      ok: false,
      error: `File must be ${(params.maxBytes / (1024 * 1024)).toFixed(0)} MB or smaller.`,
    };
  }
  const objectPath = getCompanyAssetObjectPath(id, params.fileName);
  const { error: upErr } = await supabase.storage.from(params.bucket).upload(objectPath, params.file, {
    upsert: true,
    contentType: params.contentType || params.file.type || "application/octet-stream",
    cacheControl: "3600",
  });
  if (upErr) return { ok: false, error: upErr.message || "Upload failed." };
  const { data } = supabase.storage.from(params.bucket).getPublicUrl(objectPath);
  return { ok: true, publicUrl: withCacheBust(data.publicUrl), objectPath };
}
