import type { LeaveRequestRecord } from "../../leave/leave.repository";
import { computeRestoredDaysFromTermination } from "../../leave/leaveTerminationMath";
import {
  isDateWithinLeavePayrollPeriod,
  payrollDayClassificationFromCoverage,
  resolveLeaveCoverageForDate,
} from "../payrollLeaveCoverage";

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

describe("payrollLeaveCoverage lifecycle", () => {
  const approvedPaid = leaveRow({
    id: "paid-annual",
    status: "approved",
    start_date: "2026-06-01",
    end_date: "2026-06-10",
    leave_compensation_type: "paid",
  });

  const approvedUnpaid = leaveRow({
    id: "unpaid-leave",
    status: "approved",
    start_date: "2026-06-01",
    end_date: "2026-06-10",
    leave_type: "unpaid",
    leave_compensation_type: "unpaid",
  });

  test("approved paid leave classifies as PAID_LEAVE", () => {
    const cov = resolveLeaveCoverageForDate([approvedPaid], "2026-06-05");
    expect(cov?.payrollDayClassification).toBe("PAID_LEAVE");
    expect(payrollDayClassificationFromCoverage(cov)).toBe("PAID_LEAVE");
  });

  test("approved unpaid leave classifies as UNPAID_LEAVE", () => {
    const cov = resolveLeaveCoverageForDate([approvedUnpaid], "2026-06-05");
    expect(cov?.payrollDayClassification).toBe("UNPAID_LEAVE");
  });

  test("cancelled and rejected leave are ignored", () => {
    expect(
      resolveLeaveCoverageForDate(
        [
          leaveRow({
            ...approvedPaid,
            status: "cancelled",
          }),
        ],
        "2026-06-05"
      )
    ).toBeNull();
    expect(
      resolveLeaveCoverageForDate(
        [
          leaveRow({
            ...approvedPaid,
            status: "rejected",
          }),
        ],
        "2026-06-05"
      )
    ).toBeNull();
    expect(payrollDayClassificationFromCoverage(null)).toBe("WORKING");
  });

  test("terminated leave ends on actual_return_date (exclusive — first day back)", () => {
    const terminated = leaveRow({
      status: "terminated",
      start_date: "2026-06-01",
      end_date: "2026-06-10",
      actual_return_date: "2026-06-04",
      leave_compensation_type: "paid",
    });
    expect(isDateWithinLeavePayrollPeriod(terminated, "2026-06-03")).toBe(true);
    expect(isDateWithinLeavePayrollPeriod(terminated, "2026-06-04")).toBe(false);
    const r = computeRestoredDaysFromTermination({
      startDateYmd: "2026-06-01",
      endDateYmd: "2026-06-10",
      totalDays: 10,
      actualReturnDateYmd: "2026-06-04",
    });
    expect(r?.usedDays).toBe(3);
  });

  test("completed leave remains historically discoverable", () => {
    const completed = leaveRow({
      status: "completed",
      start_date: "2026-05-01",
      end_date: "2026-05-05",
      leave_compensation_type: "paid",
    });
    expect(isDateWithinLeavePayrollPeriod(completed, "2026-05-03")).toBe(true);
    expect(resolveLeaveCoverageForDate([completed], "2026-05-03")?.leaveStatus).toBe("completed");
    expect(isDateWithinLeavePayrollPeriod(completed, "2026-05-06")).toBe(false);
  });
});
