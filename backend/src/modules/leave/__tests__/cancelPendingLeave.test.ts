import * as leaveRepo from "../leave.repository";
import * as operational from "../../notifications/operationalNotifications.service";
import { cancelPendingLeave } from "../leave.service";

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

describe("cancelPendingLeave", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedNotify.notifyLeaveCancelled.mockResolvedValue(undefined);
  });

  it("cancels pending leave owned by employee", async () => {
    mockedRepo.getLeaveById.mockResolvedValue(pendingLeave);
    mockedRepo.cancelPendingLeaveRequest.mockResolvedValue({
      ...pendingLeave,
      status: "cancelled",
    });

    const res = await cancelPendingLeave("employee-1", "company-1", "leave-1");

    expect(res.error).toBeUndefined();
    expect(res.data?.status).toBe("cancelled");
    expect(mockedRepo.cancelPendingLeaveRequest).toHaveBeenCalled();
    expect(mockedNotify.notifyLeaveCancelled).toHaveBeenCalled();
  });

  it("rejects when status is not pending", async () => {
    mockedRepo.getLeaveById.mockResolvedValue({ ...pendingLeave, status: "approved" });

    const res = await cancelPendingLeave("employee-1", "company-1", "leave-1");

    expect(res.data).toBeNull();
    expect(res.error).toBe("Leave request is not pending");
    expect(mockedRepo.cancelPendingLeaveRequest).not.toHaveBeenCalled();
    expect(mockedNotify.notifyLeaveCancelled).not.toHaveBeenCalled();
  });
});

