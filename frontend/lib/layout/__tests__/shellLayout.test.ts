import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SHELL_DESKTOP_MIN_PX,
  SHELL_MOBILE_BACKDROP_Z,
  SHELL_MOBILE_DRAWER_Z,
  SHELL_MOBILE_HEADER_Z,
  SHELL_SIDEBAR_COLLAPSED,
  SHELL_SIDEBAR_EXPANDED,
  isMobileDrawerAboveBackdrop,
  isShellDesktopWidth,
  reduceMobileNav,
  shellContentInset,
  shellDesktopRailWidth,
} from "../shellLayout.ts";

describe("shellLayout desktop breakpoint", () => {
  it("treats 1024px and above as desktop", () => {
    assert.equal(isShellDesktopWidth(SHELL_DESKTOP_MIN_PX), true);
    assert.equal(isShellDesktopWidth(1440), true);
    assert.equal(isShellDesktopWidth(1023), false);
    assert.equal(isShellDesktopWidth(360), false);
  });

  it("keeps desktop content inset tied to collapse preference", () => {
    assert.equal(shellContentInset(1024, false), SHELL_SIDEBAR_EXPANDED);
    assert.equal(shellContentInset(1440, true), SHELL_SIDEBAR_COLLAPSED);
    assert.equal(shellDesktopRailWidth(false), SHELL_SIDEBAR_EXPANDED);
    assert.equal(shellDesktopRailWidth(true), SHELL_SIDEBAR_COLLAPSED);
  });

  it("zeros content inset below the desktop breakpoint regardless of collapse", () => {
    assert.equal(shellContentInset(1023, false), "0px");
    assert.equal(shellContentInset(768, true), "0px");
    assert.equal(shellContentInset(360, false), "0px");
  });
});

describe("reduceMobileNav", () => {
  it("starts closed and opens on demand", () => {
    assert.deepEqual(reduceMobileNav({ open: false }, { type: "open" }), { open: true });
    assert.deepEqual(reduceMobileNav({ open: false }, { type: "toggle" }), { open: true });
  });

  it("closes via backdrop/escape equivalent, route change, and desktop viewport", () => {
    assert.deepEqual(reduceMobileNav({ open: true }, { type: "close" }), { open: false });
    assert.deepEqual(reduceMobileNav({ open: true }, { type: "routeChange" }), { open: false });
    assert.deepEqual(reduceMobileNav({ open: true }, { type: "viewportDesktop" }), { open: false });
  });

  it("toggle closes an open drawer without implying desktop collapse changes", () => {
    assert.deepEqual(reduceMobileNav({ open: true }, { type: "toggle" }), { open: false });
  });
});

describe("mobile nav stacking", () => {
  it("keeps the open drawer above the backdrop so nav links remain clickable", () => {
    assert.equal(SHELL_MOBILE_DRAWER_Z > SHELL_MOBILE_BACKDROP_Z, true);
    assert.equal(SHELL_MOBILE_HEADER_Z > SHELL_MOBILE_DRAWER_Z, true);
    assert.equal(isMobileDrawerAboveBackdrop(), true);
    assert.equal(isMobileDrawerAboveBackdrop(30, 40), false);
  });
});
