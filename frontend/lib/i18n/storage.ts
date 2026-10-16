import { LOCALE_STORAGE_KEY, type LocalePreferenceStorage, type SharedLocaleStorage } from "@hadro/i18n";

/** Browser UI preference. Same pattern as theme preference — not an auth secret. */
export const browserLocaleStorage: LocalePreferenceStorage = {
  get() {
    try {
      return globalThis.localStorage?.getItem(LOCALE_STORAGE_KEY) ?? null;
    } catch {
      return null;
    }
  },
  set(value) {
    try {
      globalThis.localStorage?.setItem(LOCALE_STORAGE_KEY, value);
    } catch {
      /* private mode / quota */
    }
  },
  remove() {
    try {
      globalThis.localStorage?.removeItem(LOCALE_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  },
};

/** Guest locale plus the flag that marks an account-owned cache. Not a credential. */
export const browserLocaleSession: SharedLocaleStorage = {
  get(key) {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      /* private mode / quota */
    }
  },
  remove(key) {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};
