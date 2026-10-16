import * as timelineRepo from "../timeline.repository";
import {
  listEvents,
  normalizeListOptions,
  recordEvent,
  TimelineValidationError,
} from "../timeline.service";

jest.mock("../timeline.repository");

describe("timeline.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("recordEvent validates required fields", async () => {
    await expect(
      recordEvent({
        companyId: "",
        module: "payroll",
        entityType: "payroll_period",
        entityId: "p1",
        eventType: "payroll_period.created",
        title: "Payroll Period Created",
        description: "desc",
      })
    ).rejects.toThrow(TimelineValidationError);
  });

  it("recordEvent delegates to repository", async () => {
    jest.mocked(timelineRepo.insertEvent).mockResolvedValue({
      id: "e1",
      company_id: "c1",
      module: "payroll",
      entity_type: "payroll_period",
      entity_id: "p1",
      event_type: "payroll_period.created",
      title: "Payroll Period Created",
      description: "desc",
      performed_by: "u1",
      performed_by_name: "Jane",
      occurred_at: "2026-06-01T10:00:00.000Z",
      metadata: {},
      created_at: "2026-06-01T10:00:00.000Z",
      updated_at: "2026-06-01T10:00:00.000Z",
    });

    const row = await recordEvent({
      companyId: "c1",
      module: "payroll",
      entityType: "payroll_period",
      entityId: "p1",
      eventType: "payroll_period.created",
      title: "Payroll Period Created",
      description: "desc",
      performedBy: "u1",
      performedByName: "Jane",
    });

    expect(timelineRepo.insertEvent).toHaveBeenCalled();
    expect(row.id).toBe("e1");
  });

  it("normalizeListOptions parses filters and caps limit", () => {
    const options = normalizeListOptions({
      module: "payroll",
      entity_type: "payroll_period",
      entity_id: "p1",
      limit: "999",
    });
    expect(options.module).toBe("payroll");
    expect(options.entityType).toBe("payroll_period");
    expect(options.entityId).toBe("p1");
    expect(options.limit).toBe(200);
  });

  it("listEvents scopes by company id", async () => {
    jest.mocked(timelineRepo.listByCompany).mockResolvedValue({ events: [], total: 0 });
    await listEvents("c1", { module: "payroll" });
    expect(timelineRepo.listByCompany).toHaveBeenCalledWith("c1", { module: "payroll" });
  });
});
