import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  auditDesktopTableClass,
  auditFilterActionClass,
  auditFilterActionsRowClass,
  auditFiltersPanelClass,
  auditMobileCardsClass,
  filterPlatformAuditMobileDetailColumns,
  splitAuditTableColumns,
} from "../auditMobileLayout.ts";

describe("auditMobileLayout", () => {
  it("hides the desktop table below md", () => {
    assert.equal(auditDesktopTableClass(), "hidden md:block");
  });

  it("shows mobile cards below md only", () => {
    assert.equal(auditMobileCardsClass(), "space-y-3 md:hidden");
  });

  it("hides the filter panel on mobile until expanded", () => {
    assert.equal(auditFiltersPanelClass(false), "hidden md:block");
  });

  it("shows the filter panel when expanded on mobile and always from md up", () => {
    assert.equal(auditFiltersPanelClass(true), "mt-3 block md:mt-0");
  });

  it("prefers action as the mobile card primary column", () => {
    const columns = [
      { key: "created_at" },
      { key: "action" },
      { key: "actor_id" },
      { key: "entity_type" },
    ];
    const split = splitAuditTableColumns(columns);
    assert.equal(split.primary?.key, "action");
    assert.deepEqual(
      split.details.map((column) => column.key),
      ["created_at", "actor_id", "entity_type"]
    );
  });

  it("falls back to the first column when action is absent", () => {
    const columns = [{ key: "time" }, { key: "actor" }];
    const split = splitAuditTableColumns(columns);
    assert.equal(split.primary?.key, "time");
    assert.deepEqual(
      split.details.map((column) => column.key),
      ["actor"]
    );
  });

  it("filters dense status fields from platform mobile detail cards", () => {
    const filtered = filterPlatformAuditMobileDetailColumns([
      { key: "company" },
      { key: "status" },
      { key: "details" },
    ]);
    assert.deepEqual(
      filtered.map((column) => column.key),
      ["company", "details"]
    );
  });

  it("stacks filter actions full-width on mobile", () => {
    assert.equal(auditFilterActionsRowClass(), "flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center");
    assert.equal(auditFilterActionClass(), "w-full sm:w-auto");
  });
});
