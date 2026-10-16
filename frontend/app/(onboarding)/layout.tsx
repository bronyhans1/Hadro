"use client";

import { RouteGuard } from "@/components/layout/RouteGuard";

/** Minimal chrome for forced first-login onboarding (no sidebar). */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <div className="min-h-screen" style={{ background: "var(--app-bg)" }}>
        {children}
      </div>
    </RouteGuard>
  );
}
