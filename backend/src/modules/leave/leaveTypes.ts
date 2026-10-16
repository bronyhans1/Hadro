/**
 * Canonical leave types (Phase A). Stored lowercase in DB/API.
 * Compensation defaults are platform seed values only — companies override via
 * company_leave_type_policies. Leave requests snapshot compensation at create time.
 */
export const LEAVE_TYPES = [
  "annual",
  "sick",
  "maternity",
  "emergency",
  "unpaid",
] as const;

export type LeaveType = (typeof LEAVE_TYPES)[number];

export const LEAVE_COMPENSATION_TYPES = ["paid", "unpaid"] as const;

export type LeaveCompensationType = (typeof LEAVE_COMPENSATION_TYPES)[number];

/** Platform defaults used when seeding company_leave_type_policies (zero behaviour change). */
export const DEFAULT_LEAVE_COMPENSATION: Record<LeaveType, LeaveCompensationType> = {
  annual: "paid",
  sick: "paid",
  maternity: "paid",
  emergency: "paid",
  unpaid: "unpaid",
};

/** @deprecated Phase A — map legacy "other" to emergency */
const LEGACY_LEAVE_TYPE_ALIASES: Record<string, LeaveType> = {
  other: "emergency",
};

export function normalizeLeaveType(raw: string): LeaveType | null {
  const t = raw.trim().toLowerCase();
  if (!t) return null;
  const aliased = LEGACY_LEAVE_TYPE_ALIASES[t] ?? t;
  if ((LEAVE_TYPES as readonly string[]).includes(aliased)) {
    return aliased as LeaveType;
  }
  return null;
}

/**
 * Platform default compensation for a leave type (seed / fallback only).
 * Prefer company policy via leaveTypePolicy.service for new leave requests.
 */
export function leaveCompensationForType(leaveType: LeaveType): LeaveCompensationType {
  return DEFAULT_LEAVE_COMPENSATION[leaveType];
}

export function leaveTypeLabel(leaveType: string): string {
  const t = leaveType.trim().toLowerCase();
  switch (t) {
    case "annual":
      return "Annual";
    case "sick":
      return "Sick";
    case "maternity":
      return "Maternity";
    case "emergency":
      return "Emergency";
    case "unpaid":
      return "Unpaid";
    case "other":
      return "Emergency";
    default:
      return t.charAt(0).toUpperCase() + t.slice(1);
  }
}

export function formatLeaveTypesList(): string {
  return LEAVE_TYPES.join(", ");
}
