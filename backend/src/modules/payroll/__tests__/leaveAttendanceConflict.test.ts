import {
  leaveBlocksSelfServiceAttendanceOnDate,
  shouldSuppressHourlyAttendanceForLeaveClassification,
} from "../payrollLeaveCoverage";
import { resolveMonthlyWorkingDayPayroll } from "../salaryLeavePayroll.engine";
import type { LeaveRequestRecord } from "../../leave/leave.repository";

function leave(
  partial: Partial<LeaveRequestRecord> &
    Pick<LeaveRequestRecord, "status" | "start_date" | "end_date">
): LeaveRequestRecord {
  return {
    id: "l1",
    user_id: "u1",
    company_id: "c1",
    total_days: 2,
    leave_type: "annual",
    reason: null,
    approved_by: null,
    approved_at: null,
    ...partial,
  };
}

describe("same-day leave vs attendance conflict prevention", () => {
  const monTue = leave({
    status: "terminated",
    start_date: "2026-06-01",
    end_date: "2026-06-02",
    actual_return_date: "2026-06-02",
    leave_compensation_type: "paid",
  });

  test("termination day (Mon) still leave for attendance block and paid-leave eligibility", () => {
    expect(leaveBlocksSelfServiceAttendanceOnDate(monTue, "2026-06-01")).toBe(true);
    expect(shouldSuppressHourlyAttendanceForLeaveClassification("PAID_LEAVE")).toBe(true);
  });

  test("first day back (Tue) allows attendance; not leave-blocked", () => {
    expect(leaveBlocksSelfServiceAttendanceOnDate(monTue, "2026-06-02")).toBe(false);
    expect(shouldSuppressHourlyAttendanceForLeaveClassification("WORKING")).toBe(false);
  });

  test("monthly leave wins over worked minutes on termination day", () => {
    const r = resolveMonthlyWorkingDayPayroll({
      leaveClassification: "PAID_LEAVE",
      workedMinutes: 240,
      classificationEnabled: false,
      thresholds: { min: 60, full: 480 },
      dailyRate: 200,
    });
    expect(r.earningSource).toBe("paid_leave");
    expect(r.gross).toBe(200);
  });

  test("approved leave blocks; explicit return=today unblocks termination day", () => {
    const approved = leave({
      status: "approved",
      start_date: "2026-06-01",
      end_date: "2026-06-02",
    });
    expect(leaveBlocksSelfServiceAttendanceOnDate(approved, "2026-06-01")).toBe(true);

    const returnedToday = leave({
      status: "terminated",
      start_date: "2026-06-01",
      end_date: "2026-06-02",
      actual_return_date: "2026-06-01",
    });
    expect(leaveBlocksSelfServiceAttendanceOnDate(returnedToday, "2026-06-01")).toBe(false);
  });
});
