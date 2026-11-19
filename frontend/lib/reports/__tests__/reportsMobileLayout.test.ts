import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  filterLeaveReportMobileDetailColumns,
  reportsDesktopTableClass,
  reportsExportActionClass,
  reportsExportActionsRowClass,
  reportsFiltersPanelClass,
  reportsMobileCardsClass,
  splitReportsTableColumns,
} from "../reportsMobileLayout.ts";

describe("reportsMobileLayout", () => {
  it("hides the desktop table below md", () => {
    assert.equal(reportsDesktopTableClass(), "hidden md:block");
  });

  it("shows mobile cards below md only", () => {
    assert.equal(reportsMobileCardsClass(), "space-y-3 md:hidden");
  });

  it("hides the filter panel on mobile until expanded", () => {
    assert.equal(reportsFiltersPanelClass(false), "hidden md:block");
  });

  it("shows the filter panel when expanded on mobile and always from md up", () => {
    assert.equal(reportsFiltersPanelClass(true), "mt-3 block md:mt-0");
  });

  it("splits primary and detail columns for mobile cards", () => {
    const columns = [{ key: "employee" }, { key: "status" }, { key: "days" }];
    const split = splitReportsTableColumns(columns);
    assert.equal(split.primary?.key, "employee");
    assert.deepEqual(
      split.details.map((column) => column.key),
      ["status", "days"]
    );
  });

  it("filters dense leave-report fields from mobile detail cards", () => {
    const filtered = filterLeaveReportMobileDetailColumns([
      { key: "type" },
      { key: "source" },
      { key: "status" },
      { key: "reviewed_at" },
      { key: "reviewed_by" },
    ]);
    assert.deepEqual(
      filtered.map((column) => column.key),
      ["type", "status", "reviewed_by"]
    );
  });

  it("stacks export actions full-width on mobile", () => {
    assert.equal(reportsExportActionsRowClass(), "flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap");
    assert.equal(reportsExportActionClass(), "w-full sm:w-auto");
  });
});
