import * as leaveRepo from "../leave.repository";
import { completeExpiredApprovedLeaves } from "../leaveCompletion.service";

jest.mock("../leave.repository");

const mockedRepo = leaveRepo as jest.Mocked<typeof leaveRepo>;

describe("completeExpiredApprovedLeaves", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns completed count from repository", async () => {
    mockedRepo.completeExpiredApprovedLeaves.mockResolvedValue({ completed: 3 });

    const result = await completeExpiredApprovedLeaves({ companyId: "company-1" });

    expect(result.completed).toBe(3);
    expect(mockedRepo.completeExpiredApprovedLeaves).toHaveBeenCalledWith({
      companyId: "company-1",
    });
  });
});
