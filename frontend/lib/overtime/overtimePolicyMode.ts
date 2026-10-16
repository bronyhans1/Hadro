import { translate } from "@/lib/i18n";

export type OvertimePolicyMode =
  | "duration"
  | "shift_end"
  | "greater_of"
  | "manual_only"
  | "none";

export const OVERTIME_POLICY_MODE_LABELS: Record<OvertimePolicyMode, string> = {
  duration: "Duration-Based OT",
  shift_end: "Shift-End OT",
  greater_of: "Greater Of (Duration vs Shift)",
  manual_only: "Manual OT Only",
  none: "No Automatic OT",
};

export const COMING_SOON_OVERTIME_MODES: OvertimePolicyMode[] = [
  "shift_end",
  "greater_of",
  "manual_only",
];

export const ACTIVATED_OVERTIME_POLICY_MODES: OvertimePolicyMode[] = [
  "duration",
  "none",
];

export function overtimePolicyModeLabel(mode: OvertimePolicyMode | string | undefined): string {
  if (mode === "duration") return translate("payroll.durationBasedOt");
  if (mode === "shift_end") return translate("payroll.shiftEndOt");
  if (mode === "greater_of") return translate("payroll.greaterOfOt");
  if (mode === "manual_only") return translate("payroll.manualOtOnly");
  if (mode === "none") return translate("payroll.noAutomaticOt");
  return translate("payroll.durationBasedOt");
}
