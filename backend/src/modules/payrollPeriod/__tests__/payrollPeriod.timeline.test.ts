jest.mock("../../timeline/timeline.service");

import * as timelineService from "../../timeline/timeline.service";
import {
  recordPayrollPeriodApproved,
  recordPayrollPeriodCreated,
  recordPayrollPeriodReopened,
  PAYROLL_PERIOD_TIMELINE_EVENTS,
} from "../payrollPeriod.timeline";

const basePeriod = {
  id: "11111111-1111-4111-8111-111111111111",
  company_id: "c1",
  payroll_year: 2026,
  payroll_month: 6,
  status: "draft" as const,
  business_timezone: "Africa/Accra",
  generated_at: "2026-06-01T10:00:00.000Z",
  generated_by: "u1",
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

describe("payrollPeriod.timeline", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(timelineService.recordEvent).mockResolvedValue({} as never);
  });

  it("records payroll period created event", async () => {
    await recordPayrollPeriodCreated(basePeriod, "u1", "Jane Smith");

    expect(timelineService.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "c1",
        module: "payroll",
        entityType: "payroll_period",
        entityId: basePeriod.id,
        eventType: PAYROLL_PERIOD_TIMELINE_EVENTS.CREATED,
        title: "Payroll Period Created",
        performedBy: "u1",
        performedByName: "Jane Smith",
        metadata: expect.objectContaining({ year: 2026, month: 6 }),
      })
    );
  });

  it("records approved transition metadata", async () => {
    await recordPayrollPeriodApproved(
      { ...basePeriod, status: "approved", approved_at: "2026-06-10T10:00:00.000Z" },
      "processing",
      "u1",
      "Jane Smith"
    );

    expect(timelineService.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: PAYROLL_PERIOD_TIMELINE_EVENTS.APPROVED,
        metadata: expect.objectContaining({
          previous_status: "processing",
          current_status: "approved",
        }),
      })
    );
  });

  it("records reopen reason in metadata", async () => {
    await recordPayrollPeriodReopened(
      {
        ...basePeriod,
        status: "processing",
        reopened_at: "2026-06-16T10:00:00.000Z",
        reopen_reason: "missing_manual_ot",
      },
      "u1",
      "Jane Smith",
      "missing_manual_ot",
      "archived"
    );

    expect(timelineService.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: PAYROLL_PERIOD_TIMELINE_EVENTS.REOPENED,
        metadata: expect.objectContaining({
          reason: "missing_manual_ot",
          previous_status: "archived",
          current_status: "processing",
        }),
      })
    );
  });
});
