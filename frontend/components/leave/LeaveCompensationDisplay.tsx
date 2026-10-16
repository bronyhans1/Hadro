"use client";

import { Badge } from "@/components/ui/Badge";
import { compensationLabel } from "@/lib/leave/leaveTypes";
import { translate } from "@/lib/i18n";

type Props = {
  compensation: string | null | undefined;
  overridden?: boolean | null;
  /** HR/admin: show Default/Override badge. Employee: omit badge, optional note. */
  variant?: "hr" | "employee";
  className?: string;
};

/**
 * Subtle compensation display for leave requests.
 * HR sees Default/Override badge; employees see final compensation only (+ note if overridden).
 */
export function LeaveCompensationDisplay({
  compensation,
  overridden = false,
  variant = "hr",
  className,
}: Props) {
  const label = compensationLabel(compensation);
  const isOverride = Boolean(overridden);

  if (variant === "employee") {
    return (
      <span className={className}>
        <span className="text-sm text-theme">{label}</span>
        {isOverride ? (
          <span className="mt-0.5 block text-xs text-theme-muted">
            {translate("leave.compensationDiffers")}
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 ${className ?? ""}`}>
      <span className="text-sm text-theme">{label}</span>
      <Badge variant={isOverride ? "warning" : "neutral"} className="text-[10px] uppercase tracking-wide">
        {isOverride ? translate("leave.overrideBadge") : translate("leave.defaultBadge")}
      </Badge>
    </span>
  );
}
