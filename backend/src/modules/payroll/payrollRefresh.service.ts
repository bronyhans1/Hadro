import * as companyPolicy from "../companyPolicy/companyPolicy.service";
import { normalizeBusinessTimeZone, yearMonthTodayInTimeZone } from "../../lib/businessCalendar";
import { syncMonthlySalaryPayroll } from "./salaryEarnings.service";
import { syncHourlyLeavePayrollForMonth } from "./hourlyLeavePayroll.service";

/**
 * Rebuild draft payroll rows for the company-local current month before reads.
 * Keeps GET /api/payroll/me aligned with GET /api/payroll/earnings/me (leave Phase B).
 */
export async function refreshUserPayrollForDashboardMonth(
  userId: string,
  companyId: string
): Promise<void> {
  const payrollOn = await companyPolicy.isPayrollEnabled(companyId);
  if (!payrollOn) return;

  const policy = await companyPolicy.getPolicy(companyId);
  const tz = normalizeBusinessTimeZone(
    (policy as { business_timezone?: string | null }).business_timezone
  );
  const { year, month } = yearMonthTodayInTimeZone(new Date(), tz);

  await syncMonthlySalaryPayroll(userId, companyId, year, month);
  await syncHourlyLeavePayrollForMonth(userId, companyId, year, month);
}
