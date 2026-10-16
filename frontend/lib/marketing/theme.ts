import { translate } from "@/lib/i18n";
export const MARKETING_THEME_STORAGE_KEY = "hadro_theme_pref";

export type MarketingThemePreference = "light" | "dark" | "system";

export function readMarketingThemePreference(): MarketingThemePreference {
  if (typeof window === "undefined") return "system";
  const raw = localStorage.getItem(MARKETING_THEME_STORAGE_KEY);
  return raw === "light" || raw === "dark" || raw === "system" ? raw : "system";
}

export function resolveMarketingDark(pref: MarketingThemePreference): boolean {
  if (typeof window === "undefined") return false;
  if (pref === "dark") return true;
  if (pref === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyMarketingTheme(pref: MarketingThemePreference) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const dark = resolveMarketingDark(pref);
  root.classList.toggle("dark", dark);
  root.dataset.mktTheme = pref;
}

export function persistMarketingTheme(pref: MarketingThemePreference) {
  localStorage.setItem(MARKETING_THEME_STORAGE_KEY, pref);
  applyMarketingTheme(pref);
}

/** Cycle: system → light → dark → system (always advances preference in one click). */
export function nextMarketingTheme(pref: MarketingThemePreference): MarketingThemePreference {
  if (pref === "system") return "light";
  if (pref === "light") return "dark";
  return "system";
}

export function marketingThemeLabel(pref: MarketingThemePreference): string {
  if (pref === "light") return translate("settings.light");
  if (pref === "dark") return translate("settings.dark");
  return translate("settings.system");
}
