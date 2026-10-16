export const PROFILE_PHOTO_MIME = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;

export type ProfilePhotoMime = (typeof PROFILE_PHOTO_MIME)[keyof typeof PROFILE_PHOTO_MIME];
export type ProfilePhotoExtension = keyof typeof PROFILE_PHOTO_MIME;

export type ProfilePhotoUploadErrorCode =
  | "not_signed_in"
  | "not_configured"
  | "unsupported"
  | "upload_failed";

const EXTENSION_BY_MIME: Record<ProfilePhotoMime, ProfilePhotoExtension> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Trust only image types the profile bucket accepts. octet-stream is not an image type. */
export function mimeFromProfilePhotoHint(raw: string | null | undefined): ProfilePhotoMime | null {
  if (!raw) return null;
  const value = raw.split(";")[0]?.trim().toLowerCase();
  if (value === "image/jpg" || value === "image/jpeg" || value === "image/pjpeg") {
    return "image/jpeg";
  }
  if (value === "image/png" || value === "image/webp") return value;
  return null;
}

export function extensionFromProfilePhotoName(name: string | null | undefined): string | null {
  if (!name) return null;
  const clean = name.split("?")[0]?.split("#")[0] ?? "";
  const base = clean.split("/").pop() ?? clean;
  const dot = base.lastIndexOf(".");
  if (dot <= 0 || dot === base.length - 1) return null;
  return base.slice(dot + 1).toLowerCase();
}

function mimeFromExtension(extension: string | null): ProfilePhotoMime | null {
  if (extension === "jpg" || extension === "jpeg" || extension === "jpe") return "image/jpeg";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return null;
}

/**
 * Prefer a real image MIME type. When the picker omits one, or reports
 * application/octet-stream, use the file name or URI extension.
 */
export function resolveProfilePhotoFile(input: {
  mimeType?: string | null;
  fileName?: string | null;
  uri?: string | null;
}): { mime: ProfilePhotoMime; extension: ProfilePhotoExtension } | { errorCode: "unsupported" } {
  const fromMime = mimeFromProfilePhotoHint(input.mimeType);
  const fromName =
    mimeFromExtension(extensionFromProfilePhotoName(input.fileName)) ??
    mimeFromExtension(extensionFromProfilePhotoName(input.uri));
  const mime = fromMime ?? fromName;
  if (!mime) return { errorCode: "unsupported" };
  return { mime, extension: EXTENSION_BY_MIME[mime] };
}

export function profilePhotoErrorMessageKey(code: ProfilePhotoUploadErrorCode): string {
  switch (code) {
    case "not_configured":
      return "profile.photoNotConfigured";
    case "unsupported":
      return "profile.unsupportedPhoto";
    case "not_signed_in":
    case "upload_failed":
      return "profile.photoUploadFailed";
  }
}

export function profilePhotoUploadRequest(params: {
  baseUrl: string;
  objectPath: string;
  token: string;
  anonKey: string;
  mime: ProfilePhotoMime;
  bytes: ArrayBuffer;
}): { url: string; headers: Record<string, string>; body: ArrayBuffer } {
  const base = params.baseUrl.replace(/\/$/, "");
  return {
    url: `${base}/storage/v1/object/profile-photos/${params.objectPath}`,
    headers: {
      Authorization: `Bearer ${params.token}`,
      apikey: params.anonKey,
      "Content-Type": params.mime,
      "x-upsert": "true",
    },
    body: params.bytes,
  };
}
