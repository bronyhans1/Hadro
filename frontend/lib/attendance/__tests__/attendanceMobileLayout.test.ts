import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  attendanceDesktopTableClass,
  attendanceFiltersPanelClass,
  attendanceMobileCardsClass,
} from "../attendanceMobileLayout.ts";

describe("attendanceMobileLayout", () => {
  it("hides the desktop table below md", () => {
    assert.equal(attendanceDesktopTableClass(), "hidden md:block");
  });

  it("shows mobile cards below md only", () => {
    assert.equal(attendanceMobileCardsClass(), "space-y-3 md:hidden");
  });

  it("hides the filter panel on mobile until expanded", () => {
    assert.equal(attendanceFiltersPanelClass(false), "hidden md:block");
  });

  it("shows the filter panel when expanded on mobile and always from md up", () => {
    assert.equal(attendanceFiltersPanelClass(true), "mt-3 block md:mt-0");
  });
});
