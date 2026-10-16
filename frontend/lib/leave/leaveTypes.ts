/** Canonical leave types — must match backend `leaveTypes.ts`.
 * `compensation` here is the platform default only; company policy is authoritative.
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

/** Design-system colors per leave type for calendar events and legend. */
export const LEAVE_TYPE_COLORS: Record<
  LeaveTypeValue,
  { bg: string; border: string; text: string }
> = {
  annual: {
    bg: "var(--ds-color-primary-subtle)",
    border: "var(--ds-color-primary)",
    text: "var(--ds-color-primary)",
  },
  sick: {
    bg: "var(--ds-color-danger-subtle)",
    border: "var(--ds-color-danger)",
    text: "var(--ds-color-danger-text)",
  },
  maternity: {
    bg: "var(--ds-color-info-subtle)",
    border: "var(--ds-color-info)",
    text: "var(--ds-color-info-text)",
  },
  emergency: {
    bg: "var(--ds-color-warning-subtle)",
    border: "var(--ds-color-warning)",
    text: "var(--ds-color-warning-text)",
  },
  unpaid: {
    bg: "var(--ds-color-surface-muted)",
    border: "var(--ds-color-border-strong)",
    text: "var(--ds-color-text-secondary)",
  },
};

export function leaveTypeColor(value: string): { bg: string; border: string; text: string } {
  const key = value.trim().toLowerCase() as LeaveTypeValue;
  if (key in LEAVE_TYPE_COLORS) return LEAVE_TYPE_COLORS[key];
  return LEAVE_TYPE_COLORS.emergency;
}
