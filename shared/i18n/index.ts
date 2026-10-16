export {
  DEFAULT_LOCALE,
  LOCALE_META,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  documentLocaleAttributes,
  getLocaleMeta,
  getTextDirection,
  isLocale,
  parseAccountLanguage,
  parseStoredPreference,
  resolveActiveLocale,
  resolveAuthenticatedLocale,
  resolveLaunchLocale,
  resolveLocale,
} from "./locales";
export {
  LOCALE_ACCOUNT_CACHE_KEY,
  LOCALE_GUEST_STORAGE_KEY,
  applyAccountChoice,
  applyAccountSession,
  applyGuestChoice,
  beginAccountLocale,
  endAccountLocale,
  preferenceForAccount,
  readSharedLocaleCache,
  releaseAccountSession,
  rememberAccountLocale,
  rememberGuestLocale,
  writeSharedLocaleCache,
} from "./localeSession";
export type { LocaleClient, SharedLocaleCache, SharedLocaleStorage } from "./localeSession";
export type { Locale, LocaleMeta, LocalePreference, TextDirection } from "./locales";

export { catalogs, en } from "./catalog";
export type { EnglishCatalog } from "./catalog";

export { getActiveLocale, hasEnglishKey, setActiveLocale, translate, translateLabel } from "./translate";
export type { TranslateOptions, TranslateValues } from "./translate";

export { formatCompactDuration, formatCurrency, formatDate, formatNumber, formatTime } from "./format";
export { payrollHealthWarnings, presentPayrollReadiness, presentPayrollTimelineEvent, presentTimelineModule } from "./payrollCopy";
export { presentStructuredAuditAction } from "./auditCopy";
export type { PayrollWarningCounts } from "./payrollCopy";

export {
  clearLocalePreference,
  createMemoryLocaleStorage,
  loadLocalePreference,
  readPreferenceValue,
  saveLocalePreference,
} from "./preference";
export type { LocalePreferenceStorage } from "./preference";
