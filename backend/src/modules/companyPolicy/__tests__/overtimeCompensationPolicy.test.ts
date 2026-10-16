import * as repo from "../companyPolicy.repository";
import { updatePolicy } from "../companyPolicy.service";

jest.mock("../companyPolicy.repository");

describe("companyPolicy overtime compensation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(repo.getPolicyByCompany).mockResolvedValue({
      id: "p1",
      company_id: "c1",
      default_daily_hours: 8,
      overtime_multiplier: 1.5,
      overtime_compensation_method: "multiplier",
      fixed_overtime_hourly_rate: null,
      lateness_tracking_enabled: true,
      late_pay_deduction_enabled: false,
      payroll_enabled: true,
      business_timezone: "UTC",
      attendance_day_classification_enabled: false,
      minimum_minutes_for_counted_day: 60,
      full_day_minutes_threshold: 480,
      currency_code: "GHS",
      working_weekdays: [1, 2, 3, 4, 5],
      created_at: "",
      updated_at: "",
    } as never);
    jest.mocked(repo.updatePolicy).mockImplementation(async (_cid, data) => ({
      id: "p1",
      company_id: "c1",
      default_daily_hours: 8,
      overtime_multiplier: data.overtime_multiplier ?? 1.5,
      overtime_compensation_method:
        data.overtime_compensation_method ?? "multiplier",
      fixed_overtime_hourly_rate: data.fixed_overtime_hourly_rate ?? null,
      lateness_tracking_enabled: true,
      late_pay_deduction_enabled: false,
      payroll_enabled: true,
      business_timezone: "UTC",
      attendance_day_classification_enabled: false,
      minimum_minutes_for_counted_day: 60,
      full_day_minutes_threshold: 480,
      currency_code: "GHS",
      working_weekdays: [1, 2, 3, 4, 5],
      created_at: "",
      updated_at: "",
    }) as never);
  });

  test("rejects fixed_rate without positive fixed_overtime_hourly_rate", async () => {
    const result = await updatePolicy("c1", {
      overtime_compensation_method: "fixed_rate",
    });
    expect(result.error).toMatch(/fixed_overtime_hourly_rate/i);
    expect(repo.updatePolicy).not.toHaveBeenCalled();
  });

  test("allows switching to fixed_rate with valid rate", async () => {
    const result = await updatePolicy("c1", {
      overtime_compensation_method: "fixed_rate",
      fixed_overtime_hourly_rate: 20,
    });
    expect(result.error).toBeUndefined();
    expect(result.data?.overtime_compensation_method).toBe("fixed_rate");
    expect(repo.updatePolicy).toHaveBeenCalledWith(
      "c1",
      expect.objectContaining({
        overtime_compensation_method: "fixed_rate",
        fixed_overtime_hourly_rate: 20,
      })
    );
  });

  test("multiplier mode unchanged when not switching", async () => {
    const result = await updatePolicy("c1", { overtime_multiplier: 2 });
    expect(result.error).toBeUndefined();
    expect(repo.updatePolicy).toHaveBeenCalledWith(
      "c1",
      expect.objectContaining({ overtime_multiplier: 2 })
    );
  });
});
