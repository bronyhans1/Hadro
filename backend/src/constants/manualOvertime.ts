export const MANUAL_OT_STACKING_MODE_WARN = "warn";
export const MANUAL_OT_STACKING_MODE_BLOCK = "block";
export const MANUAL_OT_STACKING_MODE_ALLOW = "allow";

export const MANUAL_OT_STACKING_MODES = [
  MANUAL_OT_STACKING_MODE_WARN,
  MANUAL_OT_STACKING_MODE_BLOCK,
  MANUAL_OT_STACKING_MODE_ALLOW,
] as const;

export type ManualOtStackingMode = (typeof MANUAL_OT_STACKING_MODES)[number];

export const DEFAULT_MANUAL_OT_STACKING_MODE: ManualOtStackingMode =
  MANUAL_OT_STACKING_MODE_WARN;

export const MANUAL_OVERTIME_ENTRY_STATUSES = [
  "draft",
  "approved",
  "rejected",
  "cancelled",
] as const;

export type ManualOvertimeEntryStatus =
  (typeof MANUAL_OVERTIME_ENTRY_STATUSES)[number];

export function isManualOtStackingMode(
  value: unknown
): value is ManualOtStackingMode {
  return (
    typeof value === "string" &&
    (MANUAL_OT_STACKING_MODES as readonly string[]).includes(value)
  );
}

export function normalizeManualOtStackingMode(
  value: unknown
): ManualOtStackingMode {
  return isManualOtStackingMode(value) ? value : DEFAULT_MANUAL_OT_STACKING_MODE;
}

export function isManualOvertimeEntryStatus(
  value: unknown
): value is ManualOvertimeEntryStatus {
  return (
    typeof value === "string" &&
    (MANUAL_OVERTIME_ENTRY_STATUSES as readonly string[]).includes(value)
  );
}
