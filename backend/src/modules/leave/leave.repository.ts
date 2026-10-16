import { supabaseAdmin } from "../../config/supabase";

export interface LeaveRequestRecord {
  id: string;
  user_id: string;
  company_id: string;
  /** Human-friendly employee display name (resolved from users table when possible). */
  employee_name?: string | null;
  /** Human-friendly employee email (resolved from users table when possible). */
  employee_email?: string | null;
  /** Resolved from users.department_id when enriched. */
  department_name?: string | null;
  start_date: string;
  end_date: string;
  total_days: number;
  leave_type: string;
  leave_compensation_type?: string | null;
  /** Company default snapshotted at create; used to detect HR override. */
  leave_compensation_default?: string | null;
  /**
   * HR-only reason when the request differs from company default (e.g. compensation override).
   * Generic for future leave-level HR exceptions — not paid/unpaid-specific.
   */
  leave_override_reason?: string | null;
  reason: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  cancelled_at?: string | null;
  terminated_at?: string | null;
  terminated_by?: string | null;
  termination_reason?: string | null;
  actual_return_date?: string | null;
  restored_days?: number | null;
  actual_used_days?: number | null;
  completed_at?: string | null;
}

export interface CreateLeaveRequestData {
  user_id: string;
  company_id: string;
  start_date: string;
  end_date: string;
  leave_type: string;
  leave_compensation_type?: string;
  /** Company default at create time (same as type initially). */
  leave_compensation_default?: string;
  reason?: string | null;
  total_days: number;
  /** DB chk_leave_requests_status (lowercase). */
  status: "pending" | "approved" | "rejected" | "cancelled" | "terminated" | "completed";
}

const LEAVE_STATUS_FILTERS = new Set([
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "terminated",
  "completed",
]);

function applyLeaveStatusFilter<T extends { eq: (col: string, val: string) => T }>(
  q: T,
  statusFilter?: string | null
): T {
  const normalized = statusFilter?.trim().toLowerCase();
  if (normalized && LEAVE_STATUS_FILTERS.has(normalized)) {
    return q.eq("status", normalized);
  }
  return q;
}

export async function createLeaveRequest(
  data: CreateLeaveRequestData
): Promise<LeaveRequestRecord> {
  const { data: row, error } = await supabaseAdmin
    .from("leave_requests")
    .insert({
      user_id: data.user_id,
      company_id: data.company_id,
      start_date: data.start_date,
      end_date: data.end_date,
      leave_type: data.leave_type,
      leave_compensation_type: data.leave_compensation_type ?? null,
      leave_compensation_default:
        data.leave_compensation_default ?? data.leave_compensation_type ?? null,
      reason: data.reason ?? null,
      total_days: data.total_days,
      status: data.status,
    })
    .select("*")
    .single();

  if (error) throw error;
  return row as LeaveRequestRecord;
}

export async function getUserLeaveRequests(
  userId: string,
  companyId: string
): Promise<LeaveRequestRecord[]> {
  const { data, error } = await supabaseAdmin
    .from("leave_requests")
    .select("*")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .order("start_date", { ascending: false });

  if (error) throw error;
  const requests = (data ?? []) as LeaveRequestRecord[];
  return enrichLeaveEmployees(requests);
}

export async function getCompanyLeaveRequests(
  companyId: string,
  statusFilter?: string | null,
  /** When set, only requests for these user ids (manager/HR branch scope). */
  filterUserIds?: string[] | null
): Promise<LeaveRequestRecord[]> {
  let q = supabaseAdmin
    .from("leave_requests")
    .select("*")
    .eq("company_id", companyId);

  if (filterUserIds !== undefined && filterUserIds !== null) {
    if (filterUserIds.length === 0) {
      return [];
    }
    q = q.in("user_id", filterUserIds);
  }

  q = applyLeaveStatusFilter(q, statusFilter);

  const { data, error } = await q.order("start_date", { ascending: false });

  if (error) throw error;
  const requests = (data ?? []) as LeaveRequestRecord[];
  return enrichLeaveEmployees(requests);
}

/**
 * Leave rows overlapping [rangeStart, rangeEnd] (inclusive YYYY-MM-DD).
 * Overlap: leave.start_date <= rangeEnd AND leave.end_date >= rangeStart.
 */
export async function listLeaveRequestsForReport(
  companyId: string,
  params: {
    rangeStart: string;
    rangeEnd: string;
    status?: string | null;
    userId?: string | null;
    filterUserIds?: string[] | null;
  },
  offset: number,
  limit: number
): Promise<{ rows: LeaveRequestRecord[]; total: number }> {
  if (
    params.filterUserIds !== undefined &&
    params.filterUserIds !== null &&
    params.filterUserIds.length === 0
  ) {
    return { rows: [], total: 0 };
  }

  let q = supabaseAdmin
    .from("leave_requests")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .lte("start_date", params.rangeEnd)
    .gte("end_date", params.rangeStart)
    .order("start_date", { ascending: false });

  if (params.filterUserIds !== undefined && params.filterUserIds !== null) {
    q = q.in("user_id", params.filterUserIds);
  }
  if (params.userId?.trim()) {
    q = q.eq("user_id", params.userId.trim());
  }
  q = applyLeaveStatusFilter(q, params.status);

  const { data, error, count } = await q.range(
    offset,
    offset + limit - 1
  );

  if (error) throw error;
  const raw = (data ?? []) as LeaveRequestRecord[];
  const rows = await enrichLeaveEmployees(raw);
  return { rows, total: count ?? 0 };
}

export async function getLeaveById(
  leaveId: string
): Promise<LeaveRequestRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("leave_requests")
    .select("*")
    .eq("id", leaveId)
    .maybeSingle();

  if (error) throw error;
  return data as LeaveRequestRecord | null;
}

/** Update final compensation on a pending leave request (HR/Admin override). */
export async function updateLeaveCompensationType(
  leaveId: string,
  companyId: string,
  compensationType: "paid" | "unpaid",
  overrideReason: string | null
): Promise<LeaveRequestRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("leave_requests")
    .update({
      leave_compensation_type: compensationType,
      leave_override_reason: overrideReason,
    })
    .eq("id", leaveId)
    .eq("company_id", companyId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as LeaveRequestRecord | null;
}

export async function updateLeaveStatus(
  leaveId: string,
  status: string,
  approvedBy: string | null,
  approvedAt: string | null
): Promise<LeaveRequestRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("leave_requests")
    .update({
      status,
      approved_by: approvedBy,
      approved_at: approvedAt,
    })
    .eq("id", leaveId)
    .select("*")
    .single();

  if (error) {
    if ((error as { code?: string }).code === "PGRST116") return null;
    throw error;
  }
  return data as LeaveRequestRecord;
}

/**
 * Mark approved leave as completed when end_date is before asOfDate (default: today UTC).
 * Passive lifecycle only — no balance or payroll side effects.
 */
export async function completeExpiredApprovedLeaves(params?: {
  companyId?: string;
  asOfDate?: string;
}): Promise<{ completed: number }> {
  const asOfDate = params?.asOfDate ?? new Date().toISOString().slice(0, 10);
  const completedAt = new Date().toISOString();

  let q = supabaseAdmin
    .from("leave_requests")
    .update({
      status: "completed",
      completed_at: completedAt,
    })
    .eq("status", "approved")
    .lt("end_date", asOfDate);

  if (params?.companyId) {
    q = q.eq("company_id", params.companyId);
  }

  const { data, error } = await q.select("id");
  if (error) throw error;
  return { completed: (data ?? []).length };
}

export async function cancelPendingLeaveRequest(params: {
  leaveId: string;
  companyId: string;
  userId: string;
  cancelledAtIso: string;
}): Promise<LeaveRequestRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("leave_requests")
    .update({
      status: "cancelled",
      cancelled_at: params.cancelledAtIso,
      approved_by: null,
      approved_at: null,
    })
    .eq("id", params.leaveId)
    .eq("company_id", params.companyId)
    .eq("user_id", params.userId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as LeaveRequestRecord | null;
}

async function enrichLeaveEmployees(
  requests: LeaveRequestRecord[]
): Promise<LeaveRequestRecord[]> {
  if (requests.length === 0) return requests;

  const userIds = Array.from(
    new Set(requests.map((r) => r.user_id).filter((id) => typeof id === "string" && id.length > 0))
  );

  if (userIds.length === 0) {
    return requests.map((r) => ({ ...r, employee_name: null, employee_email: null }));
  }

  // Safe fallback: if lookup fails, keep the endpoint working with existing user_id.
  try {
    const { data: users, error } = await supabaseAdmin
      .from("users")
      .select("id, first_name, last_name, email")
      .in("id", userIds);

    if (error) {
      console.error("enrichLeaveEmployees users lookup error", error);
      return requests.map((r) => ({ ...r, employee_name: null, employee_email: null }));
    }

    const userById = new Map<
      string,
      { name: string; email: string | null }
    >(
      (users ?? []).map((u: any) => [
        u.id as string,
        {
          name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(),
          email: u.email ?? null,
        },
      ])
    );

    return requests.map((r) => {
      const resolved = userById.get(r.user_id);
      return {
        ...r,
        employee_name: resolved?.name ?? null,
        employee_email: resolved?.email ?? null,
      };
    });
  } catch (err) {
    console.error("enrichLeaveEmployees exception", err);
    return requests.map((r) => ({ ...r, employee_name: null, employee_email: null }));
  }
}

async function enrichLeaveDepartments(
  requests: LeaveRequestRecord[],
  companyId: string
): Promise<LeaveRequestRecord[]> {
  if (requests.length === 0) return requests;

  const userIds = Array.from(new Set(requests.map((r) => r.user_id).filter(Boolean)));
  if (userIds.length === 0) {
    return requests.map((r) => ({ ...r, department_name: null }));
  }

  try {
    const { data: users, error } = await supabaseAdmin
      .from("users")
      .select("id, department_id")
      .in("id", userIds);

    if (error) {
      console.error("enrichLeaveDepartments users lookup error", error);
      return requests.map((r) => ({ ...r, department_name: null }));
    }

    const deptIds = [
      ...new Set(
        (users ?? [])
          .map((u: { department_id?: string | null }) => u.department_id)
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      ),
    ];

    const deptNameById = new Map<string, string>();
    if (deptIds.length > 0) {
      const { data: depts, error: deptErr } = await supabaseAdmin
        .from("departments")
        .select("id, name")
        .eq("company_id", companyId)
        .in("id", deptIds);
      if (deptErr) {
        console.error("enrichLeaveDepartments departments lookup error", deptErr);
      } else {
        for (const d of (depts ?? []) as Array<{ id: string; name: string }>) {
          deptNameById.set(d.id, d.name);
        }
      }
    }

    const deptByUser = new Map<string, string | null>(
      (users ?? []).map((u: { id: string; department_id?: string | null }) => [
        u.id,
        u.department_id ? deptNameById.get(u.department_id) ?? null : null,
      ])
    );

    return requests.map((r) => ({
      ...r,
      department_name: deptByUser.get(r.user_id) ?? null,
    }));
  } catch (err) {
    console.error("enrichLeaveDepartments exception", err);
    return requests.map((r) => ({ ...r, department_name: null }));
  }
}

/** One transaction: validate balance, increment used_days, set leave approved. */
export async function approveLeaveRequestTransaction(
  leaveId: string,
  companyId: string,
  approverId: string
): Promise<LeaveRequestRecord> {
  const { data, error } = await supabaseAdmin.rpc("approve_leave_request_tx", {
    p_leave_id: leaveId,
    p_company_id: companyId,
    p_approver_id: approverId,
  });

  if (error) {
    const raw =
      (error as { message?: string }).message ??
      (typeof error === "string" ? error : JSON.stringify(error));
    const e = new Error(raw) as Error & { code?: string };
    e.code = mapRpcExceptionCode(raw);
    throw e;
  }

  if (!data) {
    throw Object.assign(new Error("approve_leave_request_tx returned no data"), { code: "empty" });
  }

  const row = (Array.isArray(data) ? data[0] : data) as LeaveRequestRecord;
  return row;
}

/** One transaction: validate approved + compute restored days + restore balance + mark terminated. */
export async function terminateLeaveRequestTransaction(params: {
  leaveId: string;
  companyId: string;
  terminatorId: string;
  actualReturnDate: string; // YYYY-MM-DD
  reason?: string | null;
}): Promise<LeaveRequestRecord> {
  const { data, error } = await supabaseAdmin.rpc("terminate_leave_request_tx", {
    p_leave_id: params.leaveId,
    p_company_id: params.companyId,
    p_terminator_id: params.terminatorId,
    p_actual_return_date: params.actualReturnDate,
    p_reason: params.reason ?? null,
  });

  if (error) {
    const raw =
      (error as { message?: string }).message ??
      (typeof error === "string" ? error : JSON.stringify(error));
    const e = new Error(raw) as Error & { code?: string };
    e.code = mapRpcExceptionCode(raw);
    throw e;
  }

  if (!data) {
    throw Object.assign(new Error("terminate_leave_request_tx returned no data"), { code: "empty" });
  }

  const row = (Array.isArray(data) ? data[0] : data) as LeaveRequestRecord;
  return row;
}

function mapRpcExceptionCode(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("leave_not_found")) return "leave_not_found";
  if (m.includes("leave_not_pending")) return "leave_not_pending";
  if (m.includes("leave_not_approved")) return "leave_not_approved";
  if (m.includes("leave_not_active")) return "leave_not_active";
  if (m.includes("invalid_return_date")) return "invalid_return_date";
  if (m.includes("leave_balance_missing")) return "leave_balance_missing";
  if (m.includes("leave_balance_insufficient")) return "leave_balance_insufficient";
  if (m.includes("leave_balance_restore_exceeds")) return "leave_balance_restore_exceeds";
  return "unknown";
}

/**
 * Returns approved leave_requests where today is between start_date and end_date (inclusive).
 * todayDate: "YYYY-MM-DD" (defaults to current date if not provided).
 */
export async function getApprovedLeavesForToday(
  companyId: string,
  todayDate?: string
): Promise<LeaveRequestRecord[]> {
  const today = todayDate ?? new Date().toISOString().slice(0, 10);

  const { data, error } = await supabaseAdmin
    .from("leave_requests")
    .select("*")
    .eq("company_id", companyId)
    .eq("status", "approved")
    .lte("start_date", today)
    .gte("end_date", today);

  if (error) throw error;
  return (data ?? []) as LeaveRequestRecord[];
}

/** Single approved leave covering dateYmd for one employee (attendance governance). */
export async function findApprovedLeaveCoveringDate(
  userId: string,
  companyId: string,
  dateYmd: string
): Promise<LeaveRequestRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("leave_requests")
    .select("*")
    .eq("company_id", companyId)
    .eq("user_id", userId)
    .eq("status", "approved")
    .lte("start_date", dateYmd)
    .gte("end_date", dateYmd)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as LeaveRequestRecord | null;
}

/**
 * Approved leave where asOfDate falls within [start_date, end_date] (inclusive).
 * Enriched with employee and department for manager visibility.
 */
export async function getCurrentlyOnLeave(
  companyId: string,
  todayDate?: string,
  filterUserIds?: string[] | null
): Promise<LeaveRequestRecord[]> {
  let rows = await getApprovedLeavesForToday(companyId, todayDate);
  if (filterUserIds !== undefined && filterUserIds !== null) {
    const allow = new Set(filterUserIds);
    rows = rows.filter((r) => allow.has(r.user_id));
  }
  rows = await enrichLeaveEmployees(rows);
  return enrichLeaveDepartments(rows, companyId);
}

/**
 * Approved leave_requests overlapping [startDate, endDate] (inclusive).
 * Use to exclude (user_id, date) from absence when date is within an approved leave.
 */
export async function getApprovedLeavesInRange(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<LeaveRequestRecord[]> {
  const { data, error } = await supabaseAdmin
    .from("leave_requests")
    .select("*")
    .eq("company_id", companyId)
    .eq("status", "approved")
    .lte("start_date", endDate)
    .gte("end_date", startDate);

  if (error) throw error;
  return (data ?? []) as LeaveRequestRecord[];
}

/**
 * Leave rows that may affect payroll day classification (approved, terminated, completed).
 * Date overlap uses request calendar bounds; terminated effective end uses actual_return_date in pure logic.
 */
export async function listLeaveRequestsForPayrollCoverage(
  userId: string,
  companyId: string,
  startDate: string,
  endDate: string
): Promise<LeaveRequestRecord[]> {
  const { data, error } = await supabaseAdmin
    .from("leave_requests")
    .select("*")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .in("status", ["approved", "terminated", "completed"])
    .lte("start_date", endDate)
    .gte("end_date", startDate)
    .order("start_date", { ascending: true });

  if (error) throw error;
  return (data ?? []) as LeaveRequestRecord[];
}

/**
 * Cross-company leave scan for the workforce shift-close engine.
 * Overlap filter uses request calendar bounds; per-day coverage is resolved in pure logic.
 */
export async function listLeaveRequestsForWorkforceEventWindow(params: {
  startYmd: string;
  endYmd: string;
  companyId?: string;
}): Promise<LeaveRequestRecord[]> {
  let q = supabaseAdmin
    .from("leave_requests")
    .select("*")
    .in("status", ["approved", "terminated", "completed"])
    .lte("start_date", params.endYmd)
    .gte("end_date", params.startYmd)
    .order("company_id", { ascending: true })
    .order("user_id", { ascending: true });

  if (params.companyId) {
    q = q.eq("company_id", params.companyId);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as LeaveRequestRecord[];
}
