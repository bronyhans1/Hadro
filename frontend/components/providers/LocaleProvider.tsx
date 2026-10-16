"use client";

import {
  Fragment,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  documentLocaleAttributes,
  loadLocalePreference,
  resolveActiveLocale,
  saveLocalePreference,
  setActiveLocale,
  translate,
  type Locale,
  type LocalePreference,
  type TextDirection,
  type TranslateOptions,
} from "@hadro/i18n";
import { browserLocaleStorage } from "@/lib/i18n/storage";

type LocaleContextValue = {
  locale: Locale;
  direction: TextDirection;
  preference: LocalePreference;
  t: (key: string, options?: Omit<TranslateOptions, "locale">) => string;
  setPreference: (preference: LocalePreference) => Promise<void>;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function systemLanguage(): string | null {
  if (typeof navigator === "undefined") return null;
  return navigator.language ?? null;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<LocalePreference>(DEFAULT_LOCALE);
  const [system, setSystem] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSystem(systemLanguage());
    void loadLocalePreference(browserLocaleStorage).then((stored) => {
      if (!cancelled && stored) setPreferenceState(stored);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const locale = resolveActiveLocale(preference, system);
  const direction = documentLocaleAttributes(locale).dir;
  setActiveLocale(locale);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const attributes = documentLocaleAttributes(locale);
    document.documentElement.lang = attributes.lang;
    document.documentElement.dir = attributes.dir;
  }, [locale]);

  const setPreference = useCallback(async (next: LocalePreference) => {
    setPreferenceState(next);
    await saveLocalePreference(browserLocaleStorage, next);
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      direction,
      preference,
      t: (key, options) => translate(key, { ...options, locale }),
      setPreference,
    }),
    [locale, direction, preference, setPreference]
  );

  // translate() reads the active locale at render time. Pages that call it do not
  // subscribe to this context, so a locale change must remount the tree or those
  // strings stay on the first render's language.
  return (
    <LocaleContext.Provider value={value}>
      <Fragment key={locale}>{children}</Fragment>
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) {
    return {
      locale: DEFAULT_LOCALE,
      direction: "ltr",
      preference: DEFAULT_LOCALE,
      t: (key, options) => translate(key, { ...options, locale: DEFAULT_LOCALE }),
      setPreference: async () => {},
    };
  }
  return value;
}
