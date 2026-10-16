import { translate } from "@/lib/i18n";

export type OvertimeCompensationMethod = "multiplier" | "fixed_rate";

export const OVERTIME_COMPENSATION_METHOD_LABELS: Record<
  OvertimeCompensationMethod,
  string
> = {
  multiplier: "Multiplier",
  fixed_rate: "Fixed OT Rate",
};

export function overtimeCompensationMethodLabel(method: OvertimeCompensationMethod): string {
  if (method === "fixed_rate") return translate("payroll.fixedOtRateMethod");
  return translate("payroll.multiplier");
}

export function normalizeOvertimeCompensationMethod(
  value: unknown
): OvertimeCompensationMethod {
  if (value === "fixed_rate") return "fixed_rate";
  return "multiplier";
}
