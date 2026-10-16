import {
  classifyLeavePayrollCompensation,
  isPaidLeaveForPayroll,
  isUnpaidLeaveForPayroll,
} from "../leavePayrollClassification";

describe("leavePayrollClassification", () => {
  test("approved annual leave with explicit paid compensation", () => {
    expect(
      classifyLeavePayrollCompensation({
        leave_type: "annual",
        leave_compensation_type: "paid",
      })
    ).toBe("paid");
    expect(isPaidLeaveForPayroll({ leave_type: "annual", leave_compensation_type: "paid" })).toBe(
      true
    );
  });

  test("approved unpaid leave type and explicit unpaid compensation", () => {
    expect(
      classifyLeavePayrollCompensation({
        leave_type: "unpaid",
        leave_compensation_type: null,
      })
    ).toBe("unpaid");
    expect(
      classifyLeavePayrollCompensation({
        leave_type: "annual",
        leave_compensation_type: "unpaid",
      })
    ).toBe("unpaid");
    expect(isUnpaidLeaveForPayroll({ leave_type: "annual", leave_compensation_type: "unpaid" })).toBe(
      true
    );
  });

  test("sick defaults to paid when compensation omitted", () => {
    expect(
      classifyLeavePayrollCompensation({
        leave_type: "sick",
        leave_compensation_type: null,
      })
    ).toBe("paid");
  });
});
