import { supabaseAdmin } from "../../../config/supabase";
import * as repo from "../payrollPeriod.repository";

jest.mock("../../../config/supabase", () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

function wireSelectMaybeSingle(row: unknown | null, eqDepth = 3) {
  const maybeSingle = jest.fn().mockResolvedValue({ data: row, error: null });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = { maybeSingle };
  for (let i = 0; i < eqDepth; i++) {
    node = { eq: jest.fn().mockReturnValue(node) };
  }
  const select = jest.fn().mockReturnValue(node);
  jest.mocked(supabaseAdmin.from).mockReturnValue({ select } as unknown as ReturnType<
    typeof supabaseAdmin.from
  >);
  return { select, maybeSingle };
}

describe("payrollPeriod.repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("findByCompanyMonth returns row for company and month", async () => {
    const row = {
      id: "p1",
      company_id: "c1",
      payroll_year: 2026,
      payroll_month: 6,
      status: "draft",
    };
    wireSelectMaybeSingle(row, 3);

    const result = await repo.findByCompanyMonth("c1", 2026, 6);
    expect(result).toEqual(row);
    expect(supabaseAdmin.from).toHaveBeenCalledWith("payroll_periods");
  });

  test("findById scopes by company_id", async () => {
    const row = { id: "p1", company_id: "c1" };
    wireSelectMaybeSingle(row, 2);

    const result = await repo.findById("p1", "c1");
    expect(result).toEqual(row);
  });

  test("upsertDraft uses ON CONFLICT ignoreDuplicates then re-fetches row", async () => {
    const existing = {
      id: "p1",
      company_id: "c1",
      payroll_year: 2026,
      payroll_month: 6,
      status: "draft",
      business_timezone: "Africa/Accra",
      generated_at: "2026-06-01T00:00:00.000Z",
    };

    const upsert = jest.fn().mockResolvedValue({ error: null });
    jest.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
      if (table !== "payroll_periods") {
        throw new Error(`unexpected table ${table}`);
      }
      return {
        upsert,
        select: wireSelectMaybeSingle(existing, 3).select,
      } as unknown as ReturnType<typeof supabaseAdmin.from>;
    });

    const result = await repo.upsertDraft({
      company_id: "c1",
      payroll_year: 2026,
      payroll_month: 6,
      business_timezone: "Africa/Accra",
    });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        company_id: "c1",
        payroll_year: 2026,
        payroll_month: 6,
        status: "draft",
      }),
      {
        onConflict: "company_id,payroll_year,payroll_month",
        ignoreDuplicates: true,
      }
    );
    expect(result).toEqual(existing);
  });

  test("create inserts a draft period row", async () => {
    const created = {
      id: "p-new",
      company_id: "c1",
      payroll_year: 2026,
      payroll_month: 7,
      status: "draft",
    };
    const single = jest.fn().mockResolvedValue({ data: created, error: null });
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    jest.mocked(supabaseAdmin.from).mockReturnValue({ insert } as unknown as ReturnType<
      typeof supabaseAdmin.from
    >);

    const result = await repo.create({
      company_id: "c1",
      payroll_year: 2026,
      payroll_month: 7,
      business_timezone: "Africa/Accra",
    });

    expect(insert).toHaveBeenCalled();
    expect(result).toEqual(created);
  });
});
