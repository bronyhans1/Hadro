import * as companyPolicyRepo from "../../companyPolicy/companyPolicy.repository";
import * as usersRepo from "../../users/users.repository";
import * as payrollPeriodRepo from "../payrollPeriod.repository";
import {
  approve,
  close,
  formatPayrollPeriodLabel,
  getByCompanyMonth,
  getById,
  getOrCreate,
  listPeriods,
  lock,
  normalizeReopenInput,
  PayrollPeriodTransitionError,
  PayrollPeriodValidationError,
  parseReopenReasonCode,
  reopen,
  submitForReview,
  validatePayrollMonth,
  validatePayrollYear,
  validateReopenExplanation,
} from "../payrollPeriod.service";

jest.mock("../payrollPeriod.repository");
jest.mock("../../companyPolicy/companyPolicy.repository");
jest.mock("../../users/users.repository");
jest.mock("../payrollPeriod.timeline", () => ({
  recordPayrollPeriodCreated: jest.fn().mockResolvedValue(undefined),
  recordPayrollPeriodSubmittedForReview: jest.fn().mockResolvedValue(undefined),
  recordPayrollPeriodApproved: jest.fn().mockResolvedValue(undefined),
  recordPayrollPeriodLocked: jest.fn().mockResolvedValue(undefined),
  recordPayrollPeriodClosed: jest.fn().mockResolvedValue(undefined),
  recordPayrollPeriodReopened: jest.fn().mockResolvedValue(undefined),
}));
import * as payrollPeriodTimeline from "../payrollPeriod.timeline";

const periodId = "11111111-1111-4111-8111-111111111111";

const baseRow = {
  id: periodId,
  company_id: "c1",
  payroll_year: 2026,
  payroll_month: 6,
  status: "draft" as const,
  business_timezone: "Africa/Accra",
  generated_at: "2026-06-01T10:00:00.000Z",
  generated_by: null,
  submitted_for_review_at: null,
  submitted_by: null,
  approved_at: null,
  approved_by: null,
  locked_at: null,
  locked_by: null,
  closed_at: null,
  closed_by: null,
  reopened_at: null,
  reopened_by: null,
  reopen_reason: null,
  reopen_explanation: null,
  notes: null,
  created_at: "2026-06-01T10:00:00.000Z",
  updated_at: "2026-06-01T10:00:00.000Z",
};

describe("payrollPeriod.service validation", () => {
  it("rejects invalid year", () => {
    expect(() => validatePayrollYear(1999)).toThrow(PayrollPeriodValidationError);
    expect(() => validatePayrollYear(2101)).toThrow(PayrollPeriodValidationError);
  });

  it("rejects invalid month", () => {
    expect(() => validatePayrollMonth(0)).toThrow(PayrollPeriodValidationError);
    expect(() => validatePayrollMonth(13)).toThrow(PayrollPeriodValidationError);
  });

  it("formats period label", () => {
    expect(formatPayrollPeriodLabel(2026, 6)).toBe("June 2026");
  });
});

describe("payrollPeriod.service getOrCreate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(companyPolicyRepo.getPolicyByCompany).mockResolvedValue({
      business_timezone: "Africa/Accra",
    } as never);
    jest.mocked(usersRepo.getUserById).mockResolvedValue(null);
  });

  it("is idempotent via upsertDraft", async () => {
    jest.mocked(payrollPeriodRepo.findByCompanyMonth).mockResolvedValue(baseRow);
    jest.mocked(payrollPeriodRepo.upsertDraft).mockResolvedValue(baseRow);

    const first = await getOrCreate("c1", 2026, 6);
    const second = await getOrCreate("c1", 2026, 6);

    expect(payrollPeriodRepo.upsertDraft).toHaveBeenCalledTimes(2);
    expect(payrollPeriodTimeline.recordPayrollPeriodCreated).not.toHaveBeenCalled();
    expect(payrollPeriodRepo.upsertDraft).toHaveBeenCalledWith({
      company_id: "c1",
      payroll_year: 2026,
      payroll_month: 6,
      business_timezone: "Africa/Accra",
      generated_by: null,
    });
    expect(first.id).toBe(periodId);
    expect(second.id).toBe(periodId);
    expect(first.period_label).toBe("June 2026");
  });

  it("copies business timezone from company policy", async () => {
    jest.mocked(companyPolicyRepo.getPolicyByCompany).mockResolvedValue({
      business_timezone: "America/New_York",
    } as never);
    jest.mocked(payrollPeriodRepo.upsertDraft).mockResolvedValue({
      ...baseRow,
      business_timezone: "America/New_York",
    });

    const result = await getOrCreate("c1", 2026, 6);
    expect(payrollPeriodRepo.upsertDraft).toHaveBeenCalledWith(
      expect.objectContaining({ business_timezone: "America/New_York" })
    );
    expect(result.business_timezone).toBe("America/New_York");
  });

  it("records timeline event only on first create", async () => {
    jest.mocked(payrollPeriodRepo.findByCompanyMonth).mockResolvedValue(null);
    jest.mocked(payrollPeriodRepo.upsertDraft).mockResolvedValue(baseRow);

    await getOrCreate("c1", 2026, 6, "u1");

    expect(payrollPeriodTimeline.recordPayrollPeriodCreated).toHaveBeenCalledTimes(1);
  });
});

describe("payrollPeriod.service reads", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(usersRepo.getUserById).mockResolvedValue(null);
  });

  it("getByCompanyMonth returns null when absent", async () => {
    jest.mocked(payrollPeriodRepo.findByCompanyMonth).mockResolvedValue(null);
    const result = await getByCompanyMonth("c1", 2026, 6);
    expect(result).toBeNull();
  });

  it("getByCompanyMonth returns enriched period", async () => {
    jest.mocked(payrollPeriodRepo.findByCompanyMonth).mockResolvedValue(baseRow);
    const result = await getByCompanyMonth("c1", 2026, 6);
    expect(result?.period_label).toBe("June 2026");
  });

  it("getById enforces company isolation", async () => {
    const periodId = "11111111-1111-4111-8111-111111111111";
    jest.mocked(payrollPeriodRepo.findById).mockResolvedValue(null);
    const result = await getById("c1", periodId);
    expect(payrollPeriodRepo.findById).toHaveBeenCalledWith(periodId, "c1");
    expect(result).toBeNull();
  });

  it("getById rejects invalid uuid", async () => {
    await expect(getById("c1", "not-a-uuid")).rejects.toThrow(PayrollPeriodValidationError);
  });

  it("listPeriods returns mapped rows", async () => {
    jest.mocked(payrollPeriodRepo.listByCompany).mockResolvedValue({
      periods: [baseRow],
      total: 1,
    });
    const result = await listPeriods("c1", { year: 2026 });
    expect(result.total).toBe(1);
    expect(result.periods[0]?.period_label).toBe("June 2026");
    expect(payrollPeriodRepo.listByCompany).toHaveBeenCalledWith("c1", { year: 2026 });
  });
});

describe("payrollPeriod.service workflow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(usersRepo.getUserById).mockResolvedValue({
      first_name: "Jane",
      last_name: "HR",
      email: "jane@example.com",
    } as never);
  });

  it("submitForReview transitions draft to processing", async () => {
    jest.mocked(payrollPeriodRepo.findById).mockResolvedValue(baseRow);
    jest.mocked(payrollPeriodRepo.updateTransition).mockResolvedValue({
      ...baseRow,
      status: "processing",
      submitted_for_review_at: "2026-06-10T10:00:00.000Z",
      submitted_by: "u1",
    });

    const result = await submitForReview("c1", periodId, "u1");

    expect(payrollPeriodRepo.updateTransition).toHaveBeenCalledWith(
      periodId,
      "c1",
      expect.objectContaining({
        status: "processing",
        submitted_by: "u1",
      })
    );
    expect(result?.status).toBe("processing");
    expect(result?.submitted_by_name).toBe("Jane HR");
  });

  it("submitForReview is idempotent when already in processing", async () => {
    jest.mocked(payrollPeriodRepo.findById).mockResolvedValue({
      ...baseRow,
      status: "processing",
      submitted_for_review_at: "2026-06-10T10:00:00.000Z",
      submitted_by: "u1",
    });

    const result = await submitForReview("c1", periodId, "u2");

    expect(payrollPeriodRepo.updateTransition).not.toHaveBeenCalled();
    expect(result?.status).toBe("processing");
    expect(payrollPeriodTimeline.recordPayrollPeriodSubmittedForReview).not.toHaveBeenCalled();
  });

  it("submitForReview is idempotent when already approved", async () => {
    jest.mocked(payrollPeriodRepo.findById).mockResolvedValue({
      ...baseRow,
      status: "approved",
    });

    const result = await submitForReview("c1", periodId, "u2");

    expect(payrollPeriodRepo.updateTransition).not.toHaveBeenCalled();
    expect(result?.status).toBe("approved");
  });

  it("approve transitions processing to approved", async () => {
    jest.mocked(payrollPeriodRepo.findById).mockResolvedValue({
      ...baseRow,
      status: "processing",
    });
    jest.mocked(payrollPeriodRepo.updateTransition).mockResolvedValue({
      ...baseRow,
      status: "approved",
      approved_at: "2026-06-12T10:00:00.000Z",
      approved_by: "u1",
    });

    const result = await approve("c1", periodId, "u1");

    expect(payrollPeriodRepo.updateTransition).toHaveBeenCalledWith(
      periodId,
      "c1",
      expect.objectContaining({
        status: "approved",
        approved_by: "u1",
      })
    );
    expect(result?.status).toBe("approved");
    expect(result?.approved_by_name).toBe("Jane HR");
  });

  it("approve is idempotent when already approved", async () => {
    jest.mocked(payrollPeriodRepo.findById).mockResolvedValue({
      ...baseRow,
      status: "approved",
      approved_at: "2026-06-12T10:00:00.000Z",
      approved_by: "u1",
    });

    const result = await approve("c1", periodId, "u2");

    expect(payrollPeriodRepo.updateTransition).not.toHaveBeenCalled();
    expect(result?.status).toBe("approved");
  });

  it("approve rejects draft status", async () => {
    jest.mocked(payrollPeriodRepo.findById).mockResolvedValue(baseRow);

    await expect(approve("c1", periodId, "u1")).rejects.toThrow(PayrollPeriodTransitionError);
    expect(payrollPeriodRepo.updateTransition).not.toHaveBeenCalled();
  });

  it("submitForReview enforces company isolation via findById", async () => {
    jest.mocked(payrollPeriodRepo.findById).mockResolvedValue(null);

    const result = await submitForReview("c1", periodId, "u1");

    expect(payrollPeriodRepo.findById).toHaveBeenCalledWith(periodId, "c1");
    expect(result).toBeNull();
  });
});

describe("payrollPeriod.service lock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(usersRepo.getUserById).mockResolvedValue({
      first_name: "Jane",
      last_name: "HR",
      email: "jane@example.com",
    } as never);
  });

  it("locks approved period", async () => {
    jest.mocked(payrollPeriodRepo.findById).mockResolvedValue({
      ...baseRow,
      status: "approved",
    });
    jest.mocked(payrollPeriodRepo.updateTransition).mockResolvedValue({
      ...baseRow,
      status: "locked",
      locked_at: "2026-06-14T10:00:00.000Z",
      locked_by: "u1",
    });

    const result = await lock("c1", periodId, "u1");

    expect(payrollPeriodRepo.updateTransition).toHaveBeenCalledWith(
      periodId,
      "c1",
      expect.objectContaining({ status: "locked", locked_by: "u1" })
    );
    expect(result?.status).toBe("locked");
    expect(payrollPeriodTimeline.recordPayrollPeriodLocked).toHaveBeenCalled();
  });

  it("duplicate lock is idempotent", async () => {
    jest.mocked(payrollPeriodRepo.findById).mockResolvedValue({
      ...baseRow,
      status: "locked",
      locked_at: "2026-06-14T10:00:00.000Z",
      locked_by: "u1",
    });

    const result = await lock("c1", periodId, "u2");

    expect(payrollPeriodRepo.updateTransition).not.toHaveBeenCalled();
    expect(payrollPeriodTimeline.recordPayrollPeriodLocked).not.toHaveBeenCalled();
    expect(result?.status).toBe("locked");
  });

  it("archived period lock is idempotent", async () => {
    jest.mocked(payrollPeriodRepo.findById).mockResolvedValue({
      ...baseRow,
      status: "archived",
    });

    const result = await lock("c1", periodId, "u1");

    expect(payrollPeriodRepo.updateTransition).not.toHaveBeenCalled();
    expect(result?.status).toBe("archived");
  });

  it("rejects lock from processing", async () => {
    jest.mocked(payrollPeriodRepo.findById).mockResolvedValue({
      ...baseRow,
      status: "processing",
    });

    await expect(lock("c1", periodId, "u1")).rejects.toThrow(PayrollPeriodTransitionError);
  });

  it("rejects lock from draft", async () => {
    jest.mocked(payrollPeriodRepo.findById).mockResolvedValue(baseRow);

    await expect(lock("c1", periodId, "u1")).rejects.toThrow(PayrollPeriodTransitionError);
  });
});

describe("payrollPeriod.service close", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(usersRepo.getUserById).mockResolvedValue({
      first_name: "Jane",
      last_name: "HR",
      email: "jane@example.com",
    } as never);
  });

  it("archives locked period", async () => {
    jest.mocked(payrollPeriodRepo.findById).mockResolvedValue({
      ...baseRow,
      status: "locked",
      locked_at: "2026-06-14T10:00:00.000Z",
      locked_by: "u1",
    });
    jest.mocked(payrollPeriodRepo.updateTransition).mockResolvedValue({
      ...baseRow,
      status: "archived",
      closed_at: "2026-06-15T10:00:00.000Z",
      closed_by: "u1",
    });

    const result = await close("c1", periodId, "u1");

    expect(payrollPeriodRepo.updateTransition).toHaveBeenCalledWith(
      periodId,
      "c1",
      expect.objectContaining({ status: "archived", closed_by: "u1" })
    );
    expect(result?.status).toBe("archived");
    expect(payrollPeriodTimeline.recordPayrollPeriodClosed).toHaveBeenCalled();
  });

  it("duplicate archive is idempotent", async () => {
    jest.mocked(payrollPeriodRepo.findById).mockResolvedValue({
      ...baseRow,
      status: "archived",
      closed_at: "2026-06-15T10:00:00.000Z",
      closed_by: "u1",
    });

    const result = await close("c1", periodId, "u2");

    expect(payrollPeriodRepo.updateTransition).not.toHaveBeenCalled();
    expect(result?.status).toBe("archived");
  });

  it("rejects close from approved", async () => {
    jest.mocked(payrollPeriodRepo.findById).mockResolvedValue({
      ...baseRow,
      status: "approved",
    });

    await expect(close("c1", periodId, "u1")).rejects.toThrow(PayrollPeriodTransitionError);
  });

  it("rejects close from draft", async () => {
    jest.mocked(payrollPeriodRepo.findById).mockResolvedValue(baseRow);

    await expect(close("c1", periodId, "u1")).rejects.toThrow(PayrollPeriodTransitionError);
  });

  it("rejects archive from processing", async () => {
    jest.mocked(payrollPeriodRepo.findById).mockResolvedValue({
      ...baseRow,
      status: "processing",
    });

    await expect(close("c1", periodId, "u1")).rejects.toThrow(PayrollPeriodTransitionError);
  });

  it("close enforces company isolation via findById", async () => {
    jest.mocked(payrollPeriodRepo.findById).mockResolvedValue(null);

    const result = await close("c1", periodId, "u1");

    expect(payrollPeriodRepo.findById).toHaveBeenCalledWith(periodId, "c1");
    expect(result).toBeNull();
  });
});

const validReopenInput = {
  reason_code: "missing_manual_ot",
  explanation: "Missing manual overtime entries for two employees on June 12.",
};

describe("payrollPeriod.service reopen validation", () => {
  it("parses valid reason code", () => {
    expect(parseReopenReasonCode("attendance_correction")).toBe("attendance_correction");
  });

  it("rejects missing reason code", () => {
    expect(() => parseReopenReasonCode("")).toThrow(PayrollPeriodValidationError);
  });

  it("rejects short explanation", () => {
    expect(() => validateReopenExplanation("too short")).toThrow(PayrollPeriodValidationError);
  });

  it("rejects whitespace-only explanation", () => {
    expect(() => validateReopenExplanation("   ")).toThrow(PayrollPeriodValidationError);
  });

  it("normalizes reopen input", () => {
    expect(
      normalizeReopenInput({
        reason_code: "other",
        explanation: "  Detailed explanation for reopening payroll.  ",
      })
    ).toEqual({
      reason_code: "other",
      explanation: "Detailed explanation for reopening payroll.",
    });
  });
});

describe("payrollPeriod.service reopen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(usersRepo.getUserById).mockResolvedValue({
      first_name: "Jane",
      last_name: "HR",
      email: "jane@example.com",
    } as never);
  });

  it("reopens archived period to processing", async () => {
    jest.mocked(payrollPeriodRepo.findById).mockResolvedValue({
      ...baseRow,
      status: "archived",
      closed_at: "2026-06-15T10:00:00.000Z",
      closed_by: "u1",
    });
    jest.mocked(payrollPeriodRepo.updateTransition).mockResolvedValue({
      ...baseRow,
      status: "processing",
      reopened_at: "2026-06-16T10:00:00.000Z",
      reopened_by: "u2",
      reopen_reason: "missing_manual_ot",
      reopen_explanation: validReopenInput.explanation,
    });

    const result = await reopen("c1", periodId, "u2", validReopenInput);

    expect(payrollPeriodRepo.updateTransition).toHaveBeenCalledWith(
      periodId,
      "c1",
      expect.objectContaining({
        status: "processing",
        reopen_reason: "missing_manual_ot",
        reopen_explanation: validReopenInput.explanation,
      })
    );
    expect(result?.status).toBe("processing");
    expect(result?.reopened_by_name).toBe("Jane HR");
    expect(result?.reopen_reason_label).toBe("Missing Manual OT");
    expect(payrollPeriodTimeline.recordPayrollPeriodReopened).toHaveBeenCalled();
  });

  it("rejects duplicate reopen on already reopened processing period", async () => {
    jest.mocked(payrollPeriodRepo.findById).mockResolvedValue({
      ...baseRow,
      status: "processing",
      reopened_at: "2026-06-16T10:00:00.000Z",
      reopened_by: "u2",
      reopen_reason: "missing_manual_ot",
    });

    await expect(reopen("c1", periodId, "u2", validReopenInput)).rejects.toThrow(
      PayrollPeriodTransitionError
    );
    expect(payrollPeriodRepo.updateTransition).not.toHaveBeenCalled();
  });

  it("reopens locked period to processing", async () => {
    jest.mocked(payrollPeriodRepo.findById).mockResolvedValue({
      ...baseRow,
      status: "locked",
    });
    jest.mocked(payrollPeriodRepo.updateTransition).mockResolvedValue({
      ...baseRow,
      status: "processing",
      reopened_at: "2026-06-16T10:00:00.000Z",
      reopened_by: "u1",
      reopen_reason: "missing_manual_ot",
      reopen_explanation: validReopenInput.explanation,
    });

    const result = await reopen("c1", periodId, "u1", validReopenInput);

    expect(result?.status).toBe("processing");
    expect(payrollPeriodRepo.updateTransition).toHaveBeenCalledWith(
      periodId,
      "c1",
      expect.objectContaining({ status: "processing" })
    );
  });

  it("re-approve and re-lock after reopen", async () => {
    jest.mocked(payrollPeriodRepo.findById).mockResolvedValue({
      ...baseRow,
      status: "approved",
      reopened_at: "2026-06-16T10:00:00.000Z",
      reopened_by: "u2",
    });
    jest.mocked(payrollPeriodRepo.updateTransition).mockResolvedValue({
      ...baseRow,
      status: "locked",
      locked_at: "2026-06-17T10:00:00.000Z",
      locked_by: "u2",
    });

    const result = await lock("c1", periodId, "u2");

    expect(result?.status).toBe("locked");
  });

  it("archive after re-lock", async () => {
    jest.mocked(payrollPeriodRepo.findById).mockResolvedValue({
      ...baseRow,
      status: "locked",
      reopened_at: "2026-06-16T10:00:00.000Z",
    });
    jest.mocked(payrollPeriodRepo.updateTransition).mockResolvedValue({
      ...baseRow,
      status: "archived",
      closed_at: "2026-06-18T10:00:00.000Z",
      closed_by: "u2",
    });

    const result = await close("c1", periodId, "u2");

    expect(result?.status).toBe("archived");
  });

  it("reopen enforces company isolation via findById", async () => {
    jest.mocked(payrollPeriodRepo.findById).mockResolvedValue(null);

    const result = await reopen("c1", periodId, "u1", validReopenInput);

    expect(payrollPeriodRepo.findById).toHaveBeenCalledWith(periodId, "c1");
    expect(result).toBeNull();
  });
});
