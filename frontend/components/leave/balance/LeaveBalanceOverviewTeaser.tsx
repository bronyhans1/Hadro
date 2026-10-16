"use client";

import Link from "next/link";
import type { LeaveBalanceRecord } from "@/lib/api/leaveBalances.api";
import { computeBalanceUsageLabel } from "@/lib/leave/leaveOverviewUtils";
import { sumBalanceField } from "@/lib/leave/leaveBalanceUtils";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { cn } from "@/lib/design-system/cn";
import { translate } from "@/lib/i18n";

interface LeaveBalanceOverviewTeaserProps {
  balances: LeaveBalanceRecord[];
  loading?: boolean;
  error?: string | null;
}

export function LeaveBalanceOverviewTeaser({ balances, loading, error }: LeaveBalanceOverviewTeaserProps) {
  if (loading) {
    return <LoadingState message={translate("leave.loadingLeaveBalances")} className="min-h-[80px]" />;
  }

  if (error) {
    return (
      <p className="text-sm" style={{ color: "var(--state-error-text)" }}>
        {error}
      </p>
    );
  }

  const remaining = sumBalanceField(balances, "remaining_days");
  const usageLabel = computeBalanceUsageLabel(balances);

  return (
    <Card padding={false}>
      <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--ds-color-text-primary)" }}>
            {balances.length === 0 ? translate("leave.noLeaveBalancesSetUp") : translate("leave.daysRemainingCount", { values: { count: remaining } })}
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--ds-color-text-muted)" }}>
            {balances.length === 0
              ? translate("leave.openBalanceForDetails")
              : translate("leave.usage", { values: { usage: usageLabel } })}
          </p>
        </div>
        <Link href="/leave/balance" className="shrink-0">
          <Button
            type="button"
            variant="outline"
            className={cn("w-full sm:w-auto")}
          >
            {translate("leave.viewBalanceAnalytics")}
          </Button>
        </Link>
      </CardBody>
    </Card>
  );
}
