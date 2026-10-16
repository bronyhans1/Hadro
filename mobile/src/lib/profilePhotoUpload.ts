import { getAuthToken } from "@/lib/api/client";
import { ENV } from "@/lib/env";
import {
  profilePhotoUploadRequest,
  resolveProfilePhotoFile,
  type ProfilePhotoUploadErrorCode,
} from "@/lib/profilePhotoFile";

export {
  profilePhotoErrorMessageKey,
  resolveProfilePhotoFile,
  type ProfilePhotoUploadErrorCode,
} from "@/lib/profilePhotoFile";

/**
 * Upload a local image URI to Supabase Storage.
 * The body is raw bytes with an explicit image Content-Type. A Blob body would
 * replace that header with the file response type, often application/octet-stream.
 */
export async function uploadProfilePhotoFromUri(
  localUri: string,
  userId: string,
  meta?: { mimeType?: string | null; fileName?: string | null }
): Promise<{ publicUrl: string } | { errorCode: ProfilePhotoUploadErrorCode }> {
  const token = await getAuthToken();
  const base = ENV.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anon = ENV.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!token) return { errorCode: "not_signed_in" };
  if (!base || !anon) return { errorCode: "not_configured" };

  const resolved = resolveProfilePhotoFile({
    mimeType: meta?.mimeType,
    fileName: meta?.fileName,
    uri: localUri,
  });
  if ("errorCode" in resolved) return resolved;

  const fileResponse = await fetch(localUri);
  if (!fileResponse.ok) return { errorCode: "upload_failed" };
  const bytes = await fileResponse.arrayBuffer();
  if (bytes.byteLength === 0) return { errorCode: "upload_failed" };

  const objectPath = `profile-photos/${userId}-${Date.now()}.${resolved.extension}`;
  const request = profilePhotoUploadRequest({
    baseUrl: base,
    objectPath,
    token,
    anonKey: anon,
    mime: resolved.mime,
    bytes,
  });

  const res = await fetch(request.url, {
    method: "POST",
    headers: request.headers,
    body: request.body,
  });

  if (!res.ok) return { errorCode: "upload_failed" };

  const publicUrl = `${base}/storage/v1/object/public/profile-photos/${objectPath}`;
  return { publicUrl };
}
