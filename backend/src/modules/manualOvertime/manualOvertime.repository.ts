import { supabaseAdmin } from "../../config/supabase";
import type { ManualOvertimeEntryStatus } from "../../constants/manualOvertime";

export interface ManualOvertimeEntryRecord {
  id: string;
  company_id: string;
  user_id: string;
  earnings_date: string;
  hours: number;
  reason: string;
  reason_code: string | null;
  status: ManualOvertimeEntryStatus;
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejection_reason: string | null;
  payroll_record_id: string | null;
  overlap_warning_acknowledged: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateManualOvertimeEntryData {
  company_id: string;
  user_id: string;
  earnings_date: string;
  hours: number;
  reason: string;
  reason_code?: string | null;
  status: ManualOvertimeEntryStatus;
  created_by: string;
  approved_by?: string | null;
  approved_at?: string | null;
  payroll_record_id?: string | null;
  overlap_warning_acknowledged: boolean;
}

export interface ListManualOvertimeFilters {
  companyId: string;
  year: number;
  month: number;
  userId?: string;
  status?: ManualOvertimeEntryStatus;
  scopedUserIds?: string[];
}

function monthRange(year: number, month: number): { first: string; last: string } {
  const first = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastD = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const last = `${year}-${String(month).padStart(2, "0")}-${String(lastD).padStart(2, "0")}`;
  return { first, last };
}

export async function insertManualOvertimeEntry(
  data: CreateManualOvertimeEntryData
): Promise<ManualOvertimeEntryRecord> {
  const payload = {
    company_id: data.company_id,
    user_id: data.user_id,
    earnings_date: data.earnings_date.slice(0, 10),
    hours: data.hours,
    reason: data.reason,
    reason_code: data.reason_code ?? null,
    status: data.status,
    created_by: data.created_by,
    approved_by: data.approved_by ?? null,
    approved_at: data.approved_at ?? null,
    payroll_record_id: data.payroll_record_id ?? null,
    overlap_warning_acknowledged: data.overlap_warning_acknowledged,
    updated_at: new Date().toISOString(),
  };

  const { data: row, error } = await supabaseAdmin
    .from("manual_overtime_entries")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return row as ManualOvertimeEntryRecord;
}

export async function getManualOvertimeEntryById(
  id: string,
  companyId: string
): Promise<ManualOvertimeEntryRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("manual_overtime_entries")
    .select("*")
    .eq("id", id)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) throw error;
  return data as ManualOvertimeEntryRecord | null;
}

export async function updateManualOvertimeEntryPayrollLink(
  entryId: string,
  companyId: string,
  payrollRecordId: string
): Promise<ManualOvertimeEntryRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("manual_overtime_entries")
    .update({
      payroll_record_id: payrollRecordId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", entryId)
    .eq("company_id", companyId)
    .select("*")
    .single();

  if (error) {
    if ((error as { code?: string }).code === "PGRST116") return null;
    throw error;
  }
  return data as ManualOvertimeEntryRecord;
}

export async function cancelManualOvertimeEntry(
  entryId: string,
  companyId: string
): Promise<ManualOvertimeEntryRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("manual_overtime_entries")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", entryId)
    .eq("company_id", companyId)
    .in("status", ["draft", "approved"])
    .select("*")
    .single();

  if (error) {
    if ((error as { code?: string }).code === "PGRST116") return null;
    throw error;
  }
  return data as ManualOvertimeEntryRecord;
}

export async function listManualOvertimeEntries(
  filters: ListManualOvertimeFilters
): Promise<ManualOvertimeEntryRecord[]> {
  const { first, last } = monthRange(filters.year, filters.month);
  let query = supabaseAdmin
    .from("manual_overtime_entries")
    .select("*")
    .eq("company_id", filters.companyId)
    .gte("earnings_date", first)
    .lte("earnings_date", last)
    .order("earnings_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.userId) {
    query = query.eq("user_id", filters.userId);
  }
  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.scopedUserIds) {
    if (filters.scopedUserIds.length === 0) return [];
    query = query.in("user_id", filters.scopedUserIds);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ManualOvertimeEntryRecord[];
}

export async function sumAttendanceOvertimeMinutesForDate(
  userId: string,
  companyId: string,
  earningsDate: string
): Promise<{ totalMinutes: number; sessionCount: number }> {
  const date = earningsDate.slice(0, 10);
  const { data, error } = await supabaseAdmin
    .from("payroll_records")
    .select("overtime_minutes")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .eq("record_type", "session_hourly")
    .eq("payroll_date", date);

  if (error) throw error;
  const rows = data ?? [];
  let totalMinutes = 0;
  for (const row of rows) {
    const m = (row as { overtime_minutes?: number }).overtime_minutes;
    if (typeof m === "number" && m > 0) totalMinutes += m;
  }
  return { totalMinutes, sessionCount: rows.length };
}

export async function sumExistingManualOvertimeMinutesForDate(
  userId: string,
  companyId: string,
  earningsDate: string
): Promise<{ totalMinutes: number; entryCount: number }> {
  const date = earningsDate.slice(0, 10);
  const { data, error } = await supabaseAdmin
    .from("manual_overtime_entries")
    .select("hours")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .eq("earnings_date", date)
    .eq("status", "approved");

  if (error) throw error;
  const rows = data ?? [];
  let totalMinutes = 0;
  for (const row of rows) {
    const h = (row as { hours?: number }).hours;
    if (typeof h === "number" && h > 0) totalMinutes += h * 60;
  }
  return { totalMinutes, entryCount: rows.length };
}

export async function deleteManualOvertimeEntry(
  entryId: string,
  companyId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("manual_overtime_entries")
    .delete()
    .eq("id", entryId)
    .eq("company_id", companyId);
  if (error) throw error;
}
