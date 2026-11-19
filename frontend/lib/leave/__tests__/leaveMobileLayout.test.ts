import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  leaveDesktopTableClass,
  leaveFiltersPanelClass,
  leaveMobileCardsClass,
  splitLeaveTableColumns,
} from "../leaveMobileLayout.ts";

describe("leaveMobileLayout", () => {
  it("hides the desktop table below md", () => {
    assert.equal(leaveDesktopTableClass(), "hidden md:block");
  });

  it("shows mobile cards below md only", () => {
    assert.equal(leaveMobileCardsClass(), "space-y-3 md:hidden");
  });

  it("hides the filter panel on mobile until expanded", () => {
    assert.equal(leaveFiltersPanelClass(false), "hidden md:block");
  });

  it("shows the filter panel when expanded on mobile and always from md up", () => {
    assert.equal(leaveFiltersPanelClass(true), "mt-3 block md:mt-0");
  });

  it("splits primary, detail, and actions columns for mobile cards", () => {
    const columns = [
      { key: "employee" },
      { key: "status" },
      { key: "actions" },
      { key: "duration" },
    ];
    const split = splitLeaveTableColumns(columns);
    assert.equal(split.primary?.key, "employee");
    assert.deepEqual(
      split.details.map((column) => column.key),
      ["status", "duration"]
    );
    assert.equal(split.actions?.key, "actions");
  });

  it("handles tables without an actions column", () => {
    const split = splitLeaveTableColumns([{ key: "type" }, { key: "dates" }]);
    assert.equal(split.primary?.key, "type");
    assert.deepEqual(
      split.details.map((column) => column.key),
      ["dates"]
    );
    assert.equal(split.actions, undefined);
  });
});
