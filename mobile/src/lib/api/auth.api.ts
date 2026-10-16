import { apiClient, ApiClientError } from "./client";
import type { ApiResponse } from "@/types/api";
import type { AuthUser } from "@/types/auth";
import type { MeResponse } from "@/types/me";
import { mapMeToAuthUser, unwrapMeResponse } from "@/lib/auth/mapMeToAuthUser";
import { translate } from "@/lib/i18n";

export type { MeResponse } from "@/types/me";

export interface UpdateProfileInput {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string | null;
  gender?: "male" | "female" | "other" | "prefer_not_to_say" | null;
  phone_number?: string | null;
  profile_photo_url?: string | null;
  theme_preference?: "light" | "dark" | "system";
  language?: "en" | "fr" | "pt" | "ar" | "sw" | "es";
  department_id?: string | null;
}

/** GET /api/auth/me — backend returns unwrapped MeResponse (or wrapped success envelope). */
export async function getMe(): Promise<ApiResponse<AuthUser>> {
  try {
    const raw = (await apiClient.get("/api/auth/me")) as unknown;
    if (
      raw &&
      typeof raw === "object" &&
      "success" in raw &&
      (raw as ApiResponse<AuthUser>).success === false
    ) {
      return raw as ApiResponse<AuthUser>;
    }

    const me = unwrapMeResponse(raw);
    if (!me?.id) {
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        console.warn("[auth/me] unparseable payload keys", raw && typeof raw === "object" ? Object.keys(raw as object) : raw);
      }
      return { success: false, error: translate("auth.unableToReadAccount") };
    }

    return { success: true, data: mapMeToAuthUser(me) };
  } catch (e) {
    if (e instanceof ApiClientError && e.status === 403) {
      const body = e.body as { code?: string; error?: string } | undefined;
      const codes = new Set([
        "USER_INACTIVE",
        "USER_SUSPENDED",
        "COMPANY_INACTIVE",
        "COMPANY_SUSPENDED",
      ]);
      if (body?.code && codes.has(body.code)) {
        return {
          success: false,
          error: typeof body.error === "string" ? body.error : translate("auth.accessDenied"),
          accessBlockCode: body.code,
        };
      }
    }
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.warn("[auth/me]", e);
    }
    if (e instanceof ApiClientError) {
      return { success: false, error: e.message };
    }
    return {
      success: false,
      error: e instanceof Error ? e.message : translate("auth.unableToLoadAccountRetry"),
    };
  }
}

export async function updateMyProfile(input: UpdateProfileInput): Promise<ApiResponse<AuthUser>> {
  try {
    const raw = (await apiClient.patch("/api/auth/profile", input)) as unknown;
    if (
      raw &&
      typeof raw === "object" &&
      "success" in raw &&
      (raw as ApiResponse<AuthUser>).success === false
    ) {
      return raw as ApiResponse<AuthUser>;
    }
    const me = unwrapMeResponse(raw);
    if (!me?.id) {
      return { success: false, error: "Unauthorized" };
    }
    return { success: true, data: mapMeToAuthUser(me) };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update profile" };
  }
}

export async function markPasswordChanged(): Promise<ApiResponse<{ success: true }>> {
  try {
    return await apiClient.post<{ success: true }>("/api/auth/password-changed");
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update password status" };
  }
}
