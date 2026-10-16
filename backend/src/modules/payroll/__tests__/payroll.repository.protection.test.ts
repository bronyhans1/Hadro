import { supabaseAdmin } from "../../../config/supabase";
import * as repo from "../payroll.repository";

jest.mock("../../../config/supabase", () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

function wireSelectChain(eqDepth: number, lookupRow: unknown | null) {
  const maybeSingle = jest.fn().mockResolvedValue({ data: lookupRow, error: null });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = { maybeSingle };
  for (let i = 0; i < eqDepth; i++) {
    node = { eq: jest.fn().mockReturnValue(node) };
  }
  return jest.fn().mockReturnValue(node);
}

function wireSelectMaybeSingle(row: unknown | null, eqDepth = 3) {
  const select = wireSelectChain(eqDepth, row);
  jest.mocked(supabaseAdmin.from).mockReturnValue({ select } as unknown as ReturnType<
    typeof supabaseAdmin.from
  >);
  return { select };
}

function wireUpsertReturning(row: unknown) {
  const single = jest.fn().mockResolvedValue({ data: row, error: null });
  const select = jest.fn(() => ({ single }));
  const upsert = jest.fn(() => ({ select }));
  jest.mocked(supabaseAdmin.from).mockReturnValue({ upsert } as unknown as ReturnType<
    typeof supabaseAdmin.from
  >);
  return { upsert };
}

describe("payroll.repository protection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("createPayrollRecord skips upsert when session row is approved", async () => {
    wireSelectMaybeSingle({ id: "p-approved", status: "approved", session_id: "s1" });
    const row = await repo.createPayrollRecord({
      user_id: "u1",
      company_id: "c1",
      session_id: "s1",
      regular_minutes: 480,
      overtime_minutes: 0,
      hours_worked: 8,
      hourly_rate: 20,
      gross_earnings: 160,
      payroll_date: "2026-03-01",
    });
    expect(row.id).toBe("p-approved");
    const fromRet = jest.mocked(supabaseAdmin.from).mock.results[0]?.value as { upsert?: jest.Mock };
    expect(fromRet?.upsert).toBeUndefined();
  });

  test("insertSalaryDailyRecord skips upsert when day row is locked", async () => {
    wireSelectMaybeSingle({ id: "sd-locked", status: "locked", earnings_date: "2026-03-02" }, 4);
    const row = await repo.insertSalaryDailyRecord({
      user_id: "u1",
      company_id: "c1",
      earnings_date: "2026-03-02",
      gross_earnings: 999,
      daily_rate: 100,
    });
    expect(row.id).toBe("sd-locked");
    const fromRet = jest.mocked(supabaseAdmin.from).mock.results[0]?.value as { upsert?: jest.Mock };
    expect(fromRet?.upsert).toBeUndefined();
  });

  test("createPayrollRecord upserts when no protected row exists", async () => {
    const selectLookup = wireSelectChain(3, null);
    const single = jest.fn().mockResolvedValue({ data: { id: "p-new", status: "draft" }, error: null });
    const selectUpsert = jest.fn(() => ({ single }));
    const upsert = jest.fn(() => ({ select: selectUpsert }));
    jest.mocked(supabaseAdmin.from).mockReturnValue({
      select: selectLookup,
      upsert,
    } as unknown as ReturnType<typeof supabaseAdmin.from>);

    await repo.createPayrollRecord({
      user_id: "u1",
      company_id: "c1",
      session_id: "s2",
      regular_minutes: 60,
      overtime_minutes: 0,
      hours_worked: 1,
      hourly_rate: 15,
      gross_earnings: 15,
      payroll_date: "2026-03-03",
    });
    expect(upsert).toHaveBeenCalledTimes(1);
  });
});
