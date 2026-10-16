import * as repo from "../leaveTypePolicy.repository";
import {
  listLeaveTypePolicies,
  resolveLeaveCompensationForCompany,
  updateLeaveTypeCompensation,
} from "../leaveTypePolicy.service";

jest.mock("../leaveTypePolicy.repository");

const mockedRepo = repo as jest.Mocked<typeof repo>;

describe("leaveTypePolicy.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRepo.ensureDefaultPoliciesForCompany.mockResolvedValue(undefined);
  });

  it("lists policies with company overrides", async () => {
    mockedRepo.listPoliciesForCompany.mockResolvedValue([
      {
        id: "1",
        company_id: "c1",
        leave_type: "emergency",
        compensation_type: "unpaid",
        created_at: "",
        updated_at: "",
      },
      {
        id: "2",
        company_id: "c1",
        leave_type: "annual",
        compensation_type: "paid",
        created_at: "",
        updated_at: "",
      },
      {
        id: "3",
        company_id: "c1",
        leave_type: "sick",
        compensation_type: "paid",
        created_at: "",
        updated_at: "",
      },
      {
        id: "4",
        company_id: "c1",
        leave_type: "maternity",
        compensation_type: "paid",
        created_at: "",
        updated_at: "",
      },
      {
        id: "5",
        company_id: "c1",
        leave_type: "unpaid",
        compensation_type: "unpaid",
        created_at: "",
        updated_at: "",
      },
    ]);

    const policies = await listLeaveTypePolicies("c1");
    const emergency = policies.find((p) => p.leave_type === "emergency");
    expect(emergency?.compensation_type).toBe("unpaid");
    const annual = policies.find((p) => p.leave_type === "annual");
    expect(annual?.compensation_type).toBe("paid");
  });

  it("resolves compensation from company policy for new requests", async () => {
    mockedRepo.getPolicyForLeaveType.mockResolvedValue({
      id: "1",
      company_id: "c1",
      leave_type: "emergency",
      compensation_type: "unpaid",
      created_at: "",
      updated_at: "",
    });

    await expect(resolveLeaveCompensationForCompany("c1", "emergency")).resolves.toBe(
      "unpaid"
    );
  });

  it("falls back to seed default when policy row is missing after ensure", async () => {
    mockedRepo.getPolicyForLeaveType.mockResolvedValue(null);

    await expect(resolveLeaveCompensationForCompany("c1", "annual")).resolves.toBe("paid");
    expect(mockedRepo.ensureDefaultPoliciesForCompany).toHaveBeenCalledWith("c1");
  });

  it("keeps dedicated unpaid leave type as unpaid even if paid requested", async () => {
    mockedRepo.upsertPolicy.mockResolvedValue({
      id: "1",
      company_id: "c1",
      leave_type: "unpaid",
      compensation_type: "unpaid",
      created_at: "",
      updated_at: "",
    });

    const result = await updateLeaveTypeCompensation({
      companyId: "c1",
      leaveTypeRaw: "unpaid",
      compensationRaw: "paid",
    });

    expect(result.error).toBeUndefined();
    expect(result.data?.compensation_type).toBe("unpaid");
    expect(mockedRepo.upsertPolicy).toHaveBeenCalledWith({
      companyId: "c1",
      leaveType: "unpaid",
      compensationType: "unpaid",
    });
  });

  it("allows company to set emergency leave to unpaid", async () => {
    mockedRepo.upsertPolicy.mockResolvedValue({
      id: "1",
      company_id: "c1",
      leave_type: "emergency",
      compensation_type: "unpaid",
      created_at: "",
      updated_at: "",
    });

    const result = await updateLeaveTypeCompensation({
      companyId: "c1",
      leaveTypeRaw: "emergency",
      compensationRaw: "unpaid",
    });

    expect(result.data?.compensation_type).toBe("unpaid");
    expect(mockedRepo.upsertPolicy).toHaveBeenCalledWith({
      companyId: "c1",
      leaveType: "emergency",
      compensationType: "unpaid",
    });
  });
});
