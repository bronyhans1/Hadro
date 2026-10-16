import { supabaseAdmin } from "../../../config/supabase";
import * as payrollRepo from "../payroll.repository";
import * as wageRatesRepo from "../wageRates.repository";
import * as sessionsRepo from "../../sessions/sessions.repository";
import * as companyPolicyService from "../../companyPolicy/companyPolicy.service";
import {
  processSessionPayroll,
  syncDraftHourlyPayrollForAttendanceDay,
} from "../payroll.service";
import { WorkSessionStatus } from "../../../constants/workSessionStatus";

jest.mock("../../../config/supabase", () => ({
  supabaseAdmin: { from: jest.fn() },
}));

jest.mock("../payroll.repository");
jest.mock("../wageRates.repository");
jest.mock("../../sessions/sessions.repository");
jest.mock("../../companyPolicy/companyPolicy.service");
jest.mock("../../shifts/shifts.repository");
jest.mock("../../payrollPeriod/payrollPeriod.repository", () => ({
  findByCompanyMonth: jest.fn().mockResolvedValue({
    id: "period-1",
    company_id: "c1",
    payroll_year: 2026,
    payroll_month: 6,
    status: "draft",
  }),
}));
jest.mock("../../payrollPeriod/payrollPeriod.service", () => ({
  getOrCreate: jest.fn().mockResolvedValue({
    id: "period-1",
    company_id: "c1",
    payroll_year: 2026,
    payroll_month: 6,
    status: "draft",
  }),
}));

import * as shiftsRepo from "../../shifts/shifts.repository";

const sessionA = {
  id: "sess-a",
  user_id: "u1",
  company_id: "c1",
  check_in: "2026-06-01T08:00:00.000Z",
  check_out: "2026-06-01T13:00:00.000Z",
  duration_minutes: 300,
  status: WorkSessionStatus.COMPLETED,
  late_minutes: 0,
};

const sessionB = {
  id: "sess-b",
  user_id: "u1",
  company_id: "c1",
  check_in: "2026-06-01T14:00:00.000Z",
  check_out: "2026-06-01T19:00:00.000Z",
  duration_minutes: 300,
  status: WorkSessionStatus.COMPLETED,
  late_minutes: 0,
};

const policy = {
  default_daily_hours: 8,
  overtime_multiplier: 1.5,
  overtime_policy_mode: "duration",
  late_pay_deduction_enabled: false,
};

describe("syncDraftHourlyPayrollForAttendanceDay", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(companyPolicyService.getPolicy).mockResolvedValue(policy as never);
    jest.mocked(wageRatesRepo.getHourlyRate).mockResolvedValue(20);
    jest.mocked(payrollRepo.getPayrollBySessionId).mockResolvedValue(null);
    jest.mocked(shiftsRepo.getShiftById).mockResolvedValue(null);
    jest.mocked(payrollRepo.createPayrollRecord).mockImplementation(async (data) => ({
      id: `p-${data.session_id}`,
      ...data,
      status: "draft",
    }) as never);
  });

  test("Case 5: approved row is not overwritten", async () => {
    jest.mocked(payrollRepo.getPayrollBySessionId).mockImplementation(async (sid) => {
      if (sid === "sess-a") {
        return {
          id: "p-approved",
          session_id: "sess-a",
          status: "approved",
          regular_minutes: 300,
          overtime_minutes: 0,
        } as never;
      }
      return null;
    });

    const map = new Map([
      ["sess-a", sessionA as never],
      ["sess-b", sessionB as never],
    ]);

    const result = await syncDraftHourlyPayrollForAttendanceDay(
      "u1",
      "c1",
      "2026-06-01",
      map,
      [sessionA as never, sessionB as never]
    );

    expect(result.protectedSkipped).toBe(1);
    expect(result.wrote).toBe(1);
    expect(payrollRepo.createPayrollRecord).toHaveBeenCalledTimes(1);
    expect(payrollRepo.createPayrollRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: "sess-b",
        regular_minutes: 180,
        overtime_minutes: 120,
      })
    );
  });

  test("Case 6: locked row is not overwritten", async () => {
    jest.mocked(payrollRepo.getPayrollBySessionId).mockResolvedValue({
      id: "p-locked",
      session_id: "sess-a",
      status: "locked",
      regular_minutes: 300,
      overtime_minutes: 0,
    } as never);

    const map = new Map([["sess-a", sessionA as never]]);

    const result = await syncDraftHourlyPayrollForAttendanceDay(
      "u1",
      "c1",
      "2026-06-01",
      map,
      [sessionA as never]
    );

    expect(result.protectedSkipped).toBe(1);
    expect(result.wrote).toBe(0);
    expect(payrollRepo.createPayrollRecord).not.toHaveBeenCalled();
  });

  test("rebuilds all draft rows on same day with daily OT split", async () => {
    const map = new Map([
      ["sess-a", sessionA as never],
      ["sess-b", sessionB as never],
    ]);

    const result = await syncDraftHourlyPayrollForAttendanceDay(
      "u1",
      "c1",
      "2026-06-01",
      map,
      [sessionA as never, sessionB as never]
    );

    expect(result.wrote).toBe(2);
    expect(payrollRepo.createPayrollRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: "sess-a",
        regular_minutes: 300,
        overtime_minutes: 0,
      })
    );
    expect(payrollRepo.createPayrollRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: "sess-b",
        regular_minutes: 180,
        overtime_minutes: 120,
        gross_earnings: 120,
        overtime_compensation_method_applied: "multiplier",
        overtime_multiplier_applied: 1.5,
        fixed_overtime_rate_applied: null,
      })
    );
  });

  test("fixed_rate mode: OT pay uses company fixed rate, minutes unchanged", async () => {
    jest.mocked(companyPolicyService.getPolicy).mockResolvedValue({
      ...policy,
      overtime_compensation_method: "fixed_rate",
      fixed_overtime_hourly_rate: 20,
    } as never);

    const map = new Map([
      ["sess-a", sessionA as never],
      ["sess-b", sessionB as never],
    ]);

    await syncDraftHourlyPayrollForAttendanceDay(
      "u1",
      "c1",
      "2026-06-01",
      map,
      [sessionA as never, sessionB as never]
    );

    expect(payrollRepo.createPayrollRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: "sess-b",
        regular_minutes: 180,
        overtime_minutes: 120,
        gross_earnings: 100,
        overtime_compensation_method_applied: "fixed_rate",
        overtime_multiplier_applied: null,
        fixed_overtime_rate_applied: 20,
      })
    );
  });

  test("shift-based OT: 6h shift with 8h51m worked", async () => {
    const shiftSession = {
      id: "sess-shift",
      user_id: "u1",
      company_id: "c1",
      shift_id: "shift-6h",
      check_in: "2026-06-01T22:00:00.000Z",
      check_out: "2026-06-02T06:51:00.000Z",
      duration_minutes: 531,
      status: WorkSessionStatus.COMPLETED,
      late_minutes: 0,
    };

    jest.mocked(shiftsRepo.getShiftById).mockResolvedValue({
      id: "shift-6h",
      company_id: "c1",
      name: "Night",
      start_time: "22:00",
      end_time: "04:00",
      grace_minutes: 0,
      created_at: "",
      spans_midnight: true,
      is_active: true,
    } as never);

    const map = new Map([["sess-shift", shiftSession as never]]);

    await syncDraftHourlyPayrollForAttendanceDay(
      "u1",
      "c1",
      "2026-06-01",
      map,
      [shiftSession as never]
    );

    expect(payrollRepo.createPayrollRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: "sess-shift",
        regular_minutes: 360,
        overtime_minutes: 171,
      })
    );
  });
});

describe("processSessionPayroll", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(companyPolicyService.isPayrollEnabled).mockResolvedValue(true);
    jest.mocked(companyPolicyService.getPolicy).mockResolvedValue(policy as never);
    jest.mocked(sessionsRepo.getSessionById).mockResolvedValue(sessionB as never);
    jest.mocked(sessionsRepo.listSessionsForUser).mockResolvedValue({
      rows: [sessionA as never, sessionB as never],
      total: 2,
    });
    jest.mocked(wageRatesRepo.getHourlyRate).mockResolvedValue(20);
    jest.mocked(payrollRepo.getPayrollBySessionId).mockResolvedValue(null);
    jest.mocked(shiftsRepo.getShiftById).mockResolvedValue(null);
    jest.mocked(payrollRepo.createPayrollRecord).mockImplementation(async (data) => ({
      id: `p-${data.session_id}`,
      ...data,
      status: "draft",
    }) as never);
  });

  test("clock-out on second session updates both draft rows for the day", async () => {
    const result = await processSessionPayroll("sess-b");
    expect(result.status).toBe("ok");
    expect(payrollRepo.createPayrollRecord).toHaveBeenCalledTimes(2);
  });

  test("monthly employee skipped — no hourly rate", async () => {
    jest.mocked(wageRatesRepo.getHourlyRate).mockResolvedValue(null);
    const result = await processSessionPayroll("sess-b");
    expect(result).toEqual({ status: "skipped", reason: "no_hourly_rate" });
    expect(payrollRepo.createPayrollRecord).not.toHaveBeenCalled();
  });
});
