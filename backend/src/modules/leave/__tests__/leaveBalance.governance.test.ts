import * as leaveBalanceRepo from "../leaveBalance.repository";
import * as usersRepo from "../../users/users.repository";
import { createLeaveBalance, updateLeaveBalance } from "../leaveBalance.service";

jest.mock("../leaveBalance.repository");
jest.mock("../../users/users.repository");

const mockedRepo = leaveBalanceRepo as jest.Mocked<typeof leaveBalanceRepo>;
const mockedUsers = usersRepo as jest.Mocked<typeof usersRepo>;

const existingBalance: leaveBalanceRepo.LeaveBalanceRecord = {
  id: "bal-1",
  user_id: "user-1",
  company_id: "company-1",
  leave_type: "annual",
  total_days: 35,
  used_days: 30,
  updated_at: new Date().toISOString(),
};

describe("leave balance governance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUsers.findByIdAndCompanyId.mockResolvedValue({
      id: "user-1",
      company_id: "company-1",
      branch_id: null,
    } as never);
  });

  it("updateLeaveBalance ignores manual used_days and preserves lifecycle value", async () => {
    mockedRepo.getLeaveBalanceById.mockResolvedValue(existingBalance);
    mockedRepo.updateLeaveBalanceById.mockResolvedValue({
      ...existingBalance,
      total_days: 40,
      used_days: 30,
    });

    const res = await updateLeaveBalance("bal-1", "company-1", {
      total_days: 40,
      used_days: 3,
    });

    expect(res.error).toBeUndefined();
    expect(res.data?.used_days).toBe(30);
    expect(mockedRepo.updateLeaveBalanceById).toHaveBeenCalledWith("bal-1", "company-1", {
      total_days: 40,
    });
  });

  it("updateLeaveBalance rejects allocation below lifecycle used_days", async () => {
    mockedRepo.getLeaveBalanceById.mockResolvedValue(existingBalance);

    const res = await updateLeaveBalance("bal-1", "company-1", { total_days: 10 });

    expect(res.data).toBeNull();
    expect(res.error).toBe("total_days cannot be less than lifecycle-used days");
    expect(mockedRepo.updateLeaveBalanceById).not.toHaveBeenCalled();
  });

  it("createLeaveBalance seeds used_days at 0 for new rows", async () => {
    mockedRepo.getLeaveBalanceByType.mockResolvedValue(null);
    mockedRepo.createLeaveBalance.mockResolvedValue({
      ...existingBalance,
      used_days: 0,
      total_days: 20,
    });

    const res = await createLeaveBalance("user-1", "company-1", {
      user_id: "user-1",
      leave_type: "annual",
      total_days: 20,
      used_days: 99,
    });

    expect(res.error).toBeUndefined();
    expect(mockedRepo.createLeaveBalance).toHaveBeenCalledWith(
      expect.objectContaining({ used_days: 0, total_days: 20 })
    );
  });
});
