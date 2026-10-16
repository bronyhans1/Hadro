"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { needsFirstLoginOnboarding } from "@/lib/auth/onboarding";
import { getDefaultHomeRoute } from "@/lib/auth/roles";
import { translate } from "@/lib/i18n";

interface RouteGuardProps {
  children: React.ReactNode;
}

const ONBOARDING_PATH = "/onboarding";

export function RouteGuard({ children }: RouteGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user && pathname !== "/login") {
      router.replace("/login");
      return;
    }
    if (!user) return;

    const onOnboarding = pathname === ONBOARDING_PATH || pathname.startsWith(`${ONBOARDING_PATH}/`);
    const needsOnboarding = needsFirstLoginOnboarding(user);

    if (needsOnboarding && !onOnboarding) {
      router.replace(ONBOARDING_PATH);
      return;
    }
    if (!needsOnboarding && onOnboarding) {
      router.replace(getDefaultHomeRoute(user.roles));
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--app-bg)" }}>
        <div className="text-sm text-theme-muted">{translate("common.loadingEllipsis")}</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Block rendering of app chrome while redirecting to onboarding
  if (
    needsFirstLoginOnboarding(user) &&
    pathname !== ONBOARDING_PATH &&
    !pathname.startsWith(`${ONBOARDING_PATH}/`)
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--app-bg)" }}>
        <div className="text-sm text-theme-muted">{translate("common.preparingAccount")}</div>
      </div>
    );
  }

  return <>{children}</>;
}
