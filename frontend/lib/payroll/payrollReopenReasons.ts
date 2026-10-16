export const PAYROLL_REOPEN_REASON_CODES = [
  "missing_manual_ot",
  "attendance_correction",
  "leave_adjustment",
  "bank_rejection",
  "employee_dispute",
  "other",
] as const;

export type PayrollReopenReasonCode = (typeof PAYROLL_REOPEN_REASON_CODES)[number];

export const PAYROLL_REOPEN_REASON_OPTIONS: {
  value: PayrollReopenReasonCode;
  label: string;
}[] = [
  { value: "missing_manual_ot", label: "Missing Manual OT" },
  { value: "attendance_correction", label: "Attendance Correction" },
  { value: "leave_adjustment", label: "Leave Adjustment" },
  { value: "bank_rejection", label: "Bank Rejection" },
  { value: "employee_dispute", label: "Employee Dispute" },
  { value: "other", label: "Other" },
];

export const PAYROLL_REOPEN_EXPLANATION_MIN_LENGTH = 20;
export const PAYROLL_REOPEN_EXPLANATION_MAX_LENGTH = 1000;
