"use client";

import { BrandMark } from "@/components/brand/BrandMark";
import { BRAND } from "@/lib/branding";
import { cn } from "@/lib/design-system/cn";
import { translate } from "@/lib/i18n";

type Props = {
  /** Visible status copy for the transition. */
  message?: string;
  className?: string;
};

/**
 * Full-viewport HADRO workspace transition.
 * Used while auth session / post-login navigation completes.
 * Does not delay navigation — only presents the real wait.
 */
export function WorkspaceTransitionLoader({
  message,
  className,
}: Props) {
  const status = message ?? translate("auth.preparingWorkspace");
  return (
    <div
      className={cn(
        "hadro-workspace-loader fixed inset-0 z-[100] flex min-h-screen flex-col items-center justify-center px-6",
        className,
      )}
      style={{ background: "var(--app-bg, #FFFFFF)" }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex max-w-sm flex-col items-center text-center">
        <BrandMark
          size="auth"
          fit="contain"
          priority
          alt=""
          className="hadro-workspace-loader__mark"
        />

        <p
          className="mt-5 text-[1.375rem] font-semibold tracking-[-0.03em] leading-none"
          style={{ color: "var(--text-primary, #1C1C1C)" }}
        >
          {BRAND.appName}
        </p>
        <p
          className="mt-2 text-[0.6875rem] font-normal tracking-[0.06em] leading-none"
          style={{ color: "var(--text-muted, #64748B)" }}
        >
          {BRAND.compactDescriptor}
        </p>

        <div
          className="hadro-workspace-loader__indicator mt-8"
          aria-hidden
        >
          <span className="hadro-workspace-loader__bar" />
        </div>

        <p
          className="mt-5 text-sm font-medium"
          style={{ color: "var(--text-muted, #64748B)" }}
        >
          {status}
        </p>
      </div>
    </div>
  );
}
