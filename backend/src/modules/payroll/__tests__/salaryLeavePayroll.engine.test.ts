import {
  computeHourlyPaidLeaveGross,
  resolveMonthlyWorkingDayPayroll,
} from "../salaryLeavePayroll.engine";
import { isAttendanceEarningRecord, isPaidLeaveEarningRecord } from "../payrollRecordSemantics";

describe("salaryLeavePayroll.engine", () => {
  test("PAID_LEAVE working day yields full daily rate with paid_leave source", () => {
    const r = resolveMonthlyWorkingDayPayroll({
      leaveClassification: "PAID_LEAVE",
      workedMinutes: 0,
      classificationEnabled: true,
      thresholds: { min: 60, full: 480 },
      dailyRate: 150,
    });
    expect(r.gross).toBe(150);
    expect(r.dayUnits).toBe(1);
    expect(r.earningSource).toBe("paid_leave");
  });

  test("UNPAID_LEAVE yields zero gross", () => {
    const r = resolveMonthlyWorkingDayPayroll({
      leaveClassification: "UNPAID_LEAVE",
      workedMinutes: 480,
      classificationEnabled: false,
      thresholds: { min: 60, full: 480 },
      dailyRate: 150,
    });
    expect(r.gross).toBe(0);
    expect(r.dayUnits).toBe(0);
  });

  test("WORKING uses attendance minutes", () => {
    const r = resolveMonthlyWorkingDayPayroll({
      leaveClassification: "WORKING",
      workedMinutes: 480,
      classificationEnabled: false,
      thresholds: { min: 60, full: 480 },
      dailyRate: 100,
    });
    expect(r.gross).toBe(100);
    expect(r.earningSource).toBe("attendance");
  });

  test("hourly paid leave: 8h × $20 = $160", () => {
    expect(computeHourlyPaidLeaveGross(8, 20)).toBe(160);
  });
});

describe("payrollRecordSemantics", () => {
  test("leave_hourly is paid leave earning", () => {
    expect(isPaidLeaveEarningRecord({ record_type: "leave_hourly", earning_source: "paid_leave" })).toBe(
      true
    );
    expect(isAttendanceEarningRecord({ record_type: "leave_hourly", earning_source: "paid_leave" })).toBe(
      false
    );
  });

  test("salary_daily tagged paid_leave", () => {
    expect(
      isPaidLeaveEarningRecord({ record_type: "salary_daily", earning_source: "paid_leave" })
    ).toBe(true);
  });

  test("session_hourly is attendance earning", () => {
    expect(isAttendanceEarningRecord({ record_type: "session_hourly", earning_source: "attendance" })).toBe(
      true
    );
  });
});
