import type { RequestContext } from "../../../middleware/context.middleware";
import * as manualOvertimeRepo from "../manualOvertime.repository";
import * as payrollRepo from "../../payroll/payroll.repository";
import * as companyPolicy from "../../companyPolicy/companyPolicy.service";
import * as wageRatesRepo from "../../payroll/wageRates.repository";
import * as leaveAwareness from "../../payroll/payrollLeaveAwareness.service";
import {
  createManualOvertimeEntry,
  cancelManualOvertimeEntry,
} from "../manualOvertime.service";

jest.mock("../manualOvertime.repository");
jest.mock("../../payroll/payroll.repository");
jest.mock("../../companyPolicy/companyPolicy.service");
jest.mock("../../payroll/wageRates.repository");
jest.mock("../../payroll/payrollLeaveAwareness.service");
jest.mock("../../../modules/users/users.repository", () => ({
  findByIdAndCompanyId: jest.fn().mockResolvedValue({
    id: "employee-1",
    branch_id: "branch-a",
    first_name: "Jane",
    last_name: "Doe",
    email: "jane@example.com",
  }),
}));

const ctx = (roles: string[], branchId: string | null = "branch-a"): RequestContext => ({
  userId: "hr-1",
  companyId: "company-1",
  branchId,
  roles,
});

describe("manualOvertime.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(companyPolicy.isPayrollEnabled).mockResolvedValue(true);
    jest.mocked(companyPolicy.getPolicy).mockResolvedValue({
      id: "p1",
      company_id: "company-1",
      default_daily_hours: 8,
      overtime_multiplier: 1.5,
      lateness_tracking_enabled: true,
      late_pay_deduction_enabled: false,
      payroll_enabled: true,
      business_timezone: "UTC",
      attendance_day_classification_enabled: false,
      minimum_minutes_for_counted_day: 0,
      full_day_minutes_threshold: 480,
      currency_code: "GHS",
      working_weekdays: [1, 2, 3, 4, 5],
      created_at: "",
      updated_at: "",
      manual_ot_stacking_mode: "warn",
    } as never);
    jest.mocked(wageRatesRepo.getHourlyRate).mockResolvedValue(20);
    jest.mocked(leaveAwareness.getPayrollDayClassification).mockResolvedValue({
      date: "2026-05-15",
      classification: "WORKING",
      leaveCoverage: null,
      coveredByPaidLeave: false,
      coveredByUnpaidLeave: false,
    });
    jest
      .mocked(manualOvertimeRepo.sumAttendanceOvertimeMinutesForDate)
      .mockResolvedValue({ totalMinutes: 0, sessionCount: 0 });
    jest
      .mocked(manualOvertimeRepo.sumExistingManualOvertimeMinutesForDate)
      .mockResolvedValue({ totalMinutes: 0, entryCount: 0 });
  });

  it("blocks future-dated manual OT", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-15T12:00:00.000Z"));

    const result = await createManualOvertimeEntry(ctx(["HR"]), "company-1", "hr-1", {
      user_id: "employee-1",
      earnings_date: "2026-05-16",
      hours: 2,
      reason: "Extra shift",
    });

    expect(result.error).toMatch(/future date/i);
    expect(manualOvertimeRepo.insertManualOvertimeEntry).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it("blocks paid leave days", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-15T12:00:00.000Z"));
    jest.mocked(leaveAwareness.getPayrollDayClassification).mockResolvedValue({
      date: "2026-05-15",
      classification: "PAID_LEAVE",
      leaveCoverage: null,
      coveredByPaidLeave: true,
      coveredByUnpaidLeave: false,
    });

    const result = await createManualOvertimeEntry(ctx(["HR"]), "company-1", "hr-1", {
      user_id: "employee-1",
      earnings_date: "2026-05-15",
      hours: 2,
      reason: "Should fail",
    });

    expect(result.error).toMatch(/paid leave/i);
    jest.useRealTimers();
  });

  it("blocks unpaid leave days", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-15T12:00:00.000Z"));
    jest.mocked(leaveAwareness.getPayrollDayClassification).mockResolvedValue({
      date: "2026-05-15",
      classification: "UNPAID_LEAVE",
      leaveCoverage: null,
      coveredByPaidLeave: false,
      coveredByUnpaidLeave: true,
    });

    const result = await createManualOvertimeEntry(ctx(["HR"]), "company-1", "hr-1", {
      user_id: "employee-1",
      earnings_date: "2026-05-15",
      hours: 2,
      reason: "Should fail",
    });

    expect(result.error).toMatch(/unpaid leave/i);
    jest.useRealTimers();
  });

  it("requires overlap acknowledgment in warn mode", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-15T12:00:00.000Z"));
    jest
      .mocked(manualOvertimeRepo.sumAttendanceOvertimeMinutesForDate)
      .mockResolvedValue({ totalMinutes: 120, sessionCount: 1 });

    const blocked = await createManualOvertimeEntry(ctx(["HR"]), "company-1", "hr-1", {
      user_id: "employee-1",
      earnings_date: "2026-05-15",
      hours: 3,
      reason: "Coverage",
    });
    expect(blocked.error).toMatch(/Acknowledge/i);
    expect(blocked.status).toBe(409);

    jest.mocked(manualOvertimeRepo.insertManualOvertimeEntry).mockResolvedValue({
      id: "entry-1",
      company_id: "company-1",
      user_id: "employee-1",
      earnings_date: "2026-05-15",
      hours: 3,
      reason: "Coverage",
      reason_code: null,
      status: "approved",
      created_by: "hr-1",
      approved_by: "hr-1",
      approved_at: "2026-05-15T12:00:00.000Z",
      rejected_by: null,
      rejection_reason: null,
      payroll_record_id: null,
      overlap_warning_acknowledged: true,
      created_at: "2026-05-15T12:00:00.000Z",
      updated_at: "2026-05-15T12:00:00.000Z",
    });
    jest.mocked(payrollRepo.insertManualOvertimePayrollRecord).mockResolvedValue({
      id: "payroll-1",
      user_id: "employee-1",
      company_id: "company-1",
      session_id: null,
      regular_minutes: 0,
      overtime_minutes: 180,
      hours_worked: 0,
      hourly_rate: 20,
      gross_earnings: 90,
      payroll_date: "2026-05-15",
      record_type: "manual_overtime",
      earnings_date: "2026-05-15",
      earning_source: "manual_overtime",
      status: "draft",
    });
    jest.mocked(manualOvertimeRepo.updateManualOvertimeEntryPayrollLink).mockResolvedValue({
      id: "entry-1",
      company_id: "company-1",
      user_id: "employee-1",
      earnings_date: "2026-05-15",
      hours: 3,
      reason: "Coverage",
      reason_code: null,
      status: "approved",
      created_by: "hr-1",
      approved_by: "hr-1",
      approved_at: "2026-05-15T12:00:00.000Z",
      rejected_by: null,
      rejection_reason: null,
      payroll_record_id: "payroll-1",
      overlap_warning_acknowledged: true,
      created_at: "2026-05-15T12:00:00.000Z",
      updated_at: "2026-05-15T12:00:00.000Z",
    });

    const ok = await createManualOvertimeEntry(ctx(["HR"]), "company-1", "hr-1", {
      user_id: "employee-1",
      earnings_date: "2026-05-15",
      hours: 3,
      reason: "Coverage",
      overlap_warning_acknowledged: true,
    });

    expect(ok.entry?.payroll_record_id).toBe("payroll-1");
    expect(payrollRepo.insertManualOvertimePayrollRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        overtime_minutes: 180,
        gross_earnings: 90,
        overtime_compensation_method_applied: "multiplier",
        overtime_multiplier_applied: 1.5,
        fixed_overtime_rate_applied: null,
      })
    );
    jest.useRealTimers();
  });

  it("uses fixed OT rate for manual OT pay when policy is fixed_rate", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-15T12:00:00.000Z"));
    jest.mocked(companyPolicy.getPolicy).mockResolvedValue({
      id: "p1",
      company_id: "company-1",
      default_daily_hours: 8,
      overtime_multiplier: 1.5,
      overtime_compensation_method: "fixed_rate",
      fixed_overtime_hourly_rate: 20,
      lateness_tracking_enabled: true,
      late_pay_deduction_enabled: false,
      payroll_enabled: true,
      business_timezone: "UTC",
      attendance_day_classification_enabled: false,
      minimum_minutes_for_counted_day: 0,
      full_day_minutes_threshold: 480,
      currency_code: "GHS",
      working_weekdays: [1, 2, 3, 4, 5],
      created_at: "",
      updated_at: "",
      manual_ot_stacking_mode: "warn",
    } as never);
    jest.mocked(manualOvertimeRepo.insertManualOvertimeEntry).mockResolvedValue({
      id: "entry-fixed",
      company_id: "company-1",
      user_id: "employee-1",
      earnings_date: "2026-05-15",
      hours: 4,
      reason: "Fixed rate OT",
      reason_code: null,
      status: "approved",
      created_by: "hr-1",
      approved_by: "hr-1",
      approved_at: "2026-05-15T12:00:00.000Z",
      rejected_by: null,
      rejection_reason: null,
      payroll_record_id: null,
      overlap_warning_acknowledged: true,
      created_at: "2026-05-15T12:00:00.000Z",
      updated_at: "2026-05-15T12:00:00.000Z",
    });
    jest.mocked(payrollRepo.insertManualOvertimePayrollRecord).mockResolvedValue({
      id: "payroll-fixed",
      user_id: "employee-1",
      company_id: "company-1",
      session_id: null,
      regular_minutes: 0,
      overtime_minutes: 240,
      hours_worked: 0,
      hourly_rate: 20,
      gross_earnings: 80,
      payroll_date: "2026-05-15",
      record_type: "manual_overtime",
      earnings_date: "2026-05-15",
      earning_source: "manual_overtime",
      status: "draft",
    });
    jest.mocked(manualOvertimeRepo.updateManualOvertimeEntryPayrollLink).mockResolvedValue({
      id: "entry-fixed",
      company_id: "company-1",
      user_id: "employee-1",
      earnings_date: "2026-05-15",
      hours: 4,
      reason: "Fixed rate OT",
      reason_code: null,
      status: "approved",
      created_by: "hr-1",
      approved_by: "hr-1",
      approved_at: "2026-05-15T12:00:00.000Z",
      rejected_by: null,
      rejection_reason: null,
      payroll_record_id: "payroll-fixed",
      overlap_warning_acknowledged: true,
      created_at: "2026-05-15T12:00:00.000Z",
      updated_at: "2026-05-15T12:00:00.000Z",
    });

    await createManualOvertimeEntry(ctx(["HR"]), "company-1", "hr-1", {
      user_id: "employee-1",
      earnings_date: "2026-05-15",
      hours: 4,
      reason: "Fixed rate OT",
      overlap_warning_acknowledged: true,
    });

    expect(payrollRepo.insertManualOvertimePayrollRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        overtime_minutes: 240,
        gross_earnings: 80,
        overtime_compensation_method_applied: "fixed_rate",
        overtime_multiplier_applied: null,
        fixed_overtime_rate_applied: 20,
      })
    );
    jest.useRealTimers();
  });

  it("blocks when stacking mode is block and attendance OT exists", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-15T12:00:00.000Z"));
    jest.mocked(companyPolicy.getPolicy).mockResolvedValue({
      id: "p1",
      company_id: "company-1",
      default_daily_hours: 8,
      overtime_multiplier: 1.5,
      lateness_tracking_enabled: true,
      late_pay_deduction_enabled: false,
      payroll_enabled: true,
      business_timezone: "UTC",
      attendance_day_classification_enabled: false,
      minimum_minutes_for_counted_day: 0,
      full_day_minutes_threshold: 480,
      currency_code: "GHS",
      working_weekdays: [1, 2, 3, 4, 5],
      created_at: "",
      updated_at: "",
      manual_ot_stacking_mode: "block",
    } as never);
    jest
      .mocked(manualOvertimeRepo.sumAttendanceOvertimeMinutesForDate)
      .mockResolvedValue({ totalMinutes: 60, sessionCount: 1 });

    const result = await createManualOvertimeEntry(ctx(["admin"]), "company-1", "admin-1", {
      user_id: "employee-1",
      earnings_date: "2026-05-15",
      hours: 2,
      reason: "Blocked",
      overlap_warning_acknowledged: true,
    });

    expect(result.error).toMatch(/blocked/i);
    jest.useRealTimers();
  });

  it("allows multiple manual entries on the same day when no attendance OT", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-15T12:00:00.000Z"));
    jest
      .mocked(manualOvertimeRepo.sumExistingManualOvertimeMinutesForDate)
      .mockResolvedValue({ totalMinutes: 120, entryCount: 1 });

    jest.mocked(manualOvertimeRepo.insertManualOvertimeEntry).mockResolvedValue({
      id: "entry-2",
      company_id: "company-1",
      user_id: "employee-1",
      earnings_date: "2026-05-15",
      hours: 2,
      reason: "Second entry",
      reason_code: null,
      status: "approved",
      created_by: "hr-1",
      approved_by: "hr-1",
      approved_at: "2026-05-15T12:00:00.000Z",
      rejected_by: null,
      rejection_reason: null,
      payroll_record_id: null,
      overlap_warning_acknowledged: true,
      created_at: "2026-05-15T12:00:00.000Z",
      updated_at: "2026-05-15T12:00:00.000Z",
    });
    jest.mocked(payrollRepo.insertManualOvertimePayrollRecord).mockResolvedValue({
      id: "payroll-2",
      user_id: "employee-1",
      company_id: "company-1",
      session_id: null,
      regular_minutes: 0,
      overtime_minutes: 120,
      hours_worked: 0,
      hourly_rate: 20,
      gross_earnings: 60,
      payroll_date: "2026-05-15",
      record_type: "manual_overtime",
      status: "draft",
    });
    jest.mocked(manualOvertimeRepo.updateManualOvertimeEntryPayrollLink).mockResolvedValue({
      id: "entry-2",
      company_id: "company-1",
      user_id: "employee-1",
      earnings_date: "2026-05-15",
      hours: 2,
      reason: "Second entry",
      reason_code: null,
      status: "approved",
      created_by: "hr-1",
      approved_by: "hr-1",
      approved_at: "2026-05-15T12:00:00.000Z",
      rejected_by: null,
      rejection_reason: null,
      payroll_record_id: "payroll-2",
      overlap_warning_acknowledged: true,
      created_at: "2026-05-15T12:00:00.000Z",
      updated_at: "2026-05-15T12:00:00.000Z",
    });

    const result = await createManualOvertimeEntry(ctx(["HR"]), "company-1", "hr-1", {
      user_id: "employee-1",
      earnings_date: "2026-05-15",
      hours: 2,
      reason: "Second entry",
      overlap_warning_acknowledged: true,
    });

    expect(result.entry?.id).toBe("entry-2");
    jest.useRealTimers();
  });

  it("cancel removes draft payroll row only", async () => {
    jest.mocked(manualOvertimeRepo.getManualOvertimeEntryById).mockResolvedValue({
      id: "entry-1",
      company_id: "company-1",
      user_id: "employee-1",
      earnings_date: "2026-05-15",
      hours: 2,
      reason: "Test",
      reason_code: null,
      status: "approved",
      created_by: "hr-1",
      approved_by: "hr-1",
      approved_at: "2026-05-15T12:00:00.000Z",
      rejected_by: null,
      rejection_reason: null,
      payroll_record_id: "payroll-1",
      overlap_warning_acknowledged: false,
      created_at: "2026-05-15T12:00:00.000Z",
      updated_at: "2026-05-15T12:00:00.000Z",
    });
    jest.mocked(payrollRepo.getPayrollById).mockResolvedValue({
      id: "payroll-1",
      user_id: "employee-1",
      company_id: "company-1",
      session_id: null,
      regular_minutes: 0,
      overtime_minutes: 120,
      hours_worked: 0,
      hourly_rate: 20,
      gross_earnings: 60,
      payroll_date: "2026-05-15",
      status: "draft",
      record_type: "manual_overtime",
    });
    jest.mocked(payrollRepo.deleteDraftManualOvertimePayrollRecord).mockResolvedValue(true);
    jest.mocked(manualOvertimeRepo.cancelManualOvertimeEntry).mockResolvedValue({
      id: "entry-1",
      company_id: "company-1",
      user_id: "employee-1",
      earnings_date: "2026-05-15",
      hours: 2,
      reason: "Test",
      reason_code: null,
      status: "cancelled",
      created_by: "hr-1",
      approved_by: "hr-1",
      approved_at: "2026-05-15T12:00:00.000Z",
      rejected_by: null,
      rejection_reason: null,
      payroll_record_id: "payroll-1",
      overlap_warning_acknowledged: false,
      created_at: "2026-05-15T12:00:00.000Z",
      updated_at: "2026-05-15T12:00:00.000Z",
    });

    const result = await cancelManualOvertimeEntry(ctx(["HR"]), "company-1", "entry-1");
    expect(result.entry?.status).toBe("cancelled");
    expect(payrollRepo.deleteDraftManualOvertimePayrollRecord).toHaveBeenCalledWith(
      "payroll-1",
      "company-1"
    );
  });
});

describe("resync exclusion", () => {
  it("deleteDraftLeaveHourlyForUserMonth query targets leave_hourly only", async () => {
    const fs = await import("fs/promises");
    const repoSource = await fs.readFile(
      require.resolve("../../payroll/payroll.repository.ts"),
      "utf8"
    );
    const fnMatch = repoSource.match(
      /export async function deleteDraftLeaveHourlyForUserMonth[\s\S]*?^}/m
    );
    expect(fnMatch?.[0]).toMatch(/record_type.*leave_hourly/);
    expect(fnMatch?.[0]).not.toMatch(/manual_overtime/);
  });

  it("deleteSalaryDailyForUserMonth query targets salary_daily only", async () => {
    const fs = await import("fs/promises");
    const repoSource = await fs.readFile(
      require.resolve("../../payroll/payroll.repository.ts"),
      "utf8"
    );
    const fnMatch = repoSource.match(
      /export async function deleteSalaryDailyForUserMonth[\s\S]*?^}/m
    );
    expect(fnMatch?.[0]).toMatch(/record_type.*salary_daily/);
    expect(fnMatch?.[0]).not.toMatch(/manual_overtime/);
  });
});
