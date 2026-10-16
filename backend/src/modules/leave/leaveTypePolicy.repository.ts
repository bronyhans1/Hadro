import { supabaseAdmin } from "../../config/supabase";
import {
  DEFAULT_LEAVE_COMPENSATION,
  LEAVE_TYPES,
  type LeaveCompensationType,
  type LeaveType,
} from "./leaveTypes";

export type CompanyLeaveTypePolicyRecord = {
  id: string;
  company_id: string;
  leave_type: string;
  compensation_type: string;
  created_at: string;
  updated_at: string;
};

export async function listPoliciesForCompany(
  companyId: string
): Promise<CompanyLeaveTypePolicyRecord[]> {
  const { data, error } = await supabaseAdmin
    .from("company_leave_type_policies")
    .select("*")
    .eq("company_id", companyId)
    .order("leave_type", { ascending: true });

  if (error) throw error;
  return (data ?? []) as CompanyLeaveTypePolicyRecord[];
}

export async function getPolicyForLeaveType(
  companyId: string,
  leaveType: LeaveType
): Promise<CompanyLeaveTypePolicyRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("company_leave_type_policies")
    .select("*")
    .eq("company_id", companyId)
    .eq("leave_type", leaveType)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as CompanyLeaveTypePolicyRecord | null;
}

export async function upsertPolicy(params: {
  companyId: string;
  leaveType: LeaveType;
  compensationType: LeaveCompensationType;
}): Promise<CompanyLeaveTypePolicyRecord> {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("company_leave_type_policies")
    .upsert(
      {
        company_id: params.companyId,
        leave_type: params.leaveType,
        compensation_type: params.compensationType,
        updated_at: now,
      },
      { onConflict: "company_id,leave_type" }
    )
    .select("*")
    .single();

  if (error) throw error;
  return data as CompanyLeaveTypePolicyRecord;
}

/** Insert default rows for any missing leave types (idempotent; does not overwrite). */
export async function ensureDefaultPoliciesForCompany(
  companyId: string
): Promise<void> {
  const existing = await listPoliciesForCompany(companyId);
  const have = new Set(existing.map((r) => r.leave_type.trim().toLowerCase()));
  const missing = LEAVE_TYPES.filter((t) => !have.has(t));
  if (missing.length === 0) return;

  const rows = missing.map((leaveType) => ({
    company_id: companyId,
    leave_type: leaveType,
    compensation_type: DEFAULT_LEAVE_COMPENSATION[leaveType],
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabaseAdmin.from("company_leave_type_policies").insert(rows);
  if (error) throw error;
}
