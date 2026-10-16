import type { LeaveBalanceRecord } from "./leaveBalance.repository";
import {
  leaveCompensationForType,
  leaveTypeLabel,
  normalizeLeaveType,
  type LeaveType,
} from "./leaveTypes";

export interface LeaveBalanceApi {
  id: string;
  user_id: string;
  company_id: string;
  leave_type: LeaveType | string;
  /** Alias for total_days (HR-facing). */
  allocated_days: number;
  used_days: number;
  remaining_days: number;
  /** total_days kept for backward-compatible clients */
  total_days: number;
  leave_compensation_type: "paid" | "unpaid";
  leave_type_label: string;
  updated_at: string;
}

export function toLeaveBalanceApi(
  row: LeaveBalanceRecord,
  compensationByType?: Map<string, "paid" | "unpaid">
): LeaveBalanceApi {
  const leaveType = (row.leave_type ?? "annual").trim().toLowerCase() as LeaveType;
  const allocated = Number(row.total_days ?? 0);
  const used = Number(row.used_days ?? 0);
  const remaining = Math.max(0, allocated - used);
  const normalizedType = normalizeLeaveType(leaveType) ?? ("annual" as LeaveType);
  const fromPolicy = compensationByType?.get(normalizedType);
  const compensation =
    fromPolicy ?? leaveCompensationForType(normalizedType);

  return {
    id: row.id,
    user_id: row.user_id,
    company_id: row.company_id,
    leave_type: normalizedType,
    allocated_days: allocated,
    used_days: used,
    remaining_days: remaining,
    total_days: allocated,
    leave_compensation_type: compensation,
    leave_type_label: leaveTypeLabel(leaveType),
    updated_at: row.updated_at,
  };
}

export function toLeaveBalanceApiList(
  rows: LeaveBalanceRecord[],
  compensationByType?: Map<string, "paid" | "unpaid">
): LeaveBalanceApi[] {
  return rows.map((r) => toLeaveBalanceApi(r, compensationByType)).sort((a, b) =>
    a.leave_type_label.localeCompare(b.leave_type_label)
  );
}
