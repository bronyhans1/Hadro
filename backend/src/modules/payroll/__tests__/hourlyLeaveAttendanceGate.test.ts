import * as payrollRepo from "../payroll.repository";
import { prepareHourlyLeaveCreditAgainstAttendance } from "../hourlyLeaveAttendanceGate";
import { syncHourlyLeavePayrollForMonth } from "../hourlyLeavePayroll.service";
import * as wageRepo from "../../wageRates/wageRates.repository";
import * as payrollWageRepo from "../wageRates.repository";
import * as companyPolicy from "../../companyPolicy/companyPolicy.service";
import * as payrollLeaveAwareness from "../payrollLeaveAwareness.service";
import { creditPaidLeaveWorkforceEvent } from "../../workforceEvents/paidLeave/paidLeaveDailyEarnings.engine";
import * as leaveExpectedHours from "../leaveExpectedHours.service";

jest.mock("../../../config/supabase", () => ({
  supabaseAdmin: { from: jest.fn() },
}));
jest.mock("../payroll.repository");
jest.mock("../../wageRates/wageRates.repository");
jest.mock("../wageRates.repository");
jest.mock("../../companyPolicy/companyPolicy.service");
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
jest.mock("../../holidays/holidays.repository", () => ({
  listHolidaysForCompanyRange: jest.fn().mockResolvedValue([]),
}));

const USER = "u1";
const COMPANY = "c1";
const DAY = "2026-06-15";

describe("prepareHourlyLeaveCreditAgainstAttendance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(payrollRepo.deleteDraftSessionHourlyForUserAttendanceDay)
      .mockResolvedValue(undefined);
  });

  test("approved session_hourly → skip with protected_attendance_row", async () => {
    jest.mocked(payrollRepo.findProtectedSessionHourlyForAttendanceDay).mockResolvedValue({
      id: "sh-approved",
      status: "approved",
      record_type: "session_hourly",
      payroll_date: DAY,
    } as never);

    const r = await prepareHourlyLeaveCreditAgainstAttendance({
      userId: USER,
      companyId: COMPANY,
      attendanceDayYmd: DAY,
    });
    expect(r).toEqual({ ok: false, reason: "protected_attendance_row" });
    expect(payrollRepo.deleteDraftSessionHourlyForUserAttendanceDay).not.toHaveBeenCalled();
  });

  test("locked session_hourly → skip with protected_attendance_row", async () => {
    jest.mocked(payrollRepo.findProtectedSessionHourlyForAttendanceDay).mockResolvedValue({
      id: "sh-locked",
      status: "locked",
      record_type: "session_hourly",
      payroll_date: DAY,
    } as never);

    const r = await prepareHourlyLeaveCreditAgainstAttendance({
      userId: USER,
      companyId: COMPANY,
      attendanceDayYmd: DAY,
    });
    expect(r).toEqual({ ok: false, reason: "protected_attendance_row" });
    expect(payrollRepo.deleteDraftSessionHourlyForUserAttendanceDay).not.toHaveBeenCalled();
  });

  test("no protected attendance → clears drafts and allows credit", async () => {
    jest.mocked(payrollRepo.findProtectedSessionHourlyForAttendanceDay).mockResolvedValue(null);

    const r = await prepareHourlyLeaveCreditAgainstAttendance({
      userId: USER,
      companyId: COMPANY,
      attendanceDayYmd: DAY,
    });
    expect(r).toEqual({ ok: true });
    expect(payrollRepo.deleteDraftSessionHourlyForUserAttendanceDay).toHaveBeenCalledWith(
      USER,
      COMPANY,
      DAY
    );
  });
});

describe("syncHourlyLeavePayrollForMonth — protected attendance gate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(companyPolicy.isPayrollEnabled).mockResolvedValue(true);
    jest.mocked(companyPolicy.getPolicy).mockResolvedValue({
      default_daily_hours: 8,
      business_timezone: "Africa/Accra",
      overnight_shifts_enabled: false,
    } as never);
    jest.mocked(wageRepo.getEffectiveWageRow).mockResolvedValue({
      rate_type: "hourly",
      hourly_rate: 50,
    } as never);
    jest.mocked(payrollWageRepo.getHourlyRate).mockResolvedValue(50);
    jest.mocked(payrollRepo.deleteDraftLeaveHourlyForUserMonth).mockResolvedValue(undefined);
    jest
      .mocked(payrollRepo.deleteDraftSessionHourlyForUserAttendanceDay)
      .mockResolvedValue(undefined);
    jest.mocked(payrollRepo.findProtectedSessionHourlyForAttendanceDay).mockResolvedValue(null);
    jest.mocked(payrollRepo.insertLeaveHourlyRecord).mockImplementation(async (data) => ({
      id: `lh-${data.earnings_date}`,
      ...data,
      status: "draft",
    }) as never);
    jest.mocked(payrollLeaveAwareness.getPayrollDayClassificationsForRange).mockResolvedValue(
      new Map([
        [
          DAY,
          {
            date: DAY,
            classification: "PAID_LEAVE",
            leaveCoverage: {
              leaveRequestId: "leave-1",
              leaveType: "annual",
              leaveStatus: "approved",
              compensationClass: "paid",
              payrollDayClassification: "PAID_LEAVE",
              startDate: DAY,
              endDate: DAY,
              actualReturnDate: null,
            },
            coveredByPaidLeave: true,
            coveredByUnpaidLeave: false,
          },
        ],
      ]) as never
    );
  });

  test("protected approved session_hourly → no leave_hourly insert", async () => {
    jest.mocked(payrollRepo.getPayrollByUserMonth).mockResolvedValue([
      {
        id: "sh1",
        record_type: "session_hourly",
        status: "approved",
        payroll_date: DAY,
        earnings_date: null,
      },
    ] as never);

    await syncHourlyLeavePayrollForMonth(USER, COMPANY, 2026, 6, DAY);
    expect(payrollRepo.insertLeaveHourlyRecord).not.toHaveBeenCalled();
  });

  test("draft attendance day → gate clears drafts and inserts leave_hourly", async () => {
    jest.mocked(payrollRepo.getPayrollByUserMonth).mockResolvedValue([]);

    await syncHourlyLeavePayrollForMonth(USER, COMPANY, 2026, 6, DAY);
    expect(payrollRepo.findProtectedSessionHourlyForAttendanceDay).toHaveBeenCalledWith(
      USER,
      COMPANY,
      DAY
    );
    expect(payrollRepo.deleteDraftSessionHourlyForUserAttendanceDay).toHaveBeenCalledWith(
      USER,
      COMPANY,
      DAY
    );
    expect(payrollRepo.insertLeaveHourlyRecord).toHaveBeenCalledWith(
      expect.objectContaining({ earnings_date: DAY })
    );
  });
});

describe("creditPaidLeaveWorkforceEvent — same attendance gate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(companyPolicy.isPayrollEnabled).mockResolvedValue(true);
    jest.mocked(companyPolicy.getPolicy).mockResolvedValue({
      default_daily_hours: 8,
      business_timezone: "Africa/Accra",
      overnight_shifts_enabled: false,
      working_weekdays: [1, 2, 3, 4, 5],
    } as never);
    jest.mocked(wageRepo.getEffectiveWageRow).mockResolvedValue({
      rate_type: "hourly",
      hourly_rate: 40,
    } as never);
    jest.mocked(payrollWageRepo.getHourlyRate).mockResolvedValue(40);
    jest.mocked(payrollRepo.getLeaveHourlyRecord).mockResolvedValue(null);
    jest.mocked(payrollRepo.findProtectedSessionHourlyForAttendanceDay).mockResolvedValue(null);
    jest
      .mocked(payrollRepo.deleteDraftSessionHourlyForUserAttendanceDay)
      .mockResolvedValue(undefined);
    jest.mocked(payrollRepo.insertLeaveHourlyRecord).mockImplementation(async (data) => ({
      id: "lh-new",
      ...data,
      status: "draft",
    }) as never);
    jest.mocked(payrollLeaveAwareness.getPayrollDayClassification).mockResolvedValue({
      date: DAY,
      classification: "PAID_LEAVE",
      leaveCoverage: {
        leaveRequestId: "leave-1",
        leaveType: "annual",
        leaveStatus: "approved",
        compensationClass: "paid",
        payrollDayClassification: "PAID_LEAVE",
        startDate: DAY,
        endDate: DAY,
        actualReturnDate: null,
      },
      coveredByPaidLeave: true,
      coveredByUnpaidLeave: false,
    } as never);
    jest.mocked(leaveExpectedHours.resolveExpectedLeaveHoursForUser).mockResolvedValue(8);
    jest.mocked(leaveExpectedHours.resolveScheduledShiftForUser).mockResolvedValue({
      id: "shift-1",
      start_time: "08:00",
      end_time: "17:00",
      grace_minutes: 0,
      spans_midnight: false,
      is_active: true,
    } as never);
  });

  test("locked session_hourly → skipped protected_attendance_row", async () => {
    jest.mocked(payrollRepo.findProtectedSessionHourlyForAttendanceDay).mockResolvedValue({
      id: "sh-locked",
      status: "locked",
      record_type: "session_hourly",
      payroll_date: DAY,
    } as never);

    const result = await creditPaidLeaveWorkforceEvent({
      companyId: COMPANY,
      userId: USER,
      ownershipYmd: DAY,
      eventType: "paid_leave",
      sourceId: "leave-1",
      now: new Date("2026-06-15T20:00:00.000Z"),
    });

    expect(result).toEqual({ status: "skipped", reason: "protected_attendance_row" });
    expect(payrollRepo.insertLeaveHourlyRecord).not.toHaveBeenCalled();
    expect(payrollRepo.deleteDraftSessionHourlyForUserAttendanceDay).not.toHaveBeenCalled();
  });

  test("existing leave_hourly → already_credited (no duplicate)", async () => {
    jest.mocked(payrollRepo.getLeaveHourlyRecord).mockResolvedValue({
      id: "lh-existing",
      status: "draft",
      record_type: "leave_hourly",
      earnings_date: DAY,
    } as never);

    const result = await creditPaidLeaveWorkforceEvent({
      companyId: COMPANY,
      userId: USER,
      ownershipYmd: DAY,
      eventType: "paid_leave",
      sourceId: "leave-1",
      now: new Date("2026-06-15T20:00:00.000Z"),
    });

    expect(result).toEqual({ status: "skipped", reason: "already_credited" });
    expect(payrollRepo.insertLeaveHourlyRecord).not.toHaveBeenCalled();
  });

  test("no conflict → leave_hourly credited after draft cleanup", async () => {
    const result = await creditPaidLeaveWorkforceEvent({
      companyId: COMPANY,
      userId: USER,
      ownershipYmd: DAY,
      eventType: "paid_leave",
      sourceId: "leave-1",
      now: new Date("2026-06-15T20:00:00.000Z"),
    });

    expect(result.status).toBe("credited");
    expect(payrollRepo.deleteDraftSessionHourlyForUserAttendanceDay).toHaveBeenCalledWith(
      USER,
      COMPANY,
      DAY
    );
    expect(payrollRepo.insertLeaveHourlyRecord).toHaveBeenCalledTimes(1);
  });
});
