import * as leaveRepo from "../../leave/leave.repository";
import * as companyPolicy from "../../companyPolicy/companyPolicy.service";
import { isDateWithinLeavePayrollPeriod } from "../../payroll/payrollLeaveCoverage";
import { isPaidLeaveForPayroll } from "../../payroll/leavePayrollClassification";
import { resolveCompanyTodayIso } from "../../payroll/paidLeavePayrollEligibility";
import { addDaysToYmd } from "../../../lib/shiftWindow";
import { emitWorkforceEvent } from "../workforceEvent.registry";
import type { WorkforceEventCreditResult } from "../types";

export type PaidLeaveShiftCloseJobResult = {
  scannedLeaves: number;
  candidateDays: number;
  credited: number;
  skipped: number;
  failed: number;
  details: Array<{
    companyId: string;
    userId: string;
    ownershipYmd: string;
    result: WorkforceEventCreditResult;
  }>;
};

/**
 * 24-hour workforce engine tick: after scheduled shift close, credit paid leave days.
 *
 * Scans leave covering yesterday + today (company-local) so overnight shifts that
 * close after midnight still credit the ownership day.
 */
export async function runPaidLeaveShiftCloseCredits(params?: {
  now?: Date;
  companyId?: string;
}): Promise<PaidLeaveShiftCloseJobResult> {
  const now = params?.now ?? new Date();
  const leaves = await leaveRepo.listLeaveRequestsForWorkforceEventWindow({
    startYmd: addDaysToYmd(now.toISOString().slice(0, 10), -2),
    endYmd: addDaysToYmd(now.toISOString().slice(0, 10), 1),
    companyId: params?.companyId,
  });

  const result: PaidLeaveShiftCloseJobResult = {
    scannedLeaves: leaves.length,
    candidateDays: 0,
    credited: 0,
    skipped: 0,
    failed: 0,
    details: [],
  };

  const policyCache = new Map<string, Awaited<ReturnType<typeof companyPolicy.getPolicy>>>();

  for (const leave of leaves) {
    if (!isPaidLeaveForPayroll(leave)) continue;

    let policy = policyCache.get(leave.company_id);
    if (!policy) {
      policy = await companyPolicy.getPolicy(leave.company_id);
      policyCache.set(leave.company_id, policy);
    }

    const payrollOn = (policy as { payroll_enabled?: boolean }).payroll_enabled !== false;
    if (!payrollOn) continue;

    const todayIso = resolveCompanyTodayIso(policy, now);
    const yesterdayIso = addDaysToYmd(todayIso, -1);

    for (const ownershipYmd of [yesterdayIso, todayIso]) {
      if (!isDateWithinLeavePayrollPeriod(leave, ownershipYmd)) continue;

      result.candidateDays += 1;
      const credit = await emitWorkforceEvent("paid_leave", {
        companyId: leave.company_id,
        userId: leave.user_id,
        ownershipYmd,
        sourceId: leave.id,
        now,
      });

      result.details.push({
        companyId: leave.company_id,
        userId: leave.user_id,
        ownershipYmd,
        result: credit,
      });

      if (credit.status === "credited") result.credited += 1;
      else if (credit.status === "failed") result.failed += 1;
      else result.skipped += 1;
    }
  }

  return result;
}
