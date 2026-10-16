"use client";

import type { ReactNode } from "react";
import { AlertCircle, ShieldOff } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { translate } from "@/lib/i18n";

type DashboardWidgetStateProps = {
  loading?: boolean;
  error?: string | null;
  /** When true, show role-access copy instead of a generic load error. */
  accessDenied?: boolean;
  skeletonRows?: number;
  children: ReactNode;
};

/**
 * Progressive widget shell: own loading + friendly error without blanking the page.
 */
export function DashboardWidgetState({
  loading,
  error,
  accessDenied,
  skeletonRows = 3,
  children,
}: DashboardWidgetStateProps) {
  if (loading) {
    return (
      <div className="space-y-3" aria-busy aria-label={translate("dashboard.loadingWidget")}>
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (error || accessDenied) {
    return (
      <EmptyState
        title={
          accessDenied
            ? translate("dashboard.roleUnavailable")
            : translate("dashboard.unableLoadWidget")
        }
        description={
          accessDenied
            ? translate("dashboard.roleHidden")
            : error ?? translate("dashboard.tryAgainLater")
        }
        icon={
          accessDenied ? (
            <ShieldOff className="h-5 w-5" aria-hidden />
          ) : (
            <AlertCircle className="h-5 w-5" aria-hidden />
          )
        }
        compact
      />
    );
  }

  return <>{children}</>;
}
