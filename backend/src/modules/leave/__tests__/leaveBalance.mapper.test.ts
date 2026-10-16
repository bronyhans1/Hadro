import { toLeaveBalanceApi } from "../leaveBalance.mapper";

describe("toLeaveBalanceApi", () => {
  it("maps sick balance without throwing", () => {
    const api = toLeaveBalanceApi({
      id: "b1",
      user_id: "u1",
      company_id: "c1",
      leave_type: "sick",
      total_days: 10,
      used_days: 2,
      updated_at: new Date().toISOString(),
    });
    expect(api.leave_type).toBe("sick");
    expect(api.leave_compensation_type).toBe("paid");
    expect(api.remaining_days).toBe(8);
  });

  it("prefers company compensation policy when provided", () => {
    const api = toLeaveBalanceApi(
      {
        id: "b1",
        user_id: "u1",
        company_id: "c1",
        leave_type: "emergency",
        total_days: 5,
        used_days: 0,
        updated_at: new Date().toISOString(),
      },
      new Map([["emergency", "unpaid"]])
    );
    expect(api.leave_compensation_type).toBe("unpaid");
  });
});
