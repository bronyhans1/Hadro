import type { ApiResponse } from "@/lib/types/api";
import { ApiClientError } from "@/lib/api/client";
import { SessionExpiredError } from "@/lib/auth/sessionExpiry";

/**
 * Wraps an API call so unexpected failures (network, legacy ApiClientError)
 * become `{ success: false }` instead of throwing.
 *
 * HTTP authorization failures (403) are already soft-returned by apiClient.
 * Session expiry still throws so global auth recovery runs.
 */
export async function safeApi<T>(promise: Promise<ApiResponse<T>>): Promise<ApiResponse<T>> {
  try {
    return await promise;
  } catch (e) {
    if (e instanceof SessionExpiredError) {
      throw e;
    }
    if (e instanceof ApiClientError) {
      const status = e.status;
      const forbidden = status === 403;
      if (process.env.NODE_ENV === "development") {
        console.warn(`[safeApi] ${forbidden ? "403" : "error"}:`, e.message);
      }
      return {
        success: false,
        error: forbidden
          ? "This information isn't available for your role."
          : e.message || "Unable to load this data.",
      };
    }
    if (process.env.NODE_ENV === "development") {
      console.warn("[safeApi] unexpected:", e instanceof Error ? e.message : e);
    }
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unable to load this data.",
    };
  }
}
