import type { LeaveBalanceItem } from "@/lib/api/leaveBalances.api";
import { translate } from "@/lib/i18n";

/** True when the balance has any allocation or usage (not a fully empty bucket). */
export function isLeaveBalanceActive(balance: LeaveBalanceItem): boolean {
  const allocated = Number(balance.allocated_days ?? 0);
  const used = Number(balance.used_days ?? 0);
  const remaining = Number(balance.remaining_days ?? 0);
  return allocated > 0 || used > 0 || remaining > 0;
}

export function filterActiveLeaveBalances(
  balances: LeaveBalanceItem[]
): LeaveBalanceItem[] {
  return balances.filter(isLeaveBalanceActive);
}

export function activeLeaveBalanceSummary(count: number): string {
  return translate("leave.activeBalanceCount", { count });
}
