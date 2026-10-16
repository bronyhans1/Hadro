import type { Response } from "express";
import type { ContextRequest } from "../../../middleware/context.middleware";
import * as payrollPeriodService from "../payrollPeriod.service";
import {
  approve,
  closePeriod,
  getById,
  getByYearMonth,
  listPeriods,
  lockPeriod,
  reopenPeriod,
  submitForReview,
} from "../payrollPeriod.controller";

jest.mock("../payrollPeriod.service");
jest.mock("../../../lib/companyRequestContext", () => ({
  getRequiredCompanyContext: jest.fn(() => ({
    companyId: "c1",
    userId: "u1",
  })),
}));

function mockRes(): Response {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

const period = {
  id: "11111111-1111-4111-8111-111111111111",
  company_id: "c1",
  payroll_year: 2026,
  payroll_month: 6,
  status: "draft" as const,
  business_timezone: "Africa/Accra",
  generated_at: "2026-06-01T10:00:00.000Z",
  generated_by: null,
  generated_by_name: null,
  submitted_for_review_at: null,
  submitted_by: null,
  submitted_by_name: null,
  approved_at: null,
  approved_by: null,
  approved_by_name: null,
  locked_by_name: null,
  locked_at: null,
  locked_by: null,
  closed_by_name: null,
  closed_at: null,
  closed_by: null,
  reopened_by_name: null,
  reopen_reason_label: null,
  reopen_explanation: null,
  reopened_at: null,
  reopened_by: null,
  reopen_reason: null,
  notes: null,
  created_at: "2026-06-01T10:00:00.000Z",
  updated_at: "2026-06-01T10:00:00.000Z",
  period_label: "June 2026",
};

describe("payrollPeriod.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET list returns periods", async () => {
    jest.mocked(payrollPeriodService.normalizeListOptions).mockReturnValue({ limit: 24, offset: 0 });
    jest.mocked(payrollPeriodService.listPeriods).mockResolvedValue({
      periods: [period],
      total: 1,
    });
    const req = { query: {} } as unknown as ContextRequest;
    const res = mockRes();

    await listPeriods(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { periods: [period], total: 1 },
    });
  });

  it("GET by month with create_if_missing calls getOrCreate", async () => {
    jest.mocked(payrollPeriodService.getOrCreate).mockResolvedValue(period);
    const req = {
      params: { year: "2026", month: "6" },
      query: { create_if_missing: "true" },
    } as unknown as ContextRequest;
    const res = mockRes();

    await getByYearMonth(req, res);

    expect(payrollPeriodService.getOrCreate).toHaveBeenCalledWith("c1", 2026, 6);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: period });
  });

  it("GET by month without create_if_missing returns 404 when absent", async () => {
    jest.mocked(payrollPeriodService.getByCompanyMonth).mockResolvedValue(null);
    const req = {
      params: { year: "2026", month: "6" },
      query: {},
    } as unknown as ContextRequest;
    const res = mockRes();

    await getByYearMonth(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Payroll period not found",
    });
  });

  it("GET by month returns 400 for invalid month", async () => {
    jest
      .mocked(payrollPeriodService.getByCompanyMonth)
      .mockRejectedValue(new payrollPeriodService.PayrollPeriodValidationError("Valid month (1-12) is required"));
    const req = {
      params: { year: "2026", month: "13" },
      query: {},
    } as unknown as ContextRequest;
    const res = mockRes();

    await getByYearMonth(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("GET by id returns period", async () => {
    jest.mocked(payrollPeriodService.getById).mockResolvedValue(period);
    const req = { params: { id: "11111111-1111-4111-8111-111111111111" } } as unknown as ContextRequest;
    const res = mockRes();

    await getById(req, res);

    expect(payrollPeriodService.getById).toHaveBeenCalledWith(
      "c1",
      "11111111-1111-4111-8111-111111111111"
    );
    expect(res.json).toHaveBeenCalledWith({ success: true, data: period });
  });

  it("GET by id returns 404 when not found", async () => {
    jest.mocked(payrollPeriodService.getById).mockResolvedValue(null);
    const req = { params: { id: "11111111-1111-4111-8111-111111111111" } } as unknown as ContextRequest;
    const res = mockRes();

    await getById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("POST submit-review returns updated period", async () => {
    jest.mocked(payrollPeriodService.submitForReview).mockResolvedValue({
      ...period,
      status: "processing",
    });
    const req = { params: { id: period.id } } as unknown as ContextRequest;
    const res = mockRes();

    await submitForReview(req, res);

    expect(payrollPeriodService.submitForReview).toHaveBeenCalledWith("c1", period.id, "u1");
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({ status: "processing" }),
    });
  });

  it("POST submit-review returns 409 on invalid transition", async () => {
    jest
      .mocked(payrollPeriodService.submitForReview)
      .mockRejectedValue(new payrollPeriodService.PayrollPeriodTransitionError("invalid"));
    const req = { params: { id: period.id } } as unknown as ContextRequest;
    const res = mockRes();

    await submitForReview(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("POST approve returns updated period", async () => {
    jest.mocked(payrollPeriodService.approve).mockResolvedValue({
      ...period,
      status: "approved",
    });
    const req = { params: { id: period.id } } as unknown as ContextRequest;
    const res = mockRes();

    await approve(req, res);

    expect(payrollPeriodService.approve).toHaveBeenCalledWith("c1", period.id, "u1");
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({ status: "approved" }),
    });
  });

  it("POST approve returns 409 when not in processing", async () => {
    jest
      .mocked(payrollPeriodService.approve)
      .mockRejectedValue(
        new payrollPeriodService.PayrollPeriodTransitionError(
          "Payroll period must be in processing before it can be approved"
        )
      );
    const req = { params: { id: period.id } } as unknown as ContextRequest;
    const res = mockRes();

    await approve(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("POST lock returns updated period", async () => {
    jest.mocked(payrollPeriodService.lock).mockResolvedValue({
      ...period,
      status: "locked",
    });
    const req = { params: { id: period.id } } as unknown as ContextRequest;
    const res = mockRes();

    await lockPeriod(req, res);

    expect(payrollPeriodService.lock).toHaveBeenCalledWith("c1", period.id, "u1");
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({ status: "locked" }),
    });
  });

  it("POST lock returns 409 when not approved", async () => {
    jest
      .mocked(payrollPeriodService.lock)
      .mockRejectedValue(
        new payrollPeriodService.PayrollPeriodTransitionError(
          "Payroll period must be approved before it can be locked"
        )
      );
    const req = { params: { id: period.id } } as unknown as ContextRequest;
    const res = mockRes();

    await lockPeriod(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("POST close returns updated period", async () => {
    jest.mocked(payrollPeriodService.close).mockResolvedValue({
      ...period,
      status: "archived",
    });
    const req = { params: { id: period.id } } as unknown as ContextRequest;
    const res = mockRes();

    await closePeriod(req, res);

    expect(payrollPeriodService.close).toHaveBeenCalledWith("c1", period.id, "u1");
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({ status: "archived" }),
    });
  });

  it("POST close returns 409 when not locked", async () => {
    jest
      .mocked(payrollPeriodService.close)
      .mockRejectedValue(
        new payrollPeriodService.PayrollPeriodTransitionError(
          "Payroll period must be locked before it can be archived"
        )
      );
    const req = { params: { id: period.id } } as unknown as ContextRequest;
    const res = mockRes();

    await closePeriod(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("POST close returns 404 when not found", async () => {
    jest.mocked(payrollPeriodService.close).mockResolvedValue(null);
    const req = { params: { id: period.id } } as unknown as ContextRequest;
    const res = mockRes();

    await closePeriod(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("POST reopen returns updated period", async () => {
    const reopenInput = {
      reason_code: "missing_manual_ot",
      explanation: "Missing manual overtime entries for two employees.",
    };
    jest.mocked(payrollPeriodService.normalizeReopenInput).mockReturnValue(reopenInput);
    jest.mocked(payrollPeriodService.reopen).mockResolvedValue({
      ...period,
      status: "processing",
      reopened_at: "2026-06-16T10:00:00.000Z",
    });
    const req = {
      params: { id: period.id },
      body: {
        reason_code: "missing_manual_ot",
        explanation: "Missing manual overtime entries for two employees.",
      },
    } as unknown as ContextRequest;
    const res = mockRes();

    await reopenPeriod(req, res);

    expect(payrollPeriodService.normalizeReopenInput).toHaveBeenCalledWith(req.body);
    expect(payrollPeriodService.reopen).toHaveBeenCalledWith(
      "c1",
      period.id,
      "u1",
      expect.objectContaining({ reason_code: "missing_manual_ot" })
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({ status: "processing" }),
    });
  });

  it("POST reopen returns 400 for missing explanation", async () => {
    jest
      .mocked(payrollPeriodService.normalizeReopenInput)
      .mockImplementation(() => {
        throw new payrollPeriodService.PayrollPeriodValidationError(
          "Reopen explanation is required"
        );
      });
    const req = {
      params: { id: period.id },
      body: { reason_code: "other" },
    } as unknown as ContextRequest;
    const res = mockRes();

    await reopenPeriod(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("POST reopen returns 409 when not finalized", async () => {
    jest.mocked(payrollPeriodService.normalizeReopenInput).mockReturnValue({
      reason_code: "other",
      explanation: "Valid explanation with enough characters.",
    });
    jest
      .mocked(payrollPeriodService.reopen)
      .mockRejectedValue(
        new payrollPeriodService.PayrollPeriodTransitionError(
          "Payroll period must be approved, locked, or archived before it can be reopened"
        )
      );
    const req = {
      params: { id: period.id },
      body: {
        reason_code: "other",
        explanation: "Valid explanation with enough characters.",
      },
    } as unknown as ContextRequest;
    const res = mockRes();

    await reopenPeriod(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });
});
