import * as repo from "./leave.repository";

/**
 * Passive lifecycle: approved → completed when end_date is before today.
 * Does not touch balances, payroll, or notifications.
 */
export async function completeExpiredApprovedLeaves(params?: {
  companyId?: string;
  asOfDate?: string;
}): Promise<{ completed: number }> {
  return repo.completeExpiredApprovedLeaves(params);
}
