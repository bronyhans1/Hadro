import * as payrollRepo from "../payroll.repository";
import * as sessionsRepo from "../../sessions/sessions.repository";
import * as leaveRepo from "../../leave/leave.repository";
import * as syncFailuresRepo from "../payrollSyncFailures.repository";
import { getPayrollHealth } from "../payrollHealth.service";

jest.mock("../payroll.repository");
jest.mock("../../sessions/sessions.repository");
jest.mock("../../leave/leave.repository");
jest.mock("../payrollSyncFailures.repository");

describe("payrollHealth.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(payrollRepo.getPayrollByMonth).mockResolvedValue([
      {
        id: "p1",
        user_id: "u1",
        company_id: "c1",
        session_id: "s1",
        regular_minutes: 480,
        overtime_minutes: 0,
        hours_worked: 8,
        hourly_rate: 20,
        gross_earnings: 160,
        payroll_date: "2026-06-15",
        status: "draft",
        record_type: "session_hourly",
        earning_source: "attendance",
      },
      {
        id: "p2",
        user_id: "u2",
        company_id: "c1",
        session_id: null,
        regular_minutes: 0,
        overtime_minutes: 120,
        hours_worked: 0,
        hourly_rate: 20,
        gross_earnings: 40,
        payroll_date: "2026-06-16",
        status: "approved",
        record_type: "manual_overtime",
        earning_source: "manual_overtime",
      },
    ] as never);
    jest.mocked(sessionsRepo.listPendingRemoteSessions).mockResolvedValue([
      {
        id: "rs1",
        check_in: "2026-06-10T08:00:00.000Z",
      },
    ] as never);
    jest.mocked(leaveRepo.listLeaveRequestsForReport).mockResolvedValue({
      rows: [
        {
          id: "l1",
          approved_at: "2026-06-05T10:00:00.000Z",
          terminated_at: null,
          cancelled_at: null,
        },
      ],
      total: 1,
    } as never);
    jest.mocked(syncFailuresRepo.listRecentForCompany).mockResolvedValue([]);
  });

  it("returns health payload with readiness status", async () => {
    const result = await getPayrollHealth("c1", 2026, 6);
    expect(result.period.label).toBe("June 2026");
    expect(result.counts.draftRecords).toBe(1);
    expect(result.counts.approvedRecords).toBe(1);
    expect(result.counts.pendingRemoteAttendance).toBe(1);
    expect(result.counts.leaveChangesInMonth).toBe(1);
    expect(result.readiness.status).toBe("action_required");
  });
});
