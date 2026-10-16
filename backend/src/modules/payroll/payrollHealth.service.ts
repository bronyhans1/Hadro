import * as payrollRepo from "./payroll.repository";
import * as sessionsRepo from "../sessions/sessions.repository";
import * as leaveRepo from "../leave/leave.repository";
import * as syncFailuresRepo from "./payrollSyncFailures.repository";
import {
  computePayrollReadiness,
  countPayrollRecordStatuses,
  countPendingManualOtFromRecords,
  type PayrollHealthCounts,
  type PayrollReadinessResult,
} from "./payrollReadiness.engine";

export type PayrollHealthResponse = {
  period: { year: number; month: number; label: string };
  counts: PayrollHealthCounts;
  readiness: PayrollReadinessResult;
};

function monthBounds(year: number, month: number): { first: string; last: string } {
  const first = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastD = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const last = `${year}-${String(month).padStart(2, "0")}-${String(lastD).padStart(2, "0")}`;
  return { first, last };
}

function formatPeriodLabel(year: number, month: number): string {
  const names = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${names[month - 1] ?? month} ${year}`;
}

function isoDateInMonth(
  iso: string | null | undefined,
  year: number,
  month: number
): boolean {
  if (!iso || iso.length < 7) return false;
  return Number(iso.slice(0, 4)) === year && Number(iso.slice(5, 7)) === month;
}

function sessionInPayrollMonth(
  checkIn: string | null | undefined,
  year: number,
  month: number
): boolean {
  if (!checkIn || checkIn.length < 7) return false;
  return Number(checkIn.slice(0, 4)) === year && Number(checkIn.slice(5, 7)) === month;
}

function countLeaveChangesInMonth(
  rows: leaveRepo.LeaveRequestRecord[],
  year: number,
  month: number
): number {
  let count = 0;
  for (const row of rows) {
    const changed =
      isoDateInMonth(row.approved_at, year, month) ||
      isoDateInMonth(row.terminated_at, year, month) ||
      isoDateInMonth(row.cancelled_at, year, month);
    if (changed) count += 1;
  }
  return count;
}

/** Read-only operational health for a payroll calendar month. */
export async function getPayrollHealth(
  companyId: string,
  year: number,
  month: number
): Promise<PayrollHealthResponse> {
  const { first, last } = monthBounds(year, month);

  const [records, pendingRemote, leaveOverlap, syncFailures] = await Promise.all([
    payrollRepo.getPayrollByMonth(companyId, year, month),
    sessionsRepo.listPendingRemoteSessions(companyId),
    leaveRepo.listLeaveRequestsForReport(
      companyId,
      { rangeStart: first, rangeEnd: last },
      0,
      500
    ),
    syncFailuresRepo.listRecentForCompany(companyId, 200),
  ]);

  const statusCounts = countPayrollRecordStatuses(records);
  const pendingManualOt = countPendingManualOtFromRecords(records);

  const pendingRemoteInMonth = pendingRemote.filter((s) =>
    sessionInPayrollMonth(s.check_in, year, month)
  ).length;

  const leaveChangesInMonth = countLeaveChangesInMonth(leaveOverlap.rows, year, month);

  const syncFailuresInMonth = syncFailures.filter((f) =>
    isoDateInMonth(f.created_at, year, month)
  ).length;

  const recordsRequiringAttention =
    statusCounts.draftRecords + pendingRemoteInMonth + syncFailuresInMonth;

  const counts: PayrollHealthCounts = {
    ...statusCounts,
    pendingManualOt,
    pendingRemoteAttendance: pendingRemoteInMonth,
    leaveChangesInMonth,
    recordsRequiringAttention,
    syncFailuresInMonth,
  };

  const readiness = computePayrollReadiness(counts);

  return {
    period: { year, month, label: formatPeriodLabel(year, month) },
    counts,
    readiness,
  };
}
