import { supabaseAdmin } from "../../config/supabase";
import { normalizeLeaveType } from "./leaveTypes";

export interface LeaveBalanceRecord {
  id: string;
  user_id: string;
  company_id: string;
  leave_type: string;
  total_days: number;
  used_days: number;
  updated_at: string;
}

export interface CreateLeaveBalanceData {
  user_id: string;
  company_id: string;
  leave_type: string;
  total_days: number;
  used_days: number;
}

/** HR allocation edits only — used_days is mutated by leave lifecycle RPCs, not this path. */
export interface UpdateLeaveBalanceData {
  total_days?: number;
}

export async function getLeaveBalanceByType(
  userId: string,
  companyId: string,
  leaveType: string
): Promise<LeaveBalanceRecord | null> {
  const normalized = normalizeLeaveType(leaveType);
  if (!normalized) return null;

  const { data, error } = await supabaseAdmin
    .from("leave_balances")
    .select("*")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .eq("leave_type", normalized)
    .maybeSingle();

  if (error) throw error;
  return data as LeaveBalanceRecord | null;
}

/** @deprecated Use getLeaveBalanceByType — returns annual bucket if present. */
export async function getLeaveBalance(
  userId: string,
  companyId: string
): Promise<LeaveBalanceRecord | null> {
  return getLeaveBalanceByType(userId, companyId, "annual");
}

export async function getLeaveBalancesForUser(
  userId: string,
  companyId: string
): Promise<LeaveBalanceRecord[]> {
  const { data, error } = await supabaseAdmin
    .from("leave_balances")
    .select("*")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .order("leave_type", { ascending: true });

  if (error) throw error;
  return (data ?? []) as LeaveBalanceRecord[];
}

export async function createLeaveBalance(
  data: CreateLeaveBalanceData
): Promise<LeaveBalanceRecord> {
  const leaveType = normalizeLeaveType(data.leave_type);
  if (!leaveType) {
    throw new Error("invalid_leave_type");
  }

  const now = new Date().toISOString();
  const { data: row, error } = await supabaseAdmin
    .from("leave_balances")
    .insert({
      user_id: data.user_id,
      company_id: data.company_id,
      leave_type: leaveType,
      total_days: data.total_days,
      used_days: data.used_days,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) throw error;
  return row as LeaveBalanceRecord;
}

export async function getLeaveBalanceById(
  id: string,
  companyId: string
): Promise<LeaveBalanceRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("leave_balances")
    .select("*")
    .eq("id", id)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) throw error;
  return data as LeaveBalanceRecord | null;
}

export async function updateLeaveBalanceById(
  id: string,
  companyId: string,
  data: UpdateLeaveBalanceData
): Promise<LeaveBalanceRecord | null> {
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (data.total_days !== undefined) updates.total_days = data.total_days;

  if (Object.keys(updates).length === 1) {
    return getLeaveBalanceById(id, companyId);
  }

  const { data: row, error } = await supabaseAdmin
    .from("leave_balances")
    .update(updates)
    .eq("id", id)
    .eq("company_id", companyId)
    .select("*")
    .single();

  if (error) {
    if ((error as { code?: string }).code === "PGRST116") return null;
    throw error;
  }
  return row as LeaveBalanceRecord;
}

export async function getCompanyLeaveBalances(
  companyId: string,
  filterUserIds?: string[] | null
): Promise<LeaveBalanceRecord[]> {
  let q = supabaseAdmin
    .from("leave_balances")
    .select("*")
    .eq("company_id", companyId)
    .order("leave_type", { ascending: true });

  if (filterUserIds !== undefined && filterUserIds !== null) {
    if (filterUserIds.length === 0) {
      return [];
    }
    q = q.in("user_id", filterUserIds);
  }

  const { data, error } = await q;

  if (error) throw error;
  return (data ?? []) as LeaveBalanceRecord[];
}
