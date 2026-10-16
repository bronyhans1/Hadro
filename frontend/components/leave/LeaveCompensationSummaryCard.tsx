"use client";

import { Badge } from "@/components/ui/Badge";
import { compensationLabel } from "@/lib/leave/leaveTypes";
import { translate } from "@/lib/i18n";

type Props = {
  companyDefault: "paid" | "unpaid";
  currentCompensation: "paid" | "unpaid";
  /** Live override in the review form (may differ from stored reason until save). */
  overrideReason?: string | null;
  className?: string;
};

/**
 * Compact HR compensation summary for leave review/approval.
 * Presentation only — does not change compensation values.
 */
export function LeaveCompensationSummaryCard({
  companyDefault,
  currentCompensation,
  overrideReason,
  className,
}: Props) {
  const overridden = currentCompensation !== companyDefault;
  const reasonText = overridden
    ? (overrideReason?.trim() || "—")
    : "—";

  return (
    <div
      className={className}
      role="region"
      aria-label={translate("leave.compensationSummary")}
      style={{
        borderRadius: "0.75rem",
        border: "1px solid var(--ds-color-border)",
        background: "var(--ds-color-surface)",
      }}
    >
      <div
        className="border-b px-4 py-2.5"
        style={{ borderColor: "var(--ds-color-border)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-theme-muted">
          {translate("leave.compensationSummaryTitle")}
        </p>
      </div>
      <dl className="grid gap-3 px-4 py-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-theme-muted">{translate("leave.companyDefault")}</dt>
          <dd className="mt-0.5 text-sm font-medium text-theme">
            {compensationLabel(companyDefault)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-theme-muted">{translate("leave.currentCompensation")}</dt>
          <dd className="mt-0.5 text-sm font-medium text-theme">
            {compensationLabel(currentCompensation)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-theme-muted">{translate("attendance.status")}</dt>
          <dd className="mt-1">
            <Badge
              variant={overridden ? "warning" : "success"}
              className="text-[10px] uppercase tracking-wide"
            >
              {overridden ? translate("leave.overrideBadge") : translate("leave.defaultBadge")}
            </Badge>
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-theme-muted">{translate("leave.reason")}</dt>
          <dd className="mt-0.5 text-sm text-theme">{reasonText}</dd>
        </div>
      </dl>
    </div>
  );
}
