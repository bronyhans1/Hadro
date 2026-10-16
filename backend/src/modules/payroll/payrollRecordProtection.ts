/**
 * Governance: approved/locked payroll rows must not be overwritten by sync or resync.
 */
export type PayrollRecordStatus = "draft" | "approved" | "locked" | string;

export function isPayrollRecordProtected(status: PayrollRecordStatus | null | undefined): boolean {
  const s = (status ?? "draft").toLowerCase();
  return s === "approved" || s === "locked";
}

export function isPayrollRecordDraft(status: PayrollRecordStatus | null | undefined): boolean {
  return !isPayrollRecordProtected(status);
}
