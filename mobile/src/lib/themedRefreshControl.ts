import type { ThemePalette } from "@/store/theme";

/** Theme-aware RefreshControl colors (iOS tintColor + Android colors). */
export function themedRefreshControlProps(colors: ThemePalette) {
  return {
    tintColor: colors.primary,
    colors: [colors.primary] as [string, ...string[]],
  };
}
