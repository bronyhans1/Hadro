import { supabaseAdmin } from "../../../config/supabase";
import * as repo from "../timeline.repository";

jest.mock("../../../config/supabase", () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

describe("timeline.repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("insertEvent writes append-only row", async () => {
    const insert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: {
            id: "e1",
            company_id: "c1",
            module: "payroll",
            entity_type: "payroll_period",
            entity_id: "p1",
            event_type: "payroll_period.created",
            title: "Payroll Period Created",
            description: "June 2026 payroll period was created.",
            performed_by: "u1",
            performed_by_name: "Jane",
            occurred_at: "2026-06-01T10:00:00.000Z",
            metadata: { year: 2026, month: 6 },
            created_at: "2026-06-01T10:00:00.000Z",
            updated_at: "2026-06-01T10:00:00.000Z",
          },
          error: null,
        }),
      }),
    });
    jest.mocked(supabaseAdmin.from).mockReturnValue({ insert } as never);

    const row = await repo.insertEvent({
      companyId: "c1",
      module: "payroll",
      entityType: "payroll_period",
      entityId: "p1",
      eventType: "payroll_period.created",
      title: "Payroll Period Created",
      description: "June 2026 payroll period was created.",
      performedBy: "u1",
      performedByName: "Jane",
      metadata: { year: 2026, month: 6 },
    });

    expect(supabaseAdmin.from).toHaveBeenCalledWith("timeline_events");
    expect(row.event_type).toBe("payroll_period.created");
  });

  it("listByCompany scopes to company and orders newest first", async () => {
    const range = jest.fn().mockResolvedValue({
      data: [{ id: "e2", occurred_at: "2026-06-02T10:00:00.000Z" }],
      error: null,
      count: 1,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chain: any = { range };
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.order = jest.fn().mockReturnValue(chain);
    const select = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue(chain) });
    jest.mocked(supabaseAdmin.from).mockReturnValue({ select } as never);

    const result = await repo.listByCompany("c1", {
      module: "payroll",
      entityType: "payroll_period",
      entityId: "p1",
      limit: 10,
      offset: 0,
    });

    expect(chain.order).toHaveBeenCalledWith("occurred_at", { ascending: false });
    expect(result.total).toBe(1);
  });
});
