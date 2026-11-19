import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  filterPayrollMobileDetailColumns,
  payrollDesktopTableClass,
  payrollFiltersPanelClass,
  payrollMobileCardsClass,
  splitPayrollTableColumns,
} from "../payrollMobileLayout.ts";

describe("payrollMobileLayout", () => {
  it("hides the desktop table below md", () => {
    assert.equal(payrollDesktopTableClass(), "hidden md:block");
  });

  it("shows mobile cards below md only", () => {
    assert.equal(payrollMobileCardsClass(), "space-y-3 md:hidden");
  });

  it("hides the filter panel on mobile until expanded", () => {
    assert.equal(payrollFiltersPanelClass(false), "hidden md:block");
  });

  it("shows the filter panel when expanded on mobile and always from md up", () => {
    assert.equal(payrollFiltersPanelClass(true), "mt-3 block md:mt-0");
  });

  it("splits primary, detail, and actions columns for mobile cards", () => {
    const columns = [
      { key: "employee" },
      { key: "hours" },
      { key: "actions" },
      { key: "status" },
    ];
    const split = splitPayrollTableColumns(columns);
    assert.equal(split.primary?.key, "employee");
    assert.deepEqual(
      split.details.map((column) => column.key),
      ["hours", "status"]
    );
    assert.equal(split.actions?.key, "actions");
  });

  it("treats payslip as an action column by default", () => {
    const split = splitPayrollTableColumns([
      { key: "record_type" },
      { key: "gross_earnings" },
      { key: "payslip" },
    ]);
    assert.equal(split.primary?.key, "record_type");
    assert.deepEqual(
      split.details.map((column) => column.key),
      ["gross_earnings"]
    );
    assert.equal(split.actions?.key, "payslip");
  });

  it("handles tables without an actions column", () => {
    const split = splitPayrollTableColumns([{ key: "date" }, { key: "amount" }]);
    assert.equal(split.primary?.key, "date");
    assert.deepEqual(
      split.details.map((column) => column.key),
      ["amount"]
    );
    assert.equal(split.actions, undefined);
  });

  it("filters dense minute and shadow columns from mobile detail cards", () => {
    const filtered = filterPayrollMobileDetailColumns([
      { key: "payroll_date" },
      { key: "regular_minutes" },
      { key: "shadow_duration_ot" },
      { key: "gross_earnings" },
      { key: "overtime_minutes" },
      { key: "status" },
    ]);
    assert.deepEqual(
      filtered.map((column) => column.key),
      ["payroll_date", "gross_earnings", "status"]
    );
  });
});
