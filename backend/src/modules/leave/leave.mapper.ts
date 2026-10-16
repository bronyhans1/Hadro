import type { LeaveRequestRecord } from "./leave.repository";
import { leaveDaysRemaining } from "./leaveLifecycle";

function normalizeCompensation(
  raw: string | null | undefined
): "paid" | "unpaid" {
  return (raw ?? "").trim().toLowerCase() === "unpaid" ? "unpaid" : "paid";
}

/** API shape: uppercase status + reviewed_* aliases (DB columns: approved_by / approved_at). */
export interface LeaveRequestApi {
  id: string;
  user_id: string;
  company_id: string;
  employee_name?: string | null;
  employee_email?: string | null;
  start_date: string;
  end_date: string;
  total_days: number;
  leave_type: string;
  /** Final compensation for this request (Workforce Events / payroll). */
  leave_compensation_type?: string | null;
  /** Company default snapshotted at create. */
  leave_compensation_default?: string | null;
  /** True when final compensation differs from company default. */
  leave_compensation_overridden?: boolean;
  /** default | override — for reports / badges. */
  leave_compensation_source?: "default" | "override";
  /**
   * HR-only override reason. Omitted/null for employee-facing responses.
   */
  leave_override_reason?: string | null;
  reason: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "TERMINATED" | "COMPLETED" | string;
  approved_by: string | null;
  approved_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  cancelled_at?: string | null;
  terminated_at?: string | null;
  terminated_by?: string | null;
  termination_reason?: string | null;
  actual_return_date?: string | null;
  restored_days?: number | null;
  actual_used_days?: number | null;
  completed_at?: string | null;
}

export type ToLeaveApiOptions = {
  /** When false (default), strip HR-only override reason for employee views. */
  includeOverrideReason?: boolean;
};

export function toLeaveApi(
  row: LeaveRequestRecord,
  options?: ToLeaveApiOptions
): LeaveRequestApi {
  const raw = (row.status ?? "pending").toLowerCase();
  const status =
    raw === "approved"
      ? "APPROVED"
      : raw === "rejected"
        ? "REJECTED"
        : raw === "cancelled"
          ? "CANCELLED"
          : raw === "terminated"
            ? "TERMINATED"
            : raw === "completed"
              ? "COMPLETED"
              : "PENDING";
  const current = normalizeCompensation(row.leave_compensation_type);
  const companyDefault = normalizeCompensation(
    row.leave_compensation_default ?? row.leave_compensation_type
  );
  const overridden = current !== companyDefault;
  const includeReason = options?.includeOverrideReason === true;
  const reasonRaw = (row.leave_override_reason ?? "").trim();

  return {
    ...row,
    status,
    leave_compensation_type: current,
    leave_compensation_default: companyDefault,
    leave_compensation_overridden: overridden,
    leave_compensation_source: overridden ? "override" : "default",
    leave_override_reason: includeReason && overridden && reasonRaw ? reasonRaw : null,
    reviewed_by: row.approved_by ?? null,
    reviewed_at: row.approved_at ?? null,
  };
}

export function toLeaveApiList(
  rows: LeaveRequestRecord[],
  options?: ToLeaveApiOptions
): LeaveRequestApi[] {
  return rows.map((r) => toLeaveApi(r, options));
}

export interface CurrentlyOnLeaveApi {
  id: string;
  user_id: string;
  employee_name: string | null;
  employee_email: string | null;
  department: string | null;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  days_remaining: number;
  status: string;
}

export function toCurrentlyOnLeaveApi(
  row: LeaveRequestRecord,
  asOfDate?: string
): CurrentlyOnLeaveApi {
  const api = toLeaveApi(row);
  return {
    id: api.id,
    user_id: api.user_id,
    employee_name: row.employee_name ?? null,
    employee_email: row.employee_email ?? null,
    department: row.department_name ?? null,
    leave_type: api.leave_type,
    start_date: api.start_date,
    end_date: api.end_date,
    total_days: api.total_days,
    days_remaining: leaveDaysRemaining(api.end_date, asOfDate),
    status: api.status,
  };
}

export function toCurrentlyOnLeaveApiList(
  rows: LeaveRequestRecord[],
  asOfDate?: string
): CurrentlyOnLeaveApi[] {
  return rows.map((r) => toCurrentlyOnLeaveApi(r, asOfDate));
}
