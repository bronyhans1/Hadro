"use client";

import { WalletCards } from "lucide-react";
import type { PayrollStatItem } from "@/lib/payroll/payrollOverviewUtils";
import { StatGrid } from "@/components/ui/StatGrid";
import { translate } from "@/lib/i18n";

interface PayrollRecordsSnapshotGridProps {
  stats: PayrollStatItem[];
  loading?: boolean;
}

export function PayrollRecordsSnapshotGrid({ stats, loading }: PayrollRecordsSnapshotGridProps) {
  return (
    <StatGrid
      ariaLabel={translate("payroll.recordsSnapshotAria")}
      loading={loading}
      items={stats.map((stat) => ({
        key: stat.title,
        title: stat.title,
        value: stat.value,
        subtitle: stat.subtitle,
        icon: <WalletCards />,
        tone: "completed",
      }))}
    />
  );
}
