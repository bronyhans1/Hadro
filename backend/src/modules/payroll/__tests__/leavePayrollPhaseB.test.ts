import {
  isDateWithinLeavePayrollPeriod,
  resolveLeaveCoverageForDate,
} from "../payrollLeaveCoverage";
import type { LeaveRequestRecord } from "../../leave/leave.repository";
import { resolveMonthlyWorkingDayPayroll } from "../salaryLeavePayroll.engine";

function leaveRow(
  partial: Partial<LeaveRequestRecord> & Pick<LeaveRequestRecord, "status" | "start_date" | "end_date">
): LeaveRequestRecord {
  return {
    id: partial.id ?? "leave-1",
    user_id: "u1",
    company_id: "c1",
    total_days: 5,
    leave_type: partial.leave_type ?? "annual",
    reason: null,
    approved_by: null,
    approved_at: null,
    ...partial,
  };
}

describe("leave payroll integration (Phase B coverage + monthly credit)", () => {
  test("terminated leave: day before return is payable; return day is not", () => {
    const terminated = leaveRow({
      status: "terminated",
      start_date: "2026-06-01",
      end_date: "2026-06-10",
      actual_return_date: "2026-06-04",
      leave_compensation_type: "paid",
    });
    expect(isDateWithinLeavePayrollPeriod(terminated, "2026-06-03")).toBe(true);
    expect(isDateWithinLeavePayrollPeriod(terminated, "2026-06-04")).toBe(false);

    const cov = resolveLeaveCoverageForDate([terminated], "2026-06-03");
    expect(cov?.payrollDayClassification).toBe("PAID_LEAVE");
    const monthly = resolveMonthlyWorkingDayPayroll({
      leaveClassification: cov?.payrollDayClassification,
      workedMinutes: 0,
      classificationEnabled: false,
      thresholds: { min: 60, full: 480 },
      dailyRate: 200,
    });
    expect(monthly.gross).toBe(200);
  });

  test("cancelled leave has no payroll coverage", () => {
    const cancelled = leaveRow({
      status: "cancelled",
      start_date: "2026-06-01",
      end_date: "2026-06-05",
      leave_compensation_type: "paid",
    });
    expect(resolveLeaveCoverageForDate([cancelled], "2026-06-03")).toBeNull();
  });
});
