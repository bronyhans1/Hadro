import * as leaveRepo from "../leave.repository";
import { updateLeaveCompensation } from "../leave.service";
import { toLeaveApi } from "../leave.mapper";
import { isPaidLeaveForPayroll } from "../../payroll/leavePayrollClassification";

jest.mock("../leave.repository");
jest.mock("../../notifications/operationalNotifications.service");
jest.mock("../../payroll/leavePayrollResync", () => ({
  scheduleLeavePayrollResyncForLeaveRecord: jest.fn(),
}));

const mockedRepo = leaveRepo as jest.Mocked<typeof leaveRepo>;

const pendingPaid: leaveRepo.LeaveRequestRecord = {
  id: "leave-1",
  user_id: "u1",
  company_id: "c1",
  start_date: "2026-08-01",
  end_date: "2026-08-01",
  total_days: 1,
  leave_type: "emergency",
  leave_compensation_type: "paid",
  leave_compensation_default: "paid",
  leave_override_reason: null,
  reason: null,
  status: "pending",
  approved_by: null,
  approved_at: null,
};

describe("leave compensation HR override", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requires override reason when compensation differs from company default", async () => {
    mockedRepo.getLeaveById.mockResolvedValue(pendingPaid);

    const res = await updateLeaveCompensation("leave-1", "c1", "unpaid");

    expect(res.data).toBeNull();
    expect(res.error).toMatch(/override reason/i);
    expect(mockedRepo.updateLeaveCompensationType).not.toHaveBeenCalled();
  });

  it("overrides pending request from paid default to unpaid with reason", async () => {
    mockedRepo.getLeaveById.mockResolvedValue(pendingPaid);
    mockedRepo.updateLeaveCompensationType.mockResolvedValue({
      ...pendingPaid,
      leave_compensation_type: "unpaid",
      leave_override_reason: "Employee requested unpaid leave",
    });

    const res = await updateLeaveCompensation(
      "leave-1",
      "c1",
      "unpaid",
      undefined,
      "Employee requested unpaid leave"
    );

    expect(res.error).toBeUndefined();
    expect(res.changed).toBe(true);
    expect(res.previous_compensation).toBe("paid");
    expect(res.new_compensation).toBe("unpaid");
    expect(res.override_reason).toBe("Employee requested unpaid leave");
    expect(mockedRepo.updateLeaveCompensationType).toHaveBeenCalledWith(
      "leave-1",
      "c1",
      "unpaid",
      "Employee requested unpaid leave"
    );
    expect(isPaidLeaveForPayroll(res.data!)).toBe(false);
  });

  it("allows override from unpaid default to paid with reason", async () => {
    mockedRepo.getLeaveById.mockResolvedValue({
      ...pendingPaid,
      leave_compensation_type: "unpaid",
      leave_compensation_default: "unpaid",
    });
    mockedRepo.updateLeaveCompensationType.mockResolvedValue({
      ...pendingPaid,
      leave_compensation_type: "paid",
      leave_compensation_default: "unpaid",
      leave_override_reason: "Executive approval",
    });

    const res = await updateLeaveCompensation(
      "leave-1",
      "c1",
      "paid",
      undefined,
      "Executive approval"
    );

    expect(res.changed).toBe(true);
    expect(res.previous_compensation).toBe("unpaid");
    expect(res.new_compensation).toBe("paid");
    expect(res.override_reason).toBe("Executive approval");
    expect(isPaidLeaveForPayroll(res.data!)).toBe(true);
  });

  it("clears override reason when restoring company default", async () => {
    mockedRepo.getLeaveById.mockResolvedValue({
      ...pendingPaid,
      leave_compensation_type: "unpaid",
      leave_override_reason: "Prior override",
    });
    mockedRepo.updateLeaveCompensationType.mockResolvedValue({
      ...pendingPaid,
      leave_compensation_type: "paid",
      leave_override_reason: null,
    });

    const res = await updateLeaveCompensation("leave-1", "c1", "paid");

    expect(res.changed).toBe(true);
    expect(res.override_reason).toBeNull();
    expect(mockedRepo.updateLeaveCompensationType).toHaveBeenCalledWith(
      "leave-1",
      "c1",
      "paid",
      null
    );
  });

  it("rejects override after approval (immutable)", async () => {
    mockedRepo.getLeaveById.mockResolvedValue({
      ...pendingPaid,
      status: "approved",
    });

    const res = await updateLeaveCompensation(
      "leave-1",
      "c1",
      "unpaid",
      undefined,
      "Too late"
    );

    expect(res.data).toBeNull();
    expect(res.error).toMatch(/pending/i);
    expect(mockedRepo.updateLeaveCompensationType).not.toHaveBeenCalled();
  });

  it("no-ops when compensation is unchanged at company default", async () => {
    mockedRepo.getLeaveById.mockResolvedValue(pendingPaid);

    const res = await updateLeaveCompensation("leave-1", "c1", "paid");

    expect(res.changed).toBe(false);
    expect(mockedRepo.updateLeaveCompensationType).not.toHaveBeenCalled();
  });

  it("maps override flag and strips reason for employee API by default", () => {
    const row = {
      ...pendingPaid,
      leave_compensation_type: "unpaid",
      leave_compensation_default: "paid",
      leave_override_reason: "HR confidential",
    };
    const employeeApi = toLeaveApi(row);
    expect(employeeApi.leave_compensation_overridden).toBe(true);
    expect(employeeApi.leave_compensation_source).toBe("override");
    expect(employeeApi.leave_override_reason).toBeNull();

    const hrApi = toLeaveApi(row, { includeOverrideReason: true });
    expect(hrApi.leave_override_reason).toBe("HR confidential");
  });

  it("existing approved snapshot remains paid for payroll when later policy would differ", () => {
    const approved = {
      leave_type: "emergency",
      leave_compensation_type: "paid" as const,
      leave_compensation_default: "paid" as const,
    };
    expect(isPaidLeaveForPayroll(approved)).toBe(true);
  });
});
