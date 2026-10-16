import * as leaveRepo from "../leave.repository";
import * as balanceRepo from "../leaveBalance.repository";
import * as leaveTypePolicy from "../leaveTypePolicy.service";
import * as operational from "../../notifications/operationalNotifications.service";
import { requestLeave } from "../leave.service";
import { isPaidLeaveForPayroll } from "../../payroll/leavePayrollClassification";

jest.mock("../leave.repository");
jest.mock("../leaveBalance.repository");
jest.mock("../leaveTypePolicy.service");
jest.mock("../../notifications/operationalNotifications.service");

const mockedRepo = leaveRepo as jest.Mocked<typeof leaveRepo>;
const mockedBalance = balanceRepo as jest.Mocked<typeof balanceRepo>;
const mockedPolicy = leaveTypePolicy as jest.Mocked<typeof leaveTypePolicy>;

describe("requestLeave compensation snapshot", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedBalance.getLeaveBalanceByType.mockResolvedValue({
      id: "b1",
      user_id: "u1",
      company_id: "c1",
      leave_type: "emergency",
      total_days: 10,
      used_days: 0,
      updated_at: new Date().toISOString(),
    });
    (operational.notifyLeaveSubmitted as jest.Mock).mockResolvedValue(undefined);
  });

  it("snapshots company policy compensation onto the leave request", async () => {
    mockedPolicy.resolveLeaveCompensationForCompany.mockResolvedValue("unpaid");
    mockedRepo.createLeaveRequest.mockResolvedValue({
      id: "leave-new",
      user_id: "u1",
      company_id: "c1",
      start_date: "2026-07-01",
      end_date: "2026-07-01",
      total_days: 1,
      leave_type: "emergency",
      leave_compensation_type: "unpaid",
      reason: null,
      status: "pending",
      approved_by: null,
      approved_at: null,
    });

    const res = await requestLeave("u1", "c1", {
      start_date: "2026-07-01",
      end_date: "2026-07-01",
      leave_type: "emergency",
    });

    expect(res.error).toBeUndefined();
    expect(mockedPolicy.resolveLeaveCompensationForCompany).toHaveBeenCalledWith(
      "c1",
      "emergency"
    );
    expect(mockedRepo.createLeaveRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        leave_type: "emergency",
        leave_compensation_type: "unpaid",
        leave_compensation_default: "unpaid",
      })
    );
  });

  it("policy change does not rewrite existing request snapshot for payroll", () => {
    // Existing approved Emergency leave created while company policy was paid
    const existingRequest = {
      leave_type: "emergency",
      leave_compensation_type: "paid" as const,
    };
    // Company later sets Emergency → unpaid; new requests would be unpaid
    const newRequest = {
      leave_type: "emergency",
      leave_compensation_type: "unpaid" as const,
    };

    expect(isPaidLeaveForPayroll(existingRequest)).toBe(true);
    expect(isPaidLeaveForPayroll(newRequest)).toBe(false);
  });
});
