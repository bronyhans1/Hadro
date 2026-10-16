import { ENV } from "@/lib/env";
import type { ApiError, ApiResponse } from "@/lib/types/api";
import {
  handleSessionExpiry,
  isAuthenticationFailure,
  isStoredTokenExpired,
  SessionExpiredError,
} from "@/lib/auth/sessionExpiry";

const BASE_URL = ENV.NEXT_PUBLIC_API_BASE_URL;

const ACCESS_BLOCK_CODES = new Set([
  "USER_INACTIVE",
  "USER_SUSPENDED",
  "COMPANY_INACTIVE",
  "COMPANY_SUSPENDED",
]);

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status?: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

/**
 * Get the auth token (e.g. from localStorage or cookie). Replace with your auth provider.
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("hadro_token");
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("hadro_token", token);
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("hadro_token");
}

function extractBodyCode(body: unknown): string | undefined {
  if (!body || typeof body !== "object" || !("code" in body)) return undefined;
  const code = (body as { code?: unknown }).code;
  return typeof code === "string" && code ? code : undefined;
}

/**
 * Map non-auth HTTP failures to ApiError — never throw for expected 403/4xx/5xx.
 * Authentication failures still throw SessionExpiredError (redirect to login).
 */
function toSoftHttpError(status: number, message: string, body: unknown): ApiError {
  const code = extractBodyCode(body);
  const accessBlockCode =
    code && ACCESS_BLOCK_CODES.has(code) ? code : undefined;

  let error = message || `Request failed (${status})`;
  if (status === 403) {
    const lower = error.toLowerCase();
    if (
      !message ||
      lower === "forbidden" ||
      lower.includes("insufficient permissions") ||
      lower === `request failed (${status})`
    ) {
      error = "This information isn't available for your role.";
    }
  }

  // Dev: log without stack. Production: suppress expected authorization noise.
  if (process.env.NODE_ENV === "development") {
    console.warn(`[api] HTTP ${status}: ${message}`);
  }

  return {
    success: false,
    error,
    ...(code ? { code } : {}),
    ...(accessBlockCode ? { accessBlockCode } : {}),
  };
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();

  // Proactive recovery when the stored JWT is already past exp (backend 401 remains source of truth).
  if (token && isStoredTokenExpired(token)) {
    handleSessionExpiry();
    throw new SessionExpiredError();
  }

  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (e) {
    // Network failures remain exceptional — callers may use safeApi to soften.
    throw e instanceof Error ? e : new Error("Network request failed");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      typeof data?.error === "string" ? data.error : `Request failed (${res.status})`;

    if (isAuthenticationFailure(res.status, message, data)) {
      handleSessionExpiry();
      throw new SessionExpiredError(message);
    }

    // Authorization + other HTTP errors: soft ApiResponse (never ApiClientError throw).
    return toSoftHttpError(res.status, message, data) as ApiResponse<T>;
  }

  return data as ApiResponse<T>;
}

export const apiClient = {
  get<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return request<T>(path, { ...options, method: "GET" });
  },
  post<T>(path: string, body?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return request<T>(path, { ...options, method: "POST", body: body ? JSON.stringify(body) : undefined });
  },
  patch<T>(path: string, body?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return request<T>(path, { ...options, method: "PATCH", body: body ? JSON.stringify(body) : undefined });
  },
  delete<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return request<T>(path, { ...options, method: "DELETE" });
  },
};
