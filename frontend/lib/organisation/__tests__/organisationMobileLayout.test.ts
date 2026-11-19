import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  organisationDesktopTableClass,
  organisationFiltersPanelClass,
  organisationMobileCardsClass,
  splitOrganisationTableColumns,
} from "../organisationMobileLayout.ts";

describe("organisationMobileLayout", () => {
  it("hides the desktop table below md", () => {
    assert.equal(organisationDesktopTableClass(), "hidden md:block");
  });

  it("shows mobile cards below md only", () => {
    assert.equal(organisationMobileCardsClass(), "space-y-3 md:hidden");
  });

  it("hides the filter panel on mobile until expanded", () => {
    assert.equal(organisationFiltersPanelClass(false), "hidden md:block");
  });

  it("shows the filter panel when expanded on mobile and always from md up", () => {
    assert.equal(organisationFiltersPanelClass(true), "mt-3 block md:mt-0");
  });

  it("splits primary, detail, and actions columns for mobile cards", () => {
    const columns = [
      { key: "name" },
      { key: "branch" },
      { key: "actions" },
      { key: "schedule" },
    ];
    const split = splitOrganisationTableColumns(columns);
    assert.equal(split.primary?.key, "name");
    assert.deepEqual(
      split.details.map((column) => column.key),
      ["branch", "schedule"]
    );
    assert.equal(split.actions?.key, "actions");
  });

  it("handles tables without an actions column", () => {
    const split = splitOrganisationTableColumns([{ key: "name" }, { key: "type" }]);
    assert.equal(split.primary?.key, "name");
    assert.deepEqual(
      split.details.map((column) => column.key),
      ["type"]
    );
    assert.equal(split.actions, undefined);
  });
});
