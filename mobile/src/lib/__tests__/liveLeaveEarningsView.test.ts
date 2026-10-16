import { toLiveEarnedLeaveView } from "../payroll/liveLeaveEarningsView";
import type { EarningsSummary } from "@/lib/api/payroll.api";

function baseMonthly(overrides: Partial<EarningsSummary> = {}): EarningsSummary {
  return {
    rate_type: "monthly",
    monthly_salary: 6000,
    expected_monthly_salary: 6000,
    daily_rate: 200,
    payable_days_in_month: 30,
    paid_days: 2,
    unpaid_days: 0,
    today_earned: 200,
    today_base_before_late: 200,
    today_late_deduction: 0,
    month_earned_total: 400,
    month_earned_salary_daily: 400,
    month_earned_hourly: 0,
    divisor_type: "fixed_days",
    calendar_today: "2026-06-16",
    payroll_leave_readiness: {
      today_payroll_day_classification: "PAID_LEAVE",
      today_covered_by_approved_paid_leave: true,
      today_leave_request_id: "leave-1",
    },
    daily_history: [
      {
        date: "2026-06-16",
        gross: 200,
        record_type: "salary_daily",
        earning_source: "paid_leave",
        payroll_day_classification: "PAID_LEAVE",
      },
      {
        date: "2026-06-15",
        gross: 200,
        record_type: "salary_daily",
        earning_source: "paid_leave",
        payroll_day_classification: "PAID_LEAVE",
      },
    ],
    ...overrides,
  };
}

describe("toLiveEarnedLeaveView", () => {
  test("preserves today's paid leave after shift-close credit", () => {
    const input = baseMonthly();
    const view = toLiveEarnedLeaveView(input);
    expect(view).toEqual(input);
    expect(view.today_earned).toBe(200);
    expect(view.daily_history.map((r) => r.date)).toEqual(["2026-06-16", "2026-06-15"]);
  });

  test("leaves non-leave days unchanged", () => {
    const input = baseMonthly({
      payroll_leave_readiness: {
        today_payroll_day_classification: "WORKING",
        today_covered_by_approved_paid_leave: false,
        today_leave_request_id: null,
      },
    });
    expect(toLiveEarnedLeaveView(input)).toEqual(input);
  });
});
