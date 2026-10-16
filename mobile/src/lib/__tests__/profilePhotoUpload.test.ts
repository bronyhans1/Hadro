import {
  profilePhotoErrorMessageKey,
  profilePhotoUploadRequest,
  resolveProfilePhotoFile,
} from "../profilePhotoFile";

describe("profile photo upload metadata", () => {
  test("keeps a JPEG content type and does not send a blob", () => {
    const resolved = resolveProfilePhotoFile({ mimeType: "image/jpeg", fileName: "portrait.jpg" });
    expect(resolved).toEqual({ mime: "image/jpeg", extension: "jpg" });
    if ("errorCode" in resolved) return;
    const bytes = new Uint8Array([1, 2, 3]).buffer;
    const request = profilePhotoUploadRequest({
      baseUrl: "https://example.supabase.co/",
      objectPath: "profile-photos/user-1.jpg",
      token: "token",
      anonKey: "anon",
      mime: resolved.mime,
      bytes,
    });
    expect(request.headers["Content-Type"]).toBe("image/jpeg");
    expect(request.body).toBe(bytes);
    expect(request.url).toBe(
      "https://example.supabase.co/storage/v1/object/profile-photos/profile-photos/user-1.jpg"
    );
  });

  test("keeps a PNG content type from the picker", () => {
    expect(resolveProfilePhotoFile({ mimeType: "image/png", uri: "file:///photo" })).toEqual({
      mime: "image/png",
      extension: "png",
    });
  });

  test("uses the file extension when the MIME type is missing or octet-stream", () => {
    expect(
      resolveProfilePhotoFile({
        mimeType: null,
        uri: "file:///tmp/avatar.PNG?size=1",
      })
    ).toEqual({ mime: "image/png", extension: "png" });
    expect(
      resolveProfilePhotoFile({
        mimeType: "application/octet-stream",
        fileName: "camera.webp",
      })
    ).toEqual({ mime: "image/webp", extension: "webp" });
  });

  test("rejects an unsupported file instead of assuming JPEG", () => {
    expect(resolveProfilePhotoFile({ mimeType: "image/heic", fileName: "IMG.heic" })).toEqual({
      errorCode: "unsupported",
    });
    expect(resolveProfilePhotoFile({ mimeType: "application/octet-stream", uri: "file:///plain" })).toEqual({
      errorCode: "unsupported",
    });
    expect(profilePhotoErrorMessageKey("unsupported")).toBe("profile.unsupportedPhoto");
    expect(profilePhotoErrorMessageKey("upload_failed")).toBe("profile.photoUploadFailed");
  });
});
