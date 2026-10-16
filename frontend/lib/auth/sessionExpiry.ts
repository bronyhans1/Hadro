/**
 * Shared frontend session-expiry recovery (Phase UX.2A).
 * Does not change JWT issuance, login, or backend auth — only client recovery UX.
 */

export const SESSION_EXPIRED_EVENT = "hadro:session-expired";
export const SESSION_EXPIRED_REASON = "session_expired";
export const LOGIN_SESSION_EXPIRED_PATH = `/login?reason=${SESSION_EXPIRED_REASON}`;

const TOKEN_KEY = "hadro_token";
const HANDLING_KEY = "hadro_session_expiry_handling";

const ACCESS_BLOCK_CODES = new Set([
  "USER_INACTIVE",
  "USER_SUSPENDED",
  "COMPANY_INACTIVE",
  "COMPANY_SUSPENDED",
]);

const AUTH_FAILURE_MESSAGE_RE =
  /invalid\s+token|token\s+expired|jwt\s+expired|jwt\s+malformed|authentication\s+failed|unauthorized\s+access|not\s+authenticated|session\s+expired|expired\s+token|no\s+authorization|missing\s+authorization|bearer\s+token/i;

export class SessionExpiredError extends Error {
  readonly status = 401;

  constructor(message = "Session expired") {
    super(message);
    this.name = "SessionExpiredError";
  }
}

export function isSessionExpiredError(error: unknown): boolean {
  return error instanceof SessionExpiredError;
}

function clearStoredAuthToken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function clearSessionExpiryHandlingFlag(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(HANDLING_KEY);
  } catch {
    /* ignore */
  }
}

function markHandling(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(HANDLING_KEY) === "1") return false;
    sessionStorage.setItem(HANDLING_KEY, "1");
    return true;
  } catch {
    return true;
  }
}

function isAlreadyOnLogin(): boolean {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  return path === "/login";
}

/**
 * True when the HTTP response indicates an expired/invalid authentication session.
 * Account/company access blocks (403 + known codes) are intentionally excluded.
 */
export function isAuthenticationFailure(
  status: number,
  message?: string | null,
  body?: unknown
): boolean {
  const code =
    body && typeof body === "object" && body !== null && "code" in body
      ? String((body as { code?: unknown }).code ?? "")
      : "";
  if (code && ACCESS_BLOCK_CODES.has(code)) return false;

  if (status === 401) return true;

  const msg = typeof message === "string" ? message : "";
  if (!msg) return false;

  // Only treat non-401 as auth failure when the message clearly indicates token/session issues
  if (status === 403 || status === 400) {
    return AUTH_FAILURE_MESSAGE_RE.test(msg);
  }

  return AUTH_FAILURE_MESSAGE_RE.test(msg) && /unauthorized|token|jwt|session/i.test(msg);
}

/** Optional proactive check: decode JWT `exp` without verifying signature. */
export function isStoredTokenExpired(token: string | null | undefined): boolean {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length < 2) return false;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    const payload = JSON.parse(json) as { exp?: unknown };
    if (typeof payload.exp !== "number") return false;
    // Small skew so we don't race the exact second of expiry
    return payload.exp * 1000 <= Date.now() + 2_000;
  } catch {
    return false;
  }
}

/**
 * Clear auth storage, notify AuthProvider, sign out of Supabase, redirect to Login.
 * Safe to call concurrently — only the first call performs recovery.
 */
export function handleSessionExpiry(): void {
  if (typeof window === "undefined") return;

  const shouldRun = markHandling();
  clearStoredAuthToken();

  if (shouldRun) {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    void import("@/lib/supabase")
      .then(({ supabase }) => supabase?.auth.signOut().catch(() => undefined))
      .catch(() => undefined);
  }

  if (isAlreadyOnLogin()) {
    const q = new URLSearchParams(window.location.search);
    if (q.get("reason") !== SESSION_EXPIRED_REASON) {
      window.history.replaceState({}, "", LOGIN_SESSION_EXPIRED_PATH);
    }
    return;
  }

  window.location.assign(LOGIN_SESSION_EXPIRED_PATH);
}

/**
 * If the response is an auth failure, run session recovery and return true.
 * Callers should stop and avoid showing technical error toasts.
 */
export function recoverIfAuthenticationFailure(
  status: number,
  message?: string | null,
  body?: unknown
): boolean {
  if (!isAuthenticationFailure(status, message, body)) return false;
  handleSessionExpiry();
  return true;
}
