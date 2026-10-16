import {
  leaveCompensationForType,
  normalizeLeaveType,
  type LeaveCompensationType,
} from "../leave/leaveTypes";

/**
 * Single source of truth: payroll paid vs unpaid leave classification.
 * Uses explicit `leave_compensation_type` when set; otherwise leave type semantics.
 */
export type LeavePayrollCompensationClass = LeaveCompensationType;

export function classifyLeavePayrollCompensation(leave: {
  leave_compensation_type?: string | null;
  leave_type: string;
}): LeavePayrollCompensationClass {
  const explicit = (leave.leave_compensation_type ?? "").trim().toLowerCase();
  if (explicit === "paid" || explicit === "unpaid") {
    return explicit;
  }
  const normalizedType = normalizeLeaveType(leave.leave_type);
  if (normalizedType) {
    return leaveCompensationForType(normalizedType);
  }
  return "paid";
}

export function isPaidLeaveForPayroll(leave: {
  leave_compensation_type?: string | null;
  leave_type: string;
}): boolean {
  return classifyLeavePayrollCompensation(leave) === "paid";
}

export function isUnpaidLeaveForPayroll(leave: {
  leave_compensation_type?: string | null;
  leave_type: string;
}): boolean {
  return classifyLeavePayrollCompensation(leave) === "unpaid";
}
