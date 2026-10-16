"use client";

import type { LeaveBalanceTypeCard } from "@/lib/leave/leaveBalanceUtils";
import { leaveTypeColor, compensationLabel } from "@/lib/leave/leaveTypes";
import { translate } from "@/lib/i18n";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";

interface LeaveBalanceTypeCardsProps {
  cards: LeaveBalanceTypeCard[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function LeaveBalanceTypeCards({ cards, loading, error, onRetry }: LeaveBalanceTypeCardsProps) {
  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy aria-label={translate("leave.loadingBalancesAria")}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} padding={false}>
            <CardBody className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-8 w-full" />
            </CardBody>
          </Card>
        ))}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <EmptyState
        title={translate("leave.noBalancesAvailable")}
        description={translate("leave.contactHrAssign")}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label={translate("leave.balanceByTypeAria")}>
      {cards.map((card) => {
        const colors = leaveTypeColor(card.leaveType);
        return (
          <Card
            key={card.id}
            padding={false}
            className="transition-colors hover:shadow-[var(--ds-shadow-hover)]"
          >
            <CardBody className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: "var(--ds-color-text-primary)" }}>
                    {card.leaveTypeLabel}
                  </h3>
                  <p className="text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
                    {translate("leave.compensationLeave", { values: { compensation: compensationLabel(card.compensation) } })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={card.statusVariant}>{card.statusLabel}</Badge>
                  <Badge variant={card.compensation === "unpaid" ? "default" : "success"}>
                    {compensationLabel(card.compensation)}
                  </Badge>
                </div>
              </div>

              <Progress
                value={card.used}
                max={card.allocated > 0 ? card.allocated : 100}
                label={translate("leave.used")}
              />

              <dl className="grid grid-cols-3 gap-2 text-center text-xs">
                <div
                  className="rounded-lg px-2 py-2"
                  style={{ background: "var(--ds-color-surface-muted)" }}
                >
                  <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("leave.allocated")}</dt>
                  <dd className="mt-0.5 text-base font-semibold tabular-nums" style={{ color: "var(--ds-color-text-primary)" }}>
                    {card.allocated}
                  </dd>
                </div>
                <div
                  className="rounded-lg px-2 py-2"
                  style={{ background: colors.bg }}
                >
                  <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("leave.used")}</dt>
                  <dd className="mt-0.5 text-base font-semibold tabular-nums" style={{ color: colors.text }}>
                    {card.used}
                  </dd>
                </div>
                <div
                  className="rounded-lg px-2 py-2"
                  style={{ background: "var(--ds-color-success-subtle)" }}
                >
                  <dt style={{ color: "var(--ds-color-text-muted)" }}>{translate("leave.remaining")}</dt>
                  <dd className="mt-0.5 text-base font-semibold tabular-nums" style={{ color: "var(--ds-color-success-text)" }}>
                    {card.remaining}
                  </dd>
                </div>
              </dl>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
