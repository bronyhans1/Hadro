import type { PlatformHealthProbeResult } from "@/lib/api/health.api";

export type HealthStatus = "healthy" | "warning" | "unavailable" | "checking";

/** Core probes shown today; additional ids reserved for future dashboard rows. */
export type HealthServiceId =
  | "api"
  | "database"
  | "authentication"
  | "email"
  | "jobs"
  | "storage"
  | "queue"
  | "email_queue"
  | "scheduled_jobs"
  | "cache";

export type HealthServicePresence = "live" | "placeholder" | "future";

export type HealthServiceSnapshot = {
  id: HealthServiceId;
  label: string;
  status: HealthStatus;
  detail?: string;
  presence: HealthServicePresence;
};

export type PlatformRuntimeInfo = {
  applicationVersion: string | null;
  backendVersion: string | null;
  environment: string | null;
  serverTime: string | null;
  businessTimezone: string | null;
  frontend: string | null;
  backend: string | null;
  databaseProvider: string | null;
};

export type PlatformHealthMetrics = {
  apiResponseMs: number | null;
  databaseConnected: boolean | null;
  lastSuccessfulCheckAt: string | null;
};

export const CORE_HEALTH_SERVICE_ORDER: readonly HealthServiceId[] = [
  "api",
  "database",
  "authentication",
  "email",
  "jobs",
] as const;

/** Reserved for future monitoring rows — keeps dashboard integration points stable. */
export const FUTURE_HEALTH_SERVICE_IDS: readonly HealthServiceId[] = [
  "storage",
  "queue",
  "email_queue",
  "scheduled_jobs",
  "cache",
] as const;

export function healthStatusLabel(status: HealthStatus): string {
  switch (status) {
    case "healthy":
      return "Healthy";
    case "warning":
      return "Warning";
    case "unavailable":
      return "Unavailable";
    case "checking":
      return "Checking";
  }
}

export function healthTone(status: HealthStatus): { bg: string; text: string; border: string } {
  if (status === "healthy") {
    return {
      bg: "var(--ds-color-success-subtle)",
      text: "var(--ds-color-success-text)",
      border: "var(--ds-color-success-border)",
    };
  }
  if (status === "warning") {
    return {
      bg: "var(--ds-color-warning-subtle)",
      text: "var(--ds-color-warning-text)",
      border: "var(--ds-color-warning-border)",
    };
  }
  if (status === "unavailable") {
    return {
      bg: "var(--ds-color-danger-subtle)",
      text: "var(--ds-color-danger-text)",
      border: "var(--ds-color-danger-border)",
    };
  }
  return {
    bg: "var(--ds-color-surface-muted)",
    text: "var(--ds-color-text-secondary)",
    border: "var(--ds-color-border)",
  };
}

function databaseLooksConnected(database?: string): boolean {
  if (!database) return false;
  const d = database.toLowerCase();
  return d.includes("connected") && !d.includes("failed");
}

function inferDatabaseProvider(database?: string, supabaseConfigured?: boolean): string | null {
  if (database && /supabase/i.test(database)) return "Supabase";
  if (supabaseConfigured) return "Supabase";
  return null;
}

export function buildCheckingSnapshots(): HealthServiceSnapshot[] {
  return CORE_HEALTH_SERVICE_ORDER.map((id) => ({
    id,
    label: serviceLabel(id),
    status: "checking" as const,
    presence: id === "email" || id === "jobs" ? ("placeholder" as const) : ("live" as const),
    detail: "Running check…",
  }));
}

function serviceLabel(id: HealthServiceId): string {
  switch (id) {
    case "api":
      return "API";
    case "database":
      return "Database";
    case "authentication":
      return "Authentication";
    case "email":
      return "Email Service";
    case "jobs":
      return "Background Jobs";
    case "storage":
      return "Storage";
    case "queue":
      return "Queue";
    case "email_queue":
      return "Email Queue";
    case "scheduled_jobs":
      return "Scheduled Jobs";
    case "cache":
      return "Cache";
  }
}

type BuildInput = {
  probe: PlatformHealthProbeResult | null;
  authSessionActive: boolean;
  frontendVersion: string;
  businessTimezone?: string | null;
  supabaseConfigured: boolean;
  nodeEnv?: string | null;
};

export function derivePlatformHealth(input: BuildInput): {
  services: HealthServiceSnapshot[];
  runtime: PlatformRuntimeInfo;
  metrics: PlatformHealthMetrics;
} {
  const { probe, authSessionActive, frontendVersion, businessTimezone, supabaseConfigured, nodeEnv } =
    input;

  if (!probe) {
    return {
      services: buildCheckingSnapshots(),
      runtime: {
        applicationVersion: frontendVersion,
        backendVersion: null,
        environment: nodeEnv ?? null,
        serverTime: null,
        businessTimezone: businessTimezone?.trim() || null,
        frontend: `hadro-web ${frontendVersion}`,
        backend: null,
        databaseProvider: supabaseConfigured ? "Supabase" : null,
      },
      metrics: {
        apiResponseMs: null,
        databaseConnected: null,
        lastSuccessfulCheckAt: null,
      },
    };
  }

  const dbConnected = probe.ok && databaseLooksConnected(probe.data?.database);
  const apiHealthy = probe.ok && Boolean(probe.data?.status);

  const services: HealthServiceSnapshot[] = [
    {
      id: "api",
      label: "API",
      status: apiHealthy ? "healthy" : "unavailable",
      detail: apiHealthy
        ? `Responded in ${probe.latencyMs} ms`
        : "Health endpoint unreachable",
      presence: "live",
    },
    {
      id: "database",
      label: "Database",
      status: !probe.ok
        ? "unavailable"
        : dbConnected
          ? "healthy"
          : "unavailable",
      detail: !probe.ok
        ? "Unable to verify via API"
        : dbConnected
          ? probe.data?.database ?? "Connected"
          : probe.data?.database ?? probe.data?.error ?? "Connection failed",
      presence: "live",
    },
    {
      id: "authentication",
      label: "Authentication",
      status: authSessionActive ? "healthy" : "warning",
      detail: authSessionActive
        ? "Active platform session"
        : "No active session detected",
      presence: "live",
    },
    {
      id: "email",
      label: "Email Service",
      status: "warning",
      detail: "Probe not configured",
      presence: "placeholder",
    },
    {
      id: "jobs",
      label: "Background Jobs",
      status: "warning",
      detail: "Probe not configured",
      presence: "placeholder",
    },
  ];

  const backendVersion = probe.data?.apiVersion ?? probe.data?.version ?? null;
  const product = probe.data?.product ?? "HADRO API";

  return {
    services,
    runtime: {
      applicationVersion: frontendVersion,
      backendVersion,
      environment: nodeEnv ?? null,
      serverTime: probe.serverDateHeader,
      businessTimezone: businessTimezone?.trim() || null,
      frontend: `hadro-web ${frontendVersion}`,
      backend: backendVersion ? `${product} ${backendVersion}` : product,
      databaseProvider: inferDatabaseProvider(probe.data?.database, supabaseConfigured),
    },
    metrics: {
      apiResponseMs: probe.latencyMs,
      databaseConnected: probe.ok ? dbConnected : null,
      lastSuccessfulCheckAt: apiHealthy ? probe.checkedAt : null,
    },
  };
}
