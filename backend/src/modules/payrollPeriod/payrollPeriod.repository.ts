import { supabaseAdmin } from "../../config/supabase";
import { PAYROLL_PERIOD_DEFAULT_STATUS } from "./payrollPeriod.constants";
import type {
  CreatePayrollPeriodData,
  PayrollPeriodListOptions,
  PayrollPeriodListResult,
  PayrollPeriodRecord,
  PayrollPeriodTransitionUpdate,
} from "./payrollPeriod.types";

export async function findByCompanyMonth(
  companyId: string,
  year: number,
  month: number
): Promise<PayrollPeriodRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("payroll_periods")
    .select("*")
    .eq("company_id", companyId)
    .eq("payroll_year", year)
    .eq("payroll_month", month)
    .maybeSingle();

  if (error) throw error;
  return data as PayrollPeriodRecord | null;
}

export async function findById(
  id: string,
  companyId: string
): Promise<PayrollPeriodRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("payroll_periods")
    .select("*")
    .eq("id", id)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) throw error;
  return data as PayrollPeriodRecord | null;
}

export async function listByCompany(
  companyId: string,
  options: PayrollPeriodListOptions = {}
): Promise<PayrollPeriodListResult> {
  const limit = options.limit ?? 24;
  const offset = options.offset ?? 0;

  let q = supabaseAdmin
    .from("payroll_periods")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .order("payroll_year", { ascending: false })
    .order("payroll_month", { ascending: false });

  if (options.year !== undefined) {
    q = q.eq("payroll_year", options.year);
  }
  if (options.status !== undefined) {
    q = q.eq("status", options.status);
  }

  const { data, error, count } = await q.range(offset, offset + limit - 1);
  if (error) throw error;

  return {
    periods: (data ?? []) as PayrollPeriodRecord[],
    total: count ?? 0,
  };
}

export async function create(
  data: CreatePayrollPeriodData
): Promise<PayrollPeriodRecord> {
  const now = new Date().toISOString();
  const payload = {
    company_id: data.company_id,
    payroll_year: data.payroll_year,
    payroll_month: data.payroll_month,
    status: PAYROLL_PERIOD_DEFAULT_STATUS,
    business_timezone: data.business_timezone,
    generated_at: now,
    generated_by: data.generated_by ?? null,
    created_at: now,
    updated_at: now,
  };

  const { data: row, error } = await supabaseAdmin
    .from("payroll_periods")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return row as PayrollPeriodRecord;
}

/**
 * Idempotent draft period creation via ON CONFLICT DO NOTHING semantics.
 * Returns the existing row when the company/month already exists.
 */
export async function upsertDraft(
  data: CreatePayrollPeriodData
): Promise<PayrollPeriodRecord> {
  const now = new Date().toISOString();
  const payload = {
    company_id: data.company_id,
    payroll_year: data.payroll_year,
    payroll_month: data.payroll_month,
    status: PAYROLL_PERIOD_DEFAULT_STATUS,
    business_timezone: data.business_timezone,
    generated_at: now,
    generated_by: data.generated_by ?? null,
    updated_at: now,
  };

  const { error } = await supabaseAdmin.from("payroll_periods").upsert(payload, {
    onConflict: "company_id,payroll_year,payroll_month",
    ignoreDuplicates: true,
  });

  if (error) throw error;

  const row = await findByCompanyMonth(
    data.company_id,
    data.payroll_year,
    data.payroll_month
  );
  if (!row) {
    throw new Error("payroll period upsert failed: row not found after upsert");
  }
  return row;
}

export async function updateTransition(
  id: string,
  companyId: string,
  updates: PayrollPeriodTransitionUpdate
): Promise<PayrollPeriodRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("payroll_periods")
    .update(updates)
    .eq("id", id)
    .eq("company_id", companyId)
    .select("*")
    .single();

  if (error) {
    if ((error as { code?: string }).code === "PGRST116") return null;
    throw error;
  }
  return data as PayrollPeriodRecord;
}
