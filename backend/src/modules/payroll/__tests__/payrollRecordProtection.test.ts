import {
  isPayrollRecordDraft,
  isPayrollRecordProtected,
} from "../payrollRecordProtection";

describe("payrollRecordProtection", () => {
  test("draft is not protected", () => {
    expect(isPayrollRecordProtected("draft")).toBe(false);
    expect(isPayrollRecordDraft("draft")).toBe(true);
    expect(isPayrollRecordProtected(undefined)).toBe(false);
  });

  test("approved and locked are protected", () => {
    expect(isPayrollRecordProtected("approved")).toBe(true);
    expect(isPayrollRecordProtected("locked")).toBe(true);
    expect(isPayrollRecordProtected("APPROVED")).toBe(true);
    expect(isPayrollRecordDraft("locked")).toBe(false);
  });
});
