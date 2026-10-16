jest.mock("../../../config/supabase", () => ({
  supabaseAdmin: { from: jest.fn() },
}));

jest.mock("../../../config/env", () => ({
  ENV: { PAYROLL_PERIOD_LOCK_GATES_ENABLED: true },
}));

jest.mock("../payrollPeriod.repository", () => ({
  findByCompanyMonth: jest.fn(),
}));

import * as payrollPeriodRepo from "../payrollPeriod.repository";
import {
  assertPayrollPeriodEditable,
  PayrollPeriodLockedError,
} from "../payrollPeriodEditable";

const archivedPeriod = {
  id: "p1",
  company_id: "c1",
  payroll_year: 2026,
  payroll_month: 6,
  status: "archived" as const,
};

const reopenedProcessingPeriod = {
  ...archivedPeriod,
  status: "processing" as const,
  reopened_at: "2026-06-16T10:00:00.000Z",
};

describe("payroll period reopen lock gates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("blocks mutations while archived", async () => {
    jest.mocked(payrollPeriodRepo.findByCompanyMonth).mockResolvedValue(archivedPeriod as never);

    await expect(assertPayrollPeriodEditable("c1", 2026, 6)).rejects.toThrow(
      PayrollPeriodLockedError
    );
  });

  it("blocks mutations while approved (unlock alone is not enough)", async () => {
    jest.mocked(payrollPeriodRepo.findByCompanyMonth).mockResolvedValue({
      ...archivedPeriod,
      status: "approved",
    } as never);

    await expect(assertPayrollPeriodEditable("c1", 2026, 6)).rejects.toThrow(
      PayrollPeriodLockedError
    );
  });

  it("allows mutations after reopen to processing", async () => {
    jest
      .mocked(payrollPeriodRepo.findByCompanyMonth)
      .mockResolvedValue(reopenedProcessingPeriod as never);

    await expect(assertPayrollPeriodEditable("c1", 2026, 6)).resolves.toBeUndefined();
  });
});
