import * as leaveRepo from "../../leave/leave.repository";
import {
  getPayrollDayClassification,
  isEmployeeOnPaidLeaveForDate,
  isEmployeeOnUnpaidLeaveForDate,
} from "../payrollLeaveAwareness.service";

jest.mock("../../leave/leave.repository");

const mockedLeaveRepo = leaveRepo as jest.Mocked<typeof leaveRepo>;

describe("payrollLeaveAwareness.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getPayrollDayClassification returns WORKING when no leave", async () => {
    mockedLeaveRepo.listLeaveRequestsForPayrollCoverage.mockResolvedValue([]);
    const ctx = await getPayrollDayClassification("u1", "c1", "2026-06-05");
    expect(ctx.classification).toBe("WORKING");
    expect(ctx.leaveCoverage).toBeNull();
    expect(ctx.coveredByPaidLeave).toBe(false);
  });

  test("isEmployeeOnPaidLeaveForDate is true for approved paid leave", async () => {
    mockedLeaveRepo.listLeaveRequestsForPayrollCoverage.mockResolvedValue([
      {
        id: "l1",
        user_id: "u1",
        company_id: "c1",
        start_date: "2026-06-01",
        end_date: "2026-06-10",
        total_days: 10,
        leave_type: "annual",
        leave_compensation_type: "paid",
        reason: null,
        status: "approved",
        approved_by: null,
        approved_at: null,
      },
    ]);
    await expect(isEmployeeOnPaidLeaveForDate("u1", "c1", "2026-06-05")).resolves.toBe(true);
    await expect(isEmployeeOnUnpaidLeaveForDate("u1", "c1", "2026-06-05")).resolves.toBe(false);
  });
});
