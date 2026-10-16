import * as leaveRepo from "../leave.repository";
import * as operational from "../../notifications/operationalNotifications.service";
import { terminateApprovedLeave } from "../leave.service";
import { todayYmd } from "../leaveLifecycle";

jest.mock("../leave.repository");
jest.mock("../../notifications/operationalNotifications.service");

const mockedRepo = leaveRepo as jest.Mocked<typeof leaveRepo>;
const mockedNotify = operational as jest.Mocked<typeof operational>;

function addDaysYmd(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function baseLeaveFixture(
  partial: Partial<leaveRepo.LeaveRequestRecord> &
    Pick<leaveRepo.LeaveRequestRecord, "start_date" | "end_date" | "status">
): leaveRepo.LeaveRequestRecord {
  return {
    id: "leave-1",
    user_id: "employee-1",
    company_id: "company-1",
    total_days: 10,
    leave_type: "annual",
    reason: null,
    approved_by: "hr-1",
    approved_at: new Date().toISOString(),
    ...partial,
  };
}

/** Approved leave spanning today with end_date still in the future. */
function activeApprovedLeave(today: string): leaveRepo.LeaveRequestRecord {
  return baseLeaveFixture({
    status: "approved",
    start_date: addDaysYmd(today, -5),
    end_date: addDaysYmd(today, 10),
  });
}

/** Approved leave whose end_date is already in the past. */
function expiredApprovedLeave(today: string): leaveRepo.LeaveRequestRecord {
  return baseLeaveFixture({
    status: "approved",
    start_date: addDaysYmd(today, -20),
    end_date: addDaysYmd(today, -1),
  });
}

describe("terminateApprovedLeave", () => {
  const today = todayYmd();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedNotify.notifyLeaveTerminated.mockResolvedValue(undefined);
  });

  it("terminates approved leave via transaction", async () => {
    const leave = activeApprovedLeave(today);
    const actualReturnDate = today;

    mockedRepo.getLeaveById.mockResolvedValue(leave);
    mockedRepo.terminateLeaveRequestTransaction.mockResolvedValue({
      ...leave,
      status: "terminated",
      actual_return_date: actualReturnDate,
      restored_days: 6,
    });

    const res = await terminateApprovedLeave({
      leaveId: "leave-1",
      companyId: "company-1",
      terminatorId: "hr-1",
      actualReturnDate,
    });

    expect(res.error).toBeUndefined();
    expect(res.data?.status).toBe("terminated");
    expect(mockedRepo.terminateLeaveRequestTransaction).toHaveBeenCalledWith({
      leaveId: "leave-1",
      companyId: "company-1",
      terminatorId: "hr-1",
      actualReturnDate,
      reason: null,
    });
    expect(mockedNotify.notifyLeaveTerminated).toHaveBeenCalled();
  });

  it("rejects when leave is not approved", async () => {
    const leave = activeApprovedLeave(today);

    mockedRepo.getLeaveById.mockResolvedValue({ ...leave, status: "pending" });

    const res = await terminateApprovedLeave({
      leaveId: "leave-1",
      companyId: "company-1",
      terminatorId: "hr-1",
      actualReturnDate: today,
    });

    expect(res.data).toBeNull();
    expect(res.error).toBe("Leave request is not approved");
    expect(mockedRepo.terminateLeaveRequestTransaction).not.toHaveBeenCalled();
  });

  it("rejects when approved leave has ended (not active)", async () => {
    const leave = expiredApprovedLeave(today);

    mockedRepo.getLeaveById.mockResolvedValue(leave);

    const res = await terminateApprovedLeave({
      leaveId: "leave-1",
      companyId: "company-1",
      terminatorId: "hr-1",
      actualReturnDate: addDaysYmd(today, -2),
    });

    expect(res.data).toBeNull();
    expect(res.error).toBe("Leave request is not active");
    expect(mockedRepo.terminateLeaveRequestTransaction).not.toHaveBeenCalled();
  });
});
