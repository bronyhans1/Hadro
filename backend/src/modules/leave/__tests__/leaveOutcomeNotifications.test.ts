import * as leaveRepo from "../leave.repository";
import * as operational from "../../notifications/operationalNotifications.service";
import { approveLeave, rejectLeave } from "../leave.service";

jest.mock("../leave.repository");
jest.mock("../../notifications/operationalNotifications.service");

const mockedRepo = leaveRepo as jest.Mocked<typeof leaveRepo>;
const mockedNotify = operational as jest.Mocked<typeof operational>;

const pendingLeave: leaveRepo.LeaveRequestRecord = {
  id: "leave-1",
  user_id: "employee-1",
  company_id: "company-1",
  start_date: "2026-06-01",
  end_date: "2026-06-03",
  total_days: 3,
  leave_type: "annual",
  reason: null,
  status: "pending",
  approved_by: null,
  approved_at: null,
};

const approvedLeave: leaveRepo.LeaveRequestRecord = {
  ...pendingLeave,
  status: "approved",
  approved_by: "hr-1",
  approved_at: "2026-05-20T12:00:00.000Z",
};

const rejectedLeave: leaveRepo.LeaveRequestRecord = {
  ...pendingLeave,
  status: "rejected",
  approved_by: "hr-1",
  approved_at: "2026-05-20T12:00:00.000Z",
};

describe("leave outcome notifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedNotify.notifyLeaveSubmitted.mockResolvedValue(undefined);
    mockedNotify.notifyLeaveOutcome.mockResolvedValue(undefined);
  });

  it("notifies employee on approve", async () => {
    mockedRepo.getLeaveById.mockResolvedValue(pendingLeave);
    mockedRepo.approveLeaveRequestTransaction.mockResolvedValue(approvedLeave);

    const result = await approveLeave("leave-1", "company-1", "hr-1");

    expect(result.data?.status).toBe("approved");
    expect(mockedNotify.notifyLeaveOutcome).toHaveBeenCalledWith({
      companyId: "company-1",
      employeeUserId: "employee-1",
      leave: approvedLeave,
      outcome: "approved",
      reviewerUserId: "hr-1",
    });
  });

  it("notifies employee on reject", async () => {
    mockedRepo.getLeaveById.mockResolvedValue(pendingLeave);
    mockedRepo.updateLeaveStatus.mockResolvedValue(rejectedLeave);

    const result = await rejectLeave("leave-1", "company-1", "hr-1");

    expect(result.data?.status).toBe("rejected");
    expect(mockedNotify.notifyLeaveOutcome).toHaveBeenCalledWith({
      companyId: "company-1",
      employeeUserId: "employee-1",
      leave: rejectedLeave,
      outcome: "rejected",
      reviewerUserId: "hr-1",
    });
  });
});
