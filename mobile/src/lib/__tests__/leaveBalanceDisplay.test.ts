import { setActiveLocale } from "../../../../shared/i18n";
import {
  activeLeaveBalanceSummary,
  filterActiveLeaveBalances,
  isLeaveBalanceActive,
} from "../leave/leaveBalanceDisplay";
import type { LeaveBalanceItem } from "@/lib/api/leaveBalances.api";

function row(partial: Partial<LeaveBalanceItem>): LeaveBalanceItem {
  return {
    id: "1",
    user_id: "u",
    company_id: "c",
    leave_type: "annual",
    allocated_days: 0,
    used_days: 0,
    remaining_days: 0,
    total_days: 0,
    leave_compensation_type: "paid",
    leave_type_label: "Annual",
    updated_at: "",
    ...partial,
  };
}

describe("isLeaveBalanceActive", () => {
  it("is active when remaining > 0", () => {
    expect(isLeaveBalanceActive(row({ remaining_days: 1 }))).toBe(true);
  });

  it("is inactive when all zero", () => {
    expect(isLeaveBalanceActive(row({}))).toBe(false);
  });

  it("filters list", () => {
    const list = [
      row({ id: "a", remaining_days: 5 }),
      row({ id: "b" }),
      row({ id: "c", used_days: 2 }),
    ];
    expect(filterActiveLeaveBalances(list).map((b) => b.id)).toEqual(["a", "c"]);
  });

  it("summarizes one assigned annual balance", () => {
    const list = filterActiveLeaveBalances([
      row({ leave_type: "annual", allocated_days: 12, remaining_days: 12 }),
    ]);
    setActiveLocale("en");
    expect(list).toHaveLength(1);
    expect(activeLeaveBalanceSummary(list.length)).toBe("1 active leave balance");
    setActiveLocale("en");
  });
});
