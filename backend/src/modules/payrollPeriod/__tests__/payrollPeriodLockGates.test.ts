jest.mock("../../../config/supabase", () => ({
  supabaseAdmin: { from: jest.fn() },
}));

jest.mock("../../../config/env", () => ({
  ENV: { PAYROLL_PERIOD_LOCK_GATES_ENABLED: true },
}));

jest.mock("../payrollPeriod.repository", () => ({
  findByCompanyMonth: jest.fn(),
}));

import { ENV } from "../../../config/env";
import * as payrollPeriodRepo from "../payrollPeriod.repository";
import * as wageRatesRepo from "../../wageRates/wageRates.repository";
import { syncDraftHourlyPayrollForAttendanceDay } from "../../payroll/payroll.service";
import { syncMonthlySalaryPayroll } from "../../payroll/salaryEarnings.service";
import { syncHourlyLeavePayrollForMonth } from "../../payroll/hourlyLeavePayroll.service";
import { createManualOvertimeEntry } from "../../manualOvertime/manualOvertime.service";

jest.mock("../../companyPolicy/companyPolicy.service", () => ({
  isPayrollEnabled: jest.fn().mockResolvedValue(true),
  getPolicy: jest.fn().mockResolvedValue({
    overtime_policy_mode: "duration",
    business_timezone: "Africa/Accra",
    default_daily_hours: 8,
    working_weekdays: [1, 2, 3, 4, 5],
    manual_ot_stacking_mode: "warn",
  }),
}));
jest.mock("../../wageRates/wageRates.repository", () => ({
  getHourlyRate: jest.fn().mockResolvedValue(20),
  getEffectiveWageRow: jest.fn().mockResolvedValue({
    rate_type: "monthly",
    monthly_salary: 3000,
    salary_divisor_type: "fixed_days",
    salary_divisor_value: 22,
  }),
}));
jest.mock("../../payroll/wageRates.repository", () => ({
  getHourlyRate: jest.fn().mockResolvedValue(20),
}));
jest.mock("../../shifts/shifts.repository", () => ({
  getShiftById: jest.fn().mockResolvedValue(null),
}));
jest.mock("../../payroll/payroll.repository", () => ({
  getPayrollBySessionId: jest.fn().mockResolvedValue(null),
  createPayrollRecord: jest.fn(),
  deleteSalaryDailyForUserMonth: jest.fn(),
  deleteDraftLeaveHourlyForUserMonth: jest.fn(),
  getPayrollByUserMonth: jest.fn().mockResolvedValue([]),
  insertLeaveHourlyRecord: jest.fn(),
}));
jest.mock("../../sessions/sessions.repository", () => ({
  listSessionsForUser: jest.fn().mockResolvedValue({ rows: [] }),
}));
jest.mock("../../holidays/holidays.repository", () => ({
  listHolidaysForCompanyRange: jest.fn().mockResolvedValue([]),
}));
jest.mock("../../attendanceDayOverrides/attendanceDayOverrides.repository", () => ({
  listForUserRange: jest.fn().mockResolvedValue([]),
}));
jest.mock("../../payroll/payrollLeaveAwareness.service", () => ({
  getPayrollDayClassificationsForRange: jest.fn().mockResolvedValue(new Map()),
  getPayrollDayClassification: jest.fn().mockResolvedValue({
    coveredByPaidLeave: false,
    coveredByUnpaidLeave: false,
  }),
}));
jest.mock("../../payroll/paidLeavePayrollEligibility", () => ({
  resolveCompanyTodayIso: jest.fn().mockReturnValue("2026-06-30"),
  canCreditPaidLeaveDay: jest.fn().mockReturnValue(false),
}));
jest.mock("../../payroll/leaveExpectedHours.service", () => ({
  resolveExpectedLeaveHoursForUser: jest.fn().mockResolvedValue(8),
}));
jest.mock("../../manualOvertime/manualOvertime.repository", () => ({
  sumAttendanceOvertimeMinutesForDate: jest.fn().mockResolvedValue(0),
  sumExistingManualOvertimeMinutesForDate: jest.fn().mockResolvedValue(0),
  insertManualOvertimeEntry: jest.fn(),
}));
jest.mock("../../users/users.repository", () => ({
  findByIdAndCompanyId: jest.fn().mockResolvedValue({ first_name: "A", last_name: "B", email: "a@b.c" }),
}));
jest.mock("../../../lib/manualOvertimeScope", () => ({
  assertManualOvertimeTargetAllowed: jest.fn().mockResolvedValue({ ok: true }),
}));

const lockedPeriod = {
  id: "p1",
  company_id: "c1",
  payroll_year: 2026,
  payroll_month: 6,
  status: "locked" as const,
};

describe("payroll period lock gates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ENV as { PAYROLL_PERIOD_LOCK_GATES_ENABLED: boolean }).PAYROLL_PERIOD_LOCK_GATES_ENABLED =
      true;
    jest.mocked(payrollPeriodRepo.findByCompanyMonth).mockResolvedValue(lockedPeriod as never);
  });

  it("soft-skips attendance payroll regeneration for locked periods", async () => {
    await expect(
      syncDraftHourlyPayrollForAttendanceDay("u1", "c1", "2026-06-15", new Map(), [])
    ).resolves.toEqual({ wrote: 0, protectedSkipped: 0, rateSkipped: 0 });
  });

  it("soft-skips monthly salary refresh for locked periods", async () => {
    await expect(syncMonthlySalaryPayroll("u1", "c1", 2026, 6)).resolves.toBeUndefined();
  });

  it("soft-skips leave payroll resync for locked periods", async () => {
    jest.mocked(wageRatesRepo.getEffectiveWageRow).mockResolvedValue({
      rate_type: "hourly",
      hourly_rate: 20,
    } as never);
    await expect(syncHourlyLeavePayrollForMonth("u1", "c1", 2026, 6)).resolves.toBeUndefined();
  });

  it("blocks manual OT creation", async () => {
    const result = await createManualOvertimeEntry(
      { userId: "hr1", companyId: "c1", roles: ["HR"] } as never,
      "c1",
      "hr1",
      {
        user_id: "u1",
        earnings_date: "2026-06-15",
        hours: 2,
        reason: "Project deadline",
      }
    );
    expect(result.status).toBe(409);
    expect(result.error).toMatch(/locked/i);
  });
});
