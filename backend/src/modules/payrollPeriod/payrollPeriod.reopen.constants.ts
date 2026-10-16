export const PAYROLL_REOPEN_REASON_CODES = [
  "missing_manual_ot",
  "attendance_correction",
  "leave_adjustment",
  "bank_rejection",
  "employee_dispute",
  "other",
] as const;

export type PayrollReopenReasonCode = (typeof PAYROLL_REOPEN_REASON_CODES)[number];

export const PAYROLL_REOPEN_REASON_LABELS: Record<PayrollReopenReasonCode, string> = {
  missing_manual_ot: "Missing Manual OT",
  attendance_correction: "Attendance Correction",
  leave_adjustment: "Leave Adjustment",
  bank_rejection: "Bank Rejection",
  employee_dispute: "Employee Dispute",
  other: "Other",
};

export const PAYROLL_REOPEN_EXPLANATION_MIN_LENGTH = 20;
export const PAYROLL_REOPEN_EXPLANATION_MAX_LENGTH = 1000;
