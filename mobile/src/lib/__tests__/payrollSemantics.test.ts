import {
  displayHoursWorked,
  displayRegularMinutes,
  earningsHistoryTypeLabel,
} from "../payroll/payrollSemantics";

describe("payrollSemantics (mobile parity)", () => {
  it("labels salary_daily as Monthly Day Credit", () => {
    expect(earningsHistoryTypeLabel("salary_daily")).toBe("Monthly Day Credit");
  });

  it("labels paid leave history as Paid Leave", () => {
    expect(earningsHistoryTypeLabel("leave_hourly")).toBe("Paid Leave");
    expect(
      earningsHistoryTypeLabel("salary_daily", {
        earning_source: "paid_leave",
        payroll_day_classification: "PAID_LEAVE",
      })
    ).toBe("Paid Leave");
  });

  it("shows N/A for salary hour fields not zero", () => {
    const row = { record_type: "salary_daily", hours_worked: 0, regular_minutes: 0 };
    expect(displayHoursWorked(row)).toBe("N/A (salary-based)");
    expect(displayRegularMinutes(row)).toBe("N/A (salary-based)");
  });
});
