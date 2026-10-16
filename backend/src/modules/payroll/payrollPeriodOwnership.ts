import * as payrollPeriodService from "../payrollPeriod/payrollPeriod.service";
import {
  assertPayrollPeriodEditable,
  getPayrollPeriodEditability,
} from "../payrollPeriod/payrollPeriodEditable";
import type { PayrollPeriodRecord } from "../payrollPeriod/payrollPeriod.types";

function yearMonthFromYmd(dateYmd: string): { year: number; month: number } | null {
  if (!dateYmd || dateYmd.length < 7) return null;
  const year = Number(dateYmd.slice(0, 4));
  const month = Number(dateYmd.slice(5, 7));
  if (!Number.isInteger(year) || !Number.isInteger(month)) return null;
  return { year, month };
}

/**
 * Ensure a payroll period exists for the earnings/payroll date and return its id.
 * Throws when the period is approved/locked/archived.
 */
export async function resolveEditablePayrollPeriodId(
  companyId: string,
  dateYmd: string,
  actorUserId?: string | null
): Promise<string> {
  const ym = yearMonthFromYmd(dateYmd.slice(0, 10));
  if (!ym) {
    throw new Error("Valid payroll date is required to resolve payroll period");
  }
  await assertPayrollPeriodEditable(companyId, ym.year, ym.month);
  const period = await payrollPeriodService.getOrCreate(
    companyId,
    ym.year,
    ym.month,
    actorUserId ?? null
  );
  return period.id;
}

/** Soft resolve for silent paths — returns null when period is protected. */
export async function tryResolveEditablePayrollPeriodId(
  companyId: string,
  dateYmd: string,
  actorUserId?: string | null
): Promise<string | null> {
  const ym = yearMonthFromYmd(dateYmd.slice(0, 10));
  if (!ym) return null;
  const editability = await getPayrollPeriodEditability(companyId, ym.year, ym.month);
  if (!editability.editable) return null;
  if (editability.periodId) return editability.periodId;
  const period = await payrollPeriodService.getOrCreate(
    companyId,
    ym.year,
    ym.month,
    actorUserId ?? null
  );
  return period.id;
}

export async function findPeriodForDate(
  companyId: string,
  dateYmd: string
): Promise<PayrollPeriodRecord | null> {
  const ym = yearMonthFromYmd(dateYmd.slice(0, 10));
  if (!ym) return null;
  const { findByCompanyMonth } = await import("../payrollPeriod/payrollPeriod.repository");
  return findByCompanyMonth(companyId, ym.year, ym.month);
}
