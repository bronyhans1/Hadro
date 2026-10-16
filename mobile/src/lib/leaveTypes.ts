/**
 * Canonical leave types — must match backend `leaveTypes.ts`.
 */
import { humanizeEnumKey } from "@/lib/format/displayLabels";
import { translate } from "@/lib/i18n";

export const LEAVE_TYPES = [
  { value: "annual", label: "Annual", compensation: "paid" as const },
  { value: "sick", label: "Sick", compensation: "paid" as const },
  { value: "maternity", label: "Maternity", compensation: "paid" as const },
  { value: "emergency", label: "Emergency", compensation: "paid" as const },
  { value: "unpaid", label: "Unpaid", compensation: "unpaid" as const },
] as const;

export type LeaveTypeValue = (typeof LEAVE_TYPES)[number]["value"];

export const LEAVE_TYPE_VALUES: readonly LeaveTypeValue[] = LEAVE_TYPES.map((t) => t.value);

const SYSTEM_LEAVE_TYPE_KEYS: Record<string, string> = {
  annual: "leave.types.annual",
  sick: "leave.types.sick",
  maternity: "leave.types.maternity",
  emergency: "leave.types.emergency",
  other: "leave.types.emergency",
  unpaid: "leave.unpaid",
};

export function leaveTypeLabel(value: string, storedLabel?: string | null): string {
  const key = value.trim().toLowerCase();
  const systemKey = SYSTEM_LEAVE_TYPE_KEYS[key];
  if (systemKey) return translate(systemKey);
  const stored = storedLabel?.trim();
  if (stored) return stored;
  const trimmed = value.trim();
  return trimmed ? humanizeEnumKey(trimmed) : "—";
}

export function compensationLabel(value: string | null | undefined): string {
  return (value ?? "paid").toLowerCase() === "unpaid" ? translate("leave.unpaid") : translate("leave.paid");
}
