/**
 * HADRO locale registry.
 * Language is a user preference. It is not derived from country.
 * HADRO, HADRO Technologies, and HADRO Technologies Ltd. are brand terms and are not translated.
 */

export const SUPPORTED_LOCALES = ["en", "fr", "pt", "ar", "sw", "es"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export type TextDirection = "ltr" | "rtl";

/** Explicit choice, or follow the device/browser language when that language is supported. */
export type LocalePreference = Locale | "system";

export type LocaleMeta = {
  code: Locale;
  /** English name, for settings UI. */
  displayName: string;
  /** Name in the language itself. */
  nativeName: string;
  direction: TextDirection;
  /** Locale used when a key is missing. English remains the source catalog. */
  fallback: "en";
};

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_STORAGE_KEY = "hadro_locale";

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  en: { code: "en", displayName: "English", nativeName: "English", direction: "ltr", fallback: "en" },
  fr: { code: "fr", displayName: "French", nativeName: "Français", direction: "ltr", fallback: "en" },
  pt: { code: "pt", displayName: "Portuguese", nativeName: "Português", direction: "ltr", fallback: "en" },
  ar: { code: "ar", displayName: "Arabic", nativeName: "العربية", direction: "rtl", fallback: "en" },
  sw: { code: "sw", displayName: "Kiswahili", nativeName: "Kiswahili", direction: "ltr", fallback: "en" },
  es: { code: "es", displayName: "Spanish", nativeName: "Español", direction: "ltr", fallback: "en" },
};

const LOCALE_SET = new Set<string>(SUPPORTED_LOCALES);

export function isLocale(value: string | null | undefined): value is Locale {
  return typeof value === "string" && LOCALE_SET.has(value.toLowerCase());
}

/**
 * Map a BCP-47 tag or bare code onto a supported locale.
 * Unsupported tags fall back to English. Country is ignored (`fr-SN` → `fr`).
 */
export function resolveLocale(input: string | null | undefined): Locale {
  if (!input) return DEFAULT_LOCALE;
  const trimmed = input.trim().toLowerCase().replace(/_/g, "-");
  if (!trimmed) return DEFAULT_LOCALE;
  if (isLocale(trimmed)) return trimmed;
  const primary = trimmed.split("-")[0];
  if (isLocale(primary)) return primary;
  return DEFAULT_LOCALE;
}

export function getLocaleMeta(locale: Locale): LocaleMeta {
  return LOCALE_META[locale];
}

export function getTextDirection(locale: Locale): TextDirection {
  return LOCALE_META[locale].direction;
}

/** Values written to `<html lang>` and `<html dir>`. Language id is the lang value. */
export function documentLocaleAttributes(locale: Locale): { lang: Locale; dir: TextDirection } {
  return { lang: locale, dir: getTextDirection(locale) };
}

export function parseStoredPreference(raw: string | null | undefined): LocalePreference | null {
  if (raw == null) return null;
  const value = raw.trim().toLowerCase();
  if (!value) return null;
  if (value === "system") return "system";
  if (isLocale(value)) return value;
  return null;
}

/**
 * No stored preference → English (current product default).
 * "system" uses the device language only when it is one of the supported locales.
 */
export function resolveActiveLocale(
  preference: LocalePreference | null | undefined,
  systemLanguage?: string | null
): Locale {
  if (!preference) return DEFAULT_LOCALE;
  if (preference === "system") return resolveLocale(systemLanguage);
  return resolveLocale(preference);
}

/**
 * Mobile launch resolution. An explicit saved locale always wins.
 * No saved preference follows the device language, or English when that
 * language is missing, unsupported, or the read fails.
 */
export function resolveLaunchLocale(
  stored: LocalePreference | null | undefined,
  deviceLanguage?: string | null
): Locale {
  if (stored && stored !== "system") return resolveLocale(stored);
  return resolveLocale(deviceLanguage);
}

/** Explicit account language. Display names and unknown codes are not a preference. */
export function parseAccountLanguage(value: unknown): Locale | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toLowerCase();
  return isLocale(code) ? code : null;
}

/**
 * Authenticated resolution. An explicit account locale wins.
 * A missing account preference does not read the shared device cache: that
 * cache may belong to another signed-in user. Web falls back to English.
 * Mobile follows the device language.
 */
export function resolveAuthenticatedLocale(params: {
  accountLanguage?: unknown;
  localPreference?: LocalePreference | null;
  deviceLanguage?: string | null;
  client: "web" | "native";
}): Locale {
  const account = parseAccountLanguage(params.accountLanguage);
  if (account) return account;
  // A shared hadro_locale value is not this account's preference.
  void params.localPreference;
  if (params.client === "native") {
    return resolveLaunchLocale(null, params.deviceLanguage);
  }
  return resolveActiveLocale(null, params.deviceLanguage);
}
