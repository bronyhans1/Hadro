import * as companyPolicyService from "../companyPolicy/companyPolicy.service";
import { syncMonthlySalaryPayroll } from "./salaryEarnings.service";
import { syncHourlyLeavePayrollForMonth } from "./hourlyLeavePayroll.service";
import {
  dedupeYearMonths,
  mergeYearMonthLists,
  utcYearMonthFromCalendarDate,
  previousUtcYearMonth,
  ymTodayUtc,
  type IsoDate,
  type YearMonth,
} from "./salaryEarnings.engine";

export type { YearMonth };

function yearMonthsForInclusiveRange(startYmd: IsoDate, endYmd: IsoDate): YearMonth[] {
  const parts: YearMonth[] = [];
  let y = Number(startYmd.slice(0, 4));
  let m = Number(startYmd.slice(5, 7));
  const endKey = Number(endYmd.slice(0, 4)) * 12 + Number(endYmd.slice(5, 7));
  while (y * 12 + m <= endKey) {
    parts.push({ year: y, month: m });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return dedupeYearMonths(parts);
}

function utcBufferYearMonths(): YearMonth[] {
  const { year, month } = ymTodayUtc();
  return dedupeYearMonths([{ year, month }, previousUtcYearMonth(year, month)]);
}

async function resyncUserLeavePayrollMonths(
  userId: string,
  companyId: string,
  months: YearMonth[]
): Promise<void> {
  if (months.length === 0) return;
  const payrollOn = await companyPolicyService.isPayrollEnabled(companyId);
  if (!payrollOn) return;
  for (const { year, month } of months) {
    await syncMonthlySalaryPayroll(userId, companyId, year, month);
    await syncHourlyLeavePayrollForMonth(userId, companyId, year, month);
  }
}

/** After leave approve / terminate / completion affecting payable dates. */
export function scheduleLeavePayrollResyncForDateRange(
  companyId: string,
  userId: string,
  startYmd: IsoDate,
  endYmd: IsoDate
): void {
  const months = mergeYearMonthLists(
    utcBufferYearMonths(),
    yearMonthsForInclusiveRange(startYmd, endYmd)
  );
  void resyncUserLeavePayrollMonths(userId, companyId, months).catch((err) =>
    console.error("[leave-payroll-resync] user range", userId, startYmd, endYmd, err)
  );
}

export function scheduleLeavePayrollResyncForLeaveRecord(leave: {
  company_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
}): void {
  scheduleLeavePayrollResyncForDateRange(
    leave.company_id,
    leave.user_id,
    leave.start_date.slice(0, 10),
    leave.end_date.slice(0, 10)
  );
}

/** Buffer-month refresh after passive completion sweep. */
export function scheduleCompanyLeavePayrollResync(companyId: string): void {
  const months = utcBufferYearMonths();
  void (async () => {
    const payrollOn = await companyPolicyService.isPayrollEnabled(companyId);
    if (!payrollOn) return;
    // Completion batch may touch many users; buffer resync is handled per-user on explicit lifecycle events.
    // Company hook reserved for future bulk completion payroll refresh.
    void months;
  })().catch((err) => console.error("[leave-payroll-resync] company", companyId, err));
}

export function scheduleLeavePayrollResyncForHolidayLikeDate(
  companyId: string,
  userId: string,
  ymd: IsoDate
): void {
  scheduleLeavePayrollResyncForDateRange(companyId, userId, ymd, ymd);
}

export { utcYearMonthFromCalendarDate };
