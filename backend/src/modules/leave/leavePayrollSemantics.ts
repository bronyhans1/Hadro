import type { LeaveCompensationType } from "./leaveTypes";
import {
  classifyLeavePayrollCompensation,
  isPaidLeaveForPayroll,
  isUnpaidLeaveForPayroll,
} from "../payroll/leavePayrollClassification";

/**
 * @deprecated Prefer `classifyLeavePayrollCompensation` from `payroll/leavePayrollClassification.ts`.
 * Kept for leave-module callers; delegates to payroll SSOT.
 */
export function isPaidLeaveCompensation(
  compensation: string | null | undefined
): boolean {
  return classifyLeavePayrollCompensation({
    leave_compensation_type: compensation,
    leave_type: "annual",
  }) === "paid";
}

/** @deprecated Prefer `isUnpaidLeaveForPayroll` from payroll classification. */
export function isUnpaidLeaveCompensation(
  compensation: string | null | undefined
): boolean {
  return !isPaidLeaveCompensation(compensation);
}

export { classifyLeavePayrollCompensation, isPaidLeaveForPayroll, isUnpaidLeaveForPayroll };

export function compensationLabel(
  compensation: LeaveCompensationType | string
): string {
  return compensation === "unpaid" ? "Unpaid" : "Paid";
}
