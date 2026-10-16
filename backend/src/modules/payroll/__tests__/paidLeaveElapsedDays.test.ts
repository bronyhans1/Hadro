import * as payrollRepo from "../payroll.repository";
import * as wageRepo from "../../wageRates/wageRates.repository";
import * as payrollWageRepo from "../wageRates.repository";
import * as companyPolicy from "../../companyPolicy/companyPolicy.service";
import * as payrollLeaveAwareness from "../payrollLeaveAwareness.service";
import * as holidaysRepo from "../../holidays/holidays.repository";
import { syncHourlyLeavePayrollForMonth } from "../hourlyLeavePayroll.service";
import { syncMonthlySalaryPayroll } from "../salaryEarnings.service";

jest.mock("../../../config/supabase", () => ({
  supabaseAdmin: { from: jest.fn() },
}));
jest.mock("../payroll.repository");
jest.mock("../../wageRates/wageRates.repository");
jest.mock("../wageRates.repository");
jest.mock("../../companyPolicy/companyPolicy.service");
jest.mock("../../holidays/holidays.repository");
jest.mock("../../sessions/sessions.repository", () => ({
  listSessionsForUser: jest.fn().mockResolvedValue({ rows: [], total: 0 }),
}));
jest.mock("../../attendanceDayOverrides/attendanceDayOverrides.repository", () => ({
  listForUserRange: jest.fn().mockResolvedValue([]),
}));
jest.mock("../payrollLeaveAwareness.service");
jest.mock("../../payrollPeriod/payrollPeriodEditable", () => ({
  getPayrollPeriodEditability: jest.fn().mockResolvedValue({
    editable: true,
    periodId: "period-1",
    status: "draft",
  }),
}));
jest.mock("../payrollPeriodOwnership", () => ({
  resolveEditablePayrollPeriodId: jest.fn().mockResolvedValue("period-1"),
}));
jest.mock("../leaveExpectedHours.service", () => ({
  resolveExpectedLeaveHoursForUser: jest.fn().mockResolvedValue(8),
  resolveScheduledShiftForUser: jest.fn().mockResolvedValue({
    id: "shift-1",
    start_time: "08:00",
    end_time: "17:00",
    grace_minutes: 0,
    spans_midnight: false,
    is_active: true,
  }),
}));
jest.mock("../../../lib/shiftWindow", () => {
  const actual = jest.requireActual("../../../lib/shiftWindow");
  return {
    ...actual,
    hasScheduledShiftClosed: jest.fn().mockReturnValue(true),
    toShiftWindowSource: actual.toShiftWindowSource,
  };
});

const LEAVE_ID = "leave-june";
const USER = "u1";
const COMPANY = "c1";
const YEAR = 2026;
const MONTH = 6;

function paidLeaveDay(iso: string) {
  return {
    date: iso,
    classification: "PAID_LEAVE" as const,
    leaveCoverage: {
      leaveRequestId: LEAVE_ID,
      leaveType: "annual",
      leaveStatus: "approved" as const,
      compensationClass: "paid" as const,
      payrollDayClassification: "PAID_LEAVE" as const,
      startDate: "2026-06-15",
      endDate: "2026-06-16",
      actualReturnDate: null,
    },
    coveredByPaidLeave: true,
    coveredByUnpaidLeave: false,
  };
}

function buildLeaveMap(dates: string[]) {
  const map = new Map<string, ReturnType<typeof paidLeaveDay>>();
  for (const d of dates) {
    map.set(d, paidLeaveDay(d));
  }
  return map;
}

const policy = {
  default_daily_hours: 8,
  working_weekdays: [1, 2, 3, 4, 5],
  business_timezone: "Africa/Accra",
  attendance_day_classification_enabled: false,
};

describe("syncHourlyLeavePayrollForMonth — elapsed paid leave days", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(companyPolicy.isPayrollEnabled).mockResolvedValue(true);
    jest.mocked(companyPolicy.getPolicy).mockResolvedValue(policy as never);
    jest.mocked(wageRepo.getEffectiveWageRow).mockResolvedValue({
      rate_type: "hourly",
      hourly_rate: 50,
      monthly_salary: null,
    } as never);
    jest.mocked(payrollWageRepo.getHourlyRate).mockResolvedValue(50);
    jest.mocked(payrollRepo.getPayrollByUserMonth).mockResolvedValue([]);
    jest.mocked(payrollRepo.deleteDraftLeaveHourlyForUserMonth).mockResolvedValue(undefined);
    jest.mocked(payrollRepo.insertLeaveHourlyRecord).mockImplementation(async (data) => ({
      id: `lh-${data.earnings_date}`,
      ...data,
      status: "draft",
    }) as never);
    jest
      .mocked(payrollLeaveAwareness.getPayrollDayClassificationsForRange)
      .mockResolvedValue(buildLeaveMap(["2026-06-15", "2026-06-16"]));
  });

  test("sync on 13 June → 0 leave rows", async () => {
    await syncHourlyLeavePayrollForMonth(USER, COMPANY, YEAR, MONTH, "2026-06-13");
    expect(payrollRepo.insertLeaveHourlyRecord).not.toHaveBeenCalled();
  });

  test("sync on 15 June with shift still open → 0 leave rows", async () => {
    const { hasScheduledShiftClosed } = jest.requireMock("../../../lib/shiftWindow") as {
      hasScheduledShiftClosed: jest.Mock;
    };
    hasScheduledShiftClosed.mockReturnValueOnce(false);
    await syncHourlyLeavePayrollForMonth(USER, COMPANY, YEAR, MONTH, "2026-06-15");
    expect(payrollRepo.insertLeaveHourlyRecord).not.toHaveBeenCalled();
    hasScheduledShiftClosed.mockReturnValue(true);
  });

  test("sync on 15 June → 1 leave row (15th only)", async () => {
    await syncHourlyLeavePayrollForMonth(USER, COMPANY, YEAR, MONTH, "2026-06-15");
    expect(payrollRepo.insertLeaveHourlyRecord).toHaveBeenCalledTimes(1);
    expect(payrollRepo.insertLeaveHourlyRecord).toHaveBeenCalledWith(
      expect.objectContaining({ earnings_date: "2026-06-15" })
    );
  });

  test("sync on 16 June → 2 leave rows", async () => {
    await syncHourlyLeavePayrollForMonth(USER, COMPANY, YEAR, MONTH, "2026-06-16");
    expect(payrollRepo.insertLeaveHourlyRecord).toHaveBeenCalledTimes(2);
    expect(payrollRepo.insertLeaveHourlyRecord).toHaveBeenCalledWith(
      expect.objectContaining({ earnings_date: "2026-06-15" })
    );
    expect(payrollRepo.insertLeaveHourlyRecord).toHaveBeenCalledWith(
      expect.objectContaining({ earnings_date: "2026-06-16" })
    );
  });
});

describe("syncMonthlySalaryPayroll — elapsed paid leave days", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(companyPolicy.isPayrollEnabled).mockResolvedValue(true);
    jest.mocked(companyPolicy.getPolicy).mockResolvedValue(policy as never);
    jest.mocked(companyPolicy.isLatePayDeductionEnabled).mockResolvedValue(false);
    jest.mocked(holidaysRepo.listHolidaysForCompanyRange).mockResolvedValue([]);
    jest.mocked(wageRepo.getEffectiveWageRow).mockResolvedValue({
      rate_type: "monthly",
      monthly_salary: 6000,
      salary_divisor_type: "fixed_days",
      salary_divisor_value: 30,
    } as never);
    jest.mocked(payrollRepo.getPayrollByUserMonth).mockResolvedValue([]);
    jest.mocked(payrollRepo.deleteSalaryDailyForUserMonth).mockResolvedValue(undefined);
    jest.mocked(payrollRepo.deleteDraftLeaveHourlyForUserMonth).mockResolvedValue(undefined);
    jest.mocked(payrollRepo.insertSalaryDailyRecord).mockImplementation(async (data) => ({
      id: `sd-${data.earnings_date}`,
      ...data,
      status: "draft",
    }) as never);
    jest
      .mocked(payrollLeaveAwareness.getPayrollDayClassificationsForRange)
      .mockResolvedValue(buildLeaveMap(["2026-06-15", "2026-06-16"]));
  });

  test("sync on 13 June → no paid_leave salary_daily rows", async () => {
    await syncMonthlySalaryPayroll(USER, COMPANY, YEAR, MONTH, "2026-06-13");
    const paidLeaveInserts = jest
      .mocked(payrollRepo.insertSalaryDailyRecord)
      .mock.calls.filter((c) => c[0].earning_source === "paid_leave");
    expect(paidLeaveInserts).toHaveLength(0);
  });

  test("sync on 15 June → one paid_leave row", async () => {
    await syncMonthlySalaryPayroll(USER, COMPANY, YEAR, MONTH, "2026-06-15");
    const paidLeaveInserts = jest
      .mocked(payrollRepo.insertSalaryDailyRecord)
      .mock.calls.filter((c) => c[0].earning_source === "paid_leave");
    expect(paidLeaveInserts).toHaveLength(1);
    expect(paidLeaveInserts[0]![0].earnings_date).toBe("2026-06-15");
  });

  test("sync on 16 June → two paid_leave rows", async () => {
    await syncMonthlySalaryPayroll(USER, COMPANY, YEAR, MONTH, "2026-06-16");
    const paidLeaveInserts = jest
      .mocked(payrollRepo.insertSalaryDailyRecord)
      .mock.calls.filter((c) => c[0].earning_source === "paid_leave");
    expect(paidLeaveInserts).toHaveLength(2);
    expect(paidLeaveInserts.map((c) => c[0].earnings_date).sort()).toEqual([
      "2026-06-15",
      "2026-06-16",
    ]);
  });

  test("future paid holiday on 17 June still credited when today is 13 June", async () => {
    jest.mocked(holidaysRepo.listHolidaysForCompanyRange).mockResolvedValue([
      {
        id: "h1",
        company_id: COMPANY,
        holiday_date: "2026-06-17",
        name: "Future holiday",
        is_paid: true,
      },
    ] as never);

    await syncMonthlySalaryPayroll(USER, COMPANY, YEAR, MONTH, "2026-06-13");

    const holidayInserts = jest
      .mocked(payrollRepo.insertSalaryDailyRecord)
      .mock.calls.filter((c) => c[0].earnings_date === "2026-06-17");
    expect(holidayInserts.length).toBeGreaterThanOrEqual(1);
  });
});
