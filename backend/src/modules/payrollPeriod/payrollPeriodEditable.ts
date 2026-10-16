import { ENV } from "../../config/env";
import * as payrollPeriodRepo from "./payrollPeriod.repository";
import {
  formatPayrollPeriodStatusLabel,
  isPayrollPeriodProtectedStatus,
  normalizePayrollPeriodStatus,
  type PayrollPeriodStatus,
} from "./payrollPeriod.constants";

export class PayrollPeriodLockedError extends Error {
  readonly year: number;
  readonly month: number;
  readonly periodLabel: string;
  readonly status: PayrollPeriodStatus | null;

  constructor(
    year: number,
    month: number,
    status: PayrollPeriodStatus | null,
    periodLabel?: string
  ) {
    const label = periodLabel ?? formatPeriodLabel(year, month);
    const statusLabel = status ? formatPayrollPeriodStatusLabel(status) : "protected";
    super(
      `This payroll period (${label}) has been ${statusLabel.toLowerCase()} and cannot be modified. ` +
        `To make changes, reopen the payroll period (Payroll Administrator only) or create a payroll adjustment.`
    );
    this.name = "PayrollPeriodLockedError";
    this.year = year;
    this.month = month;
    this.periodLabel = label;
    this.status = status;
  }
}

function formatPeriodLabel(year: number, month: number): string {
  const names = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${names[month - 1] ?? month} ${year}`;
}

/**
 * Period protection is always on for Phase 18B.
 * ENV flag retained for emergency override (set false only if ops explicitly disable).
 */
export function isPayrollPeriodLockGatesEnabled(): boolean {
  return ENV.PAYROLL_PERIOD_LOCK_GATES_ENABLED !== false;
}

export type PayrollPeriodEditability =
  | { editable: true; periodId: string | null; status: PayrollPeriodStatus | null }
  | {
      editable: false;
      periodId: string;
      status: PayrollPeriodStatus;
      reason: string;
    };

/**
 * Soft check used by silent/automatic payroll paths (clock-out, holiday resync, dashboards).
 * Missing period ⇒ editable (a draft period will be ensured on explicit write).
 */
export async function getPayrollPeriodEditability(
  companyId: string,
  year: number,
  month: number
): Promise<PayrollPeriodEditability> {
  const period = await payrollPeriodRepo.findByCompanyMonth(companyId, year, month);
  if (!period) {
    return { editable: true, periodId: null, status: null };
  }
  const status = normalizePayrollPeriodStatus(period.status) ?? "draft";
  if (!isPayrollPeriodProtectedStatus(status)) {
    return { editable: true, periodId: period.id, status };
  }
  return {
    editable: false,
    periodId: period.id,
    status,
    reason: new PayrollPeriodLockedError(
      period.payroll_year,
      period.payroll_month,
      status,
      formatPeriodLabel(period.payroll_year, period.payroll_month)
    ).message,
  };
}

/**
 * Throws {@link PayrollPeriodLockedError} when the period is approved/locked/archived.
 * Used by explicit payroll regeneration and write paths.
 */
export async function assertPayrollPeriodEditable(
  companyId: string,
  year: number,
  month: number
): Promise<void> {
  if (!isPayrollPeriodLockGatesEnabled()) return;

  const editability = await getPayrollPeriodEditability(companyId, year, month);
  if (editability.editable) return;

  throw new PayrollPeriodLockedError(
    year,
    month,
    editability.status,
    formatPeriodLabel(year, month)
  );
}

/** Assert using a calendar date YYYY-MM-DD (UTC month of date string). */
export async function assertPayrollPeriodEditableForDate(
  companyId: string,
  dateYmd: string
): Promise<void> {
  if (!dateYmd || dateYmd.length < 7) return;
  const year = Number(dateYmd.slice(0, 4));
  const month = Number(dateYmd.slice(5, 7));
  if (!Number.isInteger(year) || !Number.isInteger(month)) return;
  await assertPayrollPeriodEditable(companyId, year, month);
}

export async function getPayrollPeriodEditabilityForDate(
  companyId: string,
  dateYmd: string
): Promise<PayrollPeriodEditability> {
  if (!dateYmd || dateYmd.length < 7) {
    return { editable: true, periodId: null, status: null };
  }
  const year = Number(dateYmd.slice(0, 4));
  const month = Number(dateYmd.slice(5, 7));
  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    return { editable: true, periodId: null, status: null };
  }
  return getPayrollPeriodEditability(companyId, year, month);
}
