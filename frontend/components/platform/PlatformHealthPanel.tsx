"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Cog,
  Database,
  KeyRound,
  Mail,
  RefreshCw,
  Server,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tooltip } from "@/components/ui/Tooltip";
import { probePlatformHealth } from "@/lib/api/health.api";
import { translate } from "@/lib/i18n";
import { ENV } from "@/lib/env";
import { getAuthToken } from "@/lib/api/client";
import { isStoredTokenExpired } from "@/lib/auth/sessionExpiry";
import {
  CORE_HEALTH_SERVICE_ORDER,
  derivePlatformHealth,
  healthStatusLabel,
  healthTone,
  type HealthServiceId,
  type HealthServiceSnapshot,
  type HealthStatus,
  type PlatformHealthMetrics,
  type PlatformRuntimeInfo,
} from "@/lib/platform/platformHealth";
import {
  formatBusinessDateTime,
  formatRelativeTimeAgo,
} from "@/lib/utils/businessDateTime";

import { RELEASE } from "@/lib/release";

const FRONTEND_VERSION = RELEASE.version;

function healthBadgeVariant(status: HealthStatus) {
  if (status === "healthy") return "success" as const;
  if (status === "warning") return "warning" as const;
  if (status === "unavailable") return "danger" as const;
  return "neutral" as const;
}

function serviceIcon(id: HealthServiceId): LucideIcon {
  if (id === "database") return Database;
  if (id === "authentication") return KeyRound;
  if (id === "email") return Mail;
  if (id === "jobs") return Cog;
  if (id === "api") return Server;
  return ShieldCheck;
}

function RuntimeRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div
      className="flex items-start justify-between gap-3 border-b py-2 last:border-0"
      style={{ borderColor: "var(--border-soft)" }}
    >
      <span className="text-sm" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <span className="text-right text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

type Props = {
  businessTimezone?: string | null;
  authSessionActive?: boolean;
};

export function PlatformHealthPanel({
  businessTimezone,
  authSessionActive: authSessionActiveProp,
}: Props) {
  const [checking, setChecking] = useState(true);
  const [services, setServices] = useState<HealthServiceSnapshot[]>([]);
  const [runtime, setRuntime] = useState<PlatformRuntimeInfo | null>(null);
  const [metrics, setMetrics] = useState<PlatformHealthMetrics | null>(null);

  const refresh = useCallback(async () => {
    setChecking(true);
    const token = getAuthToken();
    const authSessionActive =
      typeof authSessionActiveProp === "boolean"
        ? authSessionActiveProp
        : Boolean(token && !isStoredTokenExpired(token));

    try {
      const probe = await probePlatformHealth();
      const derived = derivePlatformHealth({
        probe,
        authSessionActive,
        frontendVersion: FRONTEND_VERSION,
        businessTimezone,
        supabaseConfigured: Boolean(ENV.NEXT_PUBLIC_SUPABASE_URL),
        nodeEnv: process.env.NODE_ENV ?? null,
      });
      setServices(derived.services);
      setRuntime(derived.runtime);
      setMetrics(derived.metrics);
    } finally {
      setChecking(false);
    }
  }, [authSessionActiveProp, businessTimezone]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const ordered = CORE_HEALTH_SERVICE_ORDER.map(
    (id) => services.find((s) => s.id === id) ?? {
      id,
      label: id,
      status: "checking" as const,
      presence: "live" as const,
    }
  );

  const allHealthy = ordered.every((s) => s.status === "healthy");
  const anyUnavailable = ordered.some((s) => s.status === "unavailable");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Live checks for API and database use the existing platform health endpoint. Email and
            background jobs are structured for future probes.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={checking}
          leftIcon={<RefreshCw className="h-3.5 w-3.5" aria-hidden />}
          onClick={() => void refresh()}
        >
          Refresh Health
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {ordered.map((item) => {
          const Icon = serviceIcon(item.id);
          const tone = healthTone(item.status);
          return (
            <div
              key={item.id}
              className="rounded-xl border p-3"
              style={{ borderColor: "var(--border-soft)", background: "var(--surface-muted)" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: tone.bg, color: tone.text }}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {item.label}
                </p>
              </div>
              <Badge variant={healthBadgeVariant(item.status)} className="mt-3">
                {healthStatusLabel(item.status)}
              </Badge>
              {item.detail ? (
                <p className="mt-2 text-xs leading-snug" style={{ color: "var(--text-muted)" }}>
                  {item.detail}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {checking && !services.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title={translate("platform.systemInformation")} padding={false}>
            <CardBody className="p-4">
              {!runtime ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <div>
                  <RuntimeRow label={translate("platform.applicationVersion")} value={runtime.applicationVersion} />
                  <RuntimeRow label={translate("common.environment")} value={runtime.environment} />
                  <RuntimeRow
                    label={translate("platform.serverTime")}
                    value={
                      runtime.serverTime
                        ? formatBusinessDateTime(new Date(runtime.serverTime).toISOString())
                        : null
                    }
                  />
                  <RuntimeRow label={translate("platform.businessTimezone")} value={runtime.businessTimezone} />
                  <RuntimeRow label={translate("platform.frontend")} value={runtime.frontend} />
                  <RuntimeRow label={translate("platform.backend")} value={runtime.backend} />
                  <RuntimeRow label={translate("platform.databaseProvider")} value={runtime.databaseProvider} />
                </div>
              )}
            </CardBody>
          </Card>

          <Card title={translate("platform.responseMetrics")} padding={false}>
            <CardBody className="p-4">
              {!metrics ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <div>
                  <RuntimeRow
                    label={translate("platform.apiResponseTime")}
                    value={
                      metrics.apiResponseMs != null ? `${metrics.apiResponseMs} ms` : null
                    }
                  />
                  <RuntimeRow
                    label={translate("platform.databaseConnection")}
                    value={
                      metrics.databaseConnected == null
                        ? null
                        : metrics.databaseConnected
                          ? translate("platform.connected")
                          : translate("platform.notConnected")
                    }
                  />
                  <div
                    className="flex items-start justify-between gap-3 border-b py-2 last:border-0"
                    style={{ borderColor: "var(--border-soft)" }}
                  >
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                      {translate("platform.lastSuccessfulCheck")}
                    </span>
                    {metrics.lastSuccessfulCheckAt ? (
                      <Tooltip
                        content={formatBusinessDateTime(metrics.lastSuccessfulCheckAt)}
                      >
                        <span
                          className="text-right text-sm font-medium"
                          style={{ color: "var(--text-primary)" }}
                          tabIndex={0}
                        >
                          {formatRelativeTimeAgo(metrics.lastSuccessfulCheckAt)}
                        </span>
                      </Tooltip>
                    ) : (
                      <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                        —
                      </span>
                    )}
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    <Activity className="h-3.5 w-3.5" aria-hidden />
                    {translate("platform.readinessChecksOnly")}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        {checking
          ? translate("platform.checkingServices")
          : anyUnavailable
            ? translate("platform.servicesNeedAttention")
            : allHealthy
              ? translate("platform.servicesHealthy")
              : translate("platform.servicesPartial")}
      </p>
    </div>
  );
}
