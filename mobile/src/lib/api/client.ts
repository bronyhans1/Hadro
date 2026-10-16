import { getPersistentItem, setPersistentItem, deletePersistentItem } from "@/lib/persistentStorage";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { ENV } from "@/lib/env";
import { resolveApiBaseUrl } from "@/lib/api/apiBaseUrl";
import type { ApiResponse } from "@/types/api";

const BASE_URL = resolveApiBaseUrl(ENV.EXPO_PUBLIC_API_BASE_URL, {
  platform: Platform.OS,
  packagerHostUri: Constants.expoConfig?.hostUri ?? null,
});
const TOKEN_KEY = "hadro_token";
const REFRESH_TOKEN_KEY = "hadro_refresh_token";
const REQUEST_TIMEOUT_MS = 20_000;

if (typeof __DEV__ !== "undefined" && __DEV__) {
  console.log("[api] base URL", BASE_URL, "(configured:", ENV.EXPO_PUBLIC_API_BASE_URL, ")");
}

export async function getAuthToken(): Promise<string | null> {
  return getPersistentItem(TOKEN_KEY);
}

export async function setAuthToken(token: string): Promise<void> {
  await setPersistentItem(TOKEN_KEY, token);
}

export async function getRefreshToken(): Promise<string | null> {
  return getPersistentItem(REFRESH_TOKEN_KEY);
}

export async function setAuthSession(
  accessToken: string,
  refreshToken: string | null
): Promise<void> {
  await setPersistentItem(TOKEN_KEY, accessToken);
  if (refreshToken) {
    await setPersistentItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    await deletePersistentItem(REFRESH_TOKEN_KEY);
  }
}

export async function clearAuthToken(): Promise<void> {
  await deletePersistentItem(TOKEN_KEY);
  await deletePersistentItem(REFRESH_TOKEN_KEY);
}

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

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const token = await getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.log(`[api] ${options.method ?? "GET"} ${url}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, { ...options, headers, signal: controller.signal });
  } catch (err) {
    const aborted =
      (err instanceof Error && err.name === "AbortError") ||
      (typeof err === "object" && err !== null && "name" in err && (err as { name: string }).name === "AbortError");
    const hint = aborted
      ? `HADRO API timed out after ${REQUEST_TIMEOUT_MS / 1000}s (${url}). Check that the backend is running and the device can reach this host.`
      : `Cannot reach the HADRO API at ${url}. Physical devices cannot use localhost or 127.x.x.x — use the computer's LAN IP.`;
    throw new ApiClientError(hint, undefined, err);
  } finally {
    clearTimeout(timeout);
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      typeof (data as { error?: string })?.error === "string"
        ? (data as { error: string }).error
        : `Request failed (${res.status})`;
    throw new ApiClientError(message, res.status, data);
  }

  return data as ApiResponse<T>;
}

export const apiClient = {
  get<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return request<T>(path, { ...options, method: "GET" });
  },
  post<T>(path: string, body?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return request<T>(path, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },
  patch<T>(path: string, body?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return request<T>(path, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  },
  delete<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return request<T>(path, { ...options, method: "DELETE" });
  },
};
