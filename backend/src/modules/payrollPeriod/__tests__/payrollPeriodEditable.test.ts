jest.mock("../../../config/supabase", () => ({
  supabaseAdmin: { from: jest.fn() },
}));

jest.mock("../../../config/env", () => ({
  ENV: { PAYROLL_PERIOD_LOCK_GATES_ENABLED: false },
}));

jest.mock("../payrollPeriod.repository", () => ({
  findByCompanyMonth: jest.fn(),
}));

import { ENV } from "../../../config/env";
import * as payrollPeriodRepo from "../payrollPeriod.repository";
import {
  assertPayrollPeriodEditable,
  assertPayrollPeriodEditableForDate,
  isPayrollPeriodLockGatesEnabled,
  PayrollPeriodLockedError,
} from "../payrollPeriodEditable";

const periodId = "11111111-1111-4111-8111-111111111111";

describe("payrollPeriodEditable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ENV as { PAYROLL_PERIOD_LOCK_GATES_ENABLED: boolean }).PAYROLL_PERIOD_LOCK_GATES_ENABLED =
      false;
  });

  it("reports gates disabled when ENV override is false", () => {
    expect(isPayrollPeriodLockGatesEnabled()).toBe(false);
  });

  it("allows mutations when gates disabled even if period locked", async () => {
    jest.mocked(payrollPeriodRepo.findByCompanyMonth).mockResolvedValue({
      id: periodId,
      company_id: "c1",
      payroll_year: 2026,
      payroll_month: 6,
      status: "locked",
    } as never);

    await expect(assertPayrollPeriodEditable("c1", 2026, 6)).resolves.toBeUndefined();
    expect(payrollPeriodRepo.findByCompanyMonth).not.toHaveBeenCalled();
  });

  it("blocks mutations when gates enabled and period locked", async () => {
    (ENV as { PAYROLL_PERIOD_LOCK_GATES_ENABLED: boolean }).PAYROLL_PERIOD_LOCK_GATES_ENABLED =
      true;
    jest.mocked(payrollPeriodRepo.findByCompanyMonth).mockResolvedValue({
      id: periodId,
      company_id: "c1",
      payroll_year: 2026,
      payroll_month: 6,
      status: "locked",
    } as never);

    await expect(assertPayrollPeriodEditable("c1", 2026, 6)).rejects.toThrow(
      PayrollPeriodLockedError
    );
    await expect(assertPayrollPeriodEditable("c1", 2026, 6)).rejects.toThrow(
      /has been locked and cannot be modified/
    );
  });

  it("blocks archived (and legacy closed) periods when gates enabled", async () => {
    (ENV as { PAYROLL_PERIOD_LOCK_GATES_ENABLED: boolean }).PAYROLL_PERIOD_LOCK_GATES_ENABLED =
      true;
    jest.mocked(payrollPeriodRepo.findByCompanyMonth).mockResolvedValue({
      status: "closed",
      payroll_year: 2026,
      payroll_month: 6,
    } as never);

    await expect(assertPayrollPeriodEditable("c1", 2026, 6)).rejects.toThrow(
      PayrollPeriodLockedError
    );
  });

  it("blocks approved periods when gates enabled", async () => {
    (ENV as { PAYROLL_PERIOD_LOCK_GATES_ENABLED: boolean }).PAYROLL_PERIOD_LOCK_GATES_ENABLED =
      true;
    jest.mocked(payrollPeriodRepo.findByCompanyMonth).mockResolvedValue({
      status: "approved",
      payroll_year: 2026,
      payroll_month: 6,
    } as never);

    await expect(assertPayrollPeriodEditable("c1", 2026, 6)).rejects.toThrow(
      PayrollPeriodLockedError
    );
  });

  it("allows when no period row exists", async () => {
    (ENV as { PAYROLL_PERIOD_LOCK_GATES_ENABLED: boolean }).PAYROLL_PERIOD_LOCK_GATES_ENABLED =
      true;
    jest.mocked(payrollPeriodRepo.findByCompanyMonth).mockResolvedValue(null);

    await expect(assertPayrollPeriodEditable("c1", 2026, 6)).resolves.toBeUndefined();
  });

  it("assertPayrollPeriodEditableForDate derives month from YMD", async () => {
    (ENV as { PAYROLL_PERIOD_LOCK_GATES_ENABLED: boolean }).PAYROLL_PERIOD_LOCK_GATES_ENABLED =
      true;
    jest.mocked(payrollPeriodRepo.findByCompanyMonth).mockResolvedValue({
      status: "locked",
      payroll_year: 2026,
      payroll_month: 6,
    } as never);

    await expect(
      assertPayrollPeriodEditableForDate("c1", "2026-06-15")
    ).rejects.toThrow(PayrollPeriodLockedError);
    expect(payrollPeriodRepo.findByCompanyMonth).toHaveBeenCalledWith("c1", 2026, 6);
  });
});
