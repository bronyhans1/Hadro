import { ENV } from "@/lib/env";

/** Payload returned by existing GET /api/health (and /health). */
export type PlatformHealthApiPayload = {
  status?: string;
  database?: string;
  error?: string;
  product?: string;
  phase?: string;
  version?: string;
  apiVersion?: string;
  build?: number;
  releaseDate?: string;
  codename?: string;
  environment?: string;
};

export type PlatformHealthProbeResult = {
  ok: boolean;
  data: PlatformHealthApiPayload | null;
  latencyMs: number;
  /** HTTP Date header from the server response, when present. */
  serverDateHeader: string | null;
  checkedAt: string;
};

/**
 * Lightweight readiness probe against the existing public health endpoint.
 * Does not require authentication.
 */
export async function probePlatformHealth(): Promise<PlatformHealthProbeResult> {
  const started = typeof performance !== "undefined" ? performance.now() : Date.now();
  const checkedAt = new Date().toISOString();

  try {
    const res = await fetch(`${ENV.NEXT_PUBLIC_API_BASE_URL}/api/health`, {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    const ended = typeof performance !== "undefined" ? performance.now() : Date.now();
    const latencyMs = Math.max(0, Math.round(ended - started));
    const serverDateHeader = res.headers.get("date");

    let data: PlatformHealthApiPayload | null = null;
    try {
      data = (await res.json()) as PlatformHealthApiPayload;
    } catch {
      data = null;
    }

    return {
      ok: res.ok,
      data,
      latencyMs,
      serverDateHeader,
      checkedAt,
    };
  } catch {
    const ended = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: false,
      data: null,
      latencyMs: Math.max(0, Math.round(ended - started)),
      serverDateHeader: null,
      checkedAt,
    };
  }
}
