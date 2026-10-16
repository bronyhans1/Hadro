import { Badge } from "@/components/ui/Badge";
import type { PayrollPeriodStatus } from "@/lib/api/payrollPeriod.api";
import { presentPayrollReadiness, translate } from "@/lib/i18n";

function normalizeStatus(status: PayrollPeriodStatus | string | null | undefined): string {
  const s = (status ?? "draft").toLowerCase();
  if (s === "review") return "processing";
  if (s === "closed") return "archived";
  return s;
}

export function formatPeriodStatusLabel(status: PayrollPeriodStatus | string): string {
  const s = normalizeStatus(status);
  if (s === "processing") return translate("payroll.processing");
  if (s === "approved") return translate("leave.approved");
  if (s === "locked") return translate("payroll.locked");
  if (s === "archived") return translate("payroll.archived");
  return translate("payroll.draft");
}

export function payrollReadinessLabel(status: string, fallback: string): string {
  return presentPayrollReadiness(status, fallback);
}

/** Presentation-only mapping for payroll period lifecycle status. */
export function periodStatusBadge(status: PayrollPeriodStatus | string | null | undefined) {
  const s = normalizeStatus(status);
  const label = formatPeriodStatusLabel(s);

  if (s === "processing") return <Badge variant="pending">{label}</Badge>;
  if (s === "approved") return <Badge variant="approved">{label}</Badge>;
  if (s === "locked") return <Badge variant="locked">{label}</Badge>;
  if (s === "archived") return <Badge variant="closed">{label}</Badge>;
  return <Badge variant="draft">{label}</Badge>;
}
