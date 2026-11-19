/** Desktop shell breakpoint — matches Tailwind `lg` (1024px). */
export const SHELL_DESKTOP_MIN_PX = 1024;

export const SHELL_SIDEBAR_EXPANDED = "16rem";
export const SHELL_SIDEBAR_COLLAPSED = "4.5rem";

/**
 * Mobile stacking (must keep panel above backdrop or links are not clickable):
 * content < backdrop < open drawer < header < modal
 */
export const SHELL_MOBILE_BACKDROP_Z = 40;
export const SHELL_MOBILE_DRAWER_Z = 45;
export const SHELL_MOBILE_HEADER_Z = 50;

/** True when the open drawer would receive clicks above the backdrop. */
export function isMobileDrawerAboveBackdrop(
  drawerZ: number = SHELL_MOBILE_DRAWER_Z,
  backdropZ: number = SHELL_MOBILE_BACKDROP_Z
): boolean {
  return drawerZ > backdropZ;
}

export function isShellDesktopWidth(widthPx: number): boolean {
  return widthPx >= SHELL_DESKTOP_MIN_PX;
}

/** Layout inset for header/main. Mobile/tablet always 0; desktop follows collapse. */
export function shellContentInset(widthPx: number, collapsed: boolean): string {
  if (!isShellDesktopWidth(widthPx)) return "0px";
  return collapsed ? SHELL_SIDEBAR_COLLAPSED : SHELL_SIDEBAR_EXPANDED;
}

/** Desktop rail width (sidebar element). Unrelated to mobile drawer open state. */
export function shellDesktopRailWidth(collapsed: boolean): string {
  return collapsed ? SHELL_SIDEBAR_COLLAPSED : SHELL_SIDEBAR_EXPANDED;
}

export type MobileNavState = {
  open: boolean;
};

export type MobileNavAction =
  | { type: "open" }
  | { type: "close" }
  | { type: "toggle" }
  | { type: "routeChange" }
  | { type: "viewportDesktop" };

/**
 * Pure mobile-nav reducer. Desktop collapse preference is never touched here.
 * Crossing into desktop always forces closed so the UI cannot stick open.
 */
export function reduceMobileNav(state: MobileNavState, action: MobileNavAction): MobileNavState {
  switch (action.type) {
    case "open":
      return { open: true };
    case "close":
    case "routeChange":
    case "viewportDesktop":
      return { open: false };
    case "toggle":
      return { open: !state.open };
    default:
      return state;
  }
}
