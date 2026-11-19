import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { employeeFiltersPanelClass } from "../employeesMobileLayout.ts";

describe("employeeFiltersPanelClass", () => {
  it("hides the filter panel on mobile until expanded", () => {
    assert.equal(employeeFiltersPanelClass(false), "hidden md:block");
  });

  it("shows the filter panel when expanded on mobile and always from md up", () => {
    assert.equal(employeeFiltersPanelClass(true), "mt-3 block md:mt-0");
  });
});
