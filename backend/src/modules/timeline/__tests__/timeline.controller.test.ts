import type { Response } from "express";
import type { ContextRequest } from "../../../middleware/context.middleware";
import * as timelineService from "../timeline.service";
import { listTimeline } from "../timeline.controller";

jest.mock("../timeline.service");
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

describe("timeline.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET timeline returns events newest first payload", async () => {
    jest.mocked(timelineService.normalizeListOptions).mockReturnValue({
      module: "payroll",
      entityType: "payroll_period",
      entityId: "p1",
      limit: 50,
      offset: 0,
    });
    jest.mocked(timelineService.listEvents).mockResolvedValue({
      events: [
        {
          id: "e1",
          company_id: "c1",
          module: "payroll",
          entity_type: "payroll_period",
          entity_id: "p1",
          event_type: "payroll_period.locked",
          title: "Payroll Locked",
          description: "June 2026 payroll was locked.",
          performed_by: "u1",
          performed_by_name: "Jane",
          occurred_at: "2026-06-14T10:00:00.000Z",
          metadata: { previous_status: "approved", current_status: "locked" },
          created_at: "2026-06-14T10:00:00.000Z",
          updated_at: "2026-06-14T10:00:00.000Z",
        },
      ],
      total: 1,
    });

    const req = {
      query: {
        module: "payroll",
        entity_type: "payroll_period",
        entity_id: "p1",
      },
    } as unknown as ContextRequest;
    const res = mockRes();

    await listTimeline(req, res);

    expect(timelineService.listEvents).toHaveBeenCalledWith(
      "c1",
      expect.objectContaining({ module: "payroll", entityId: "p1" })
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({ total: 1 }),
    });
  });

  it("GET timeline returns 400 for invalid limit", async () => {
    jest
      .mocked(timelineService.normalizeListOptions)
      .mockImplementation(() => {
        throw new timelineService.TimelineValidationError("limit must be a positive integer");
      });
    const req = { query: { limit: "0" } } as unknown as ContextRequest;
    const res = mockRes();

    await listTimeline(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
