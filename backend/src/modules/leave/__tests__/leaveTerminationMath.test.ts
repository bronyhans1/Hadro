import {
  computeLeaveUsedDaysFirstDayBack,
  computeRestoredDaysFromTermination,
  defaultTerminateReturnDate,
  isValidTerminateReturnDate,
  maxTerminateReturnDateYmd,
} from "../leaveTerminationMath";
import { isDateWithinLeavePayrollPeriod } from "../../payroll/payrollLeaveCoverage";
import type { LeaveRequestRecord } from "../leave.repository";

describe("defaultTerminateReturnDate", () => {
  const multi = { start_date: "2026-06-01", end_date: "2026-06-02" }; // Mon–Tue

  test("mid multi-day leave defaults to next day (termination day stays eligible)", () => {
    // Terminate Monday → first day back Tuesday
    expect(defaultTerminateReturnDate(multi, "2026-06-01")).toBe("2026-06-02");
  });

  test("Monday–Tuesday terminate Monday keeps Monday in payroll period", () => {
    const returnYmd = defaultTerminateReturnDate(multi, "2026-06-01");
    const terminated = {
      status: "terminated",
      start_date: multi.start_date,
      end_date: multi.end_date,
      actual_return_date: returnYmd,
    } as Pick<
      LeaveRequestRecord,
      "status" | "start_date" | "end_date" | "actual_return_date"
    >;
    expect(isDateWithinLeavePayrollPeriod(terminated, "2026-06-01")).toBe(true);
    expect(isDateWithinLeavePayrollPeriod(terminated, "2026-06-02")).toBe(false);
  });

  test("single-day leave defaults to day after end (keeps that day eligible)", () => {
    const single = { start_date: "2026-06-01", end_date: "2026-06-01" };
    expect(defaultTerminateReturnDate(single, "2026-06-01")).toBe("2026-06-02");
    expect(defaultTerminateReturnDate(single, "2026-06-01")).toBe(
      maxTerminateReturnDateYmd(single.end_date)
    );
  });

  test("final day of leave defaults to day after approved end", () => {
    const leave = { start_date: "2026-06-01", end_date: "2026-06-05" };
    expect(defaultTerminateReturnDate(leave, "2026-06-05")).toBe("2026-06-06");
  });

  test("before leave starts defaults to start (zero used days)", () => {
    expect(defaultTerminateReturnDate(multi, "2026-05-28")).toBe("2026-06-01");
    expect(computeLeaveUsedDaysFirstDayBack("2026-06-01", "2026-06-01")).toBe(0);
  });

  test("after leave ends defaults to max return", () => {
    expect(defaultTerminateReturnDate(multi, "2026-06-10")).toBe("2026-06-03");
  });

  test("explicit same-day return remains valid when chosen", () => {
    expect(isValidTerminateReturnDate("2026-06-01", "2026-06-02", "2026-06-01")).toBe(
      true
    );
    const r = computeRestoredDaysFromTermination({
      startDateYmd: "2026-06-01",
      endDateYmd: "2026-06-02",
      totalDays: 2,
      actualReturnDateYmd: "2026-06-01",
    });
    expect(r?.usedDays).toBe(0);
    expect(r?.restoredDays).toBe(2);
  });
});
