import { LOCALE_STORAGE_KEY, parseStoredPreference, type LocalePreference } from "./locales";

/**
 * Persistence is injected so web can use localStorage and mobile can avoid SecureStore.
 * UI language is not an authentication secret.
 */
export type LocalePreferenceStorage = {
  get(): string | null | Promise<string | null>;
  set(value: string): void | Promise<void>;
  remove(): void | Promise<void>;
};

export function readPreferenceValue(raw: string | null): LocalePreference | null {
  return parseStoredPreference(raw);
}

export async function loadLocalePreference(
  storage: LocalePreferenceStorage
): Promise<LocalePreference | null> {
  try {
    const raw = await storage.get();
    return readPreferenceValue(raw);
  } catch {
    return null;
  }
}

export async function saveLocalePreference(
  storage: LocalePreferenceStorage,
  preference: LocalePreference
): Promise<void> {
  await storage.set(preference);
}

export async function clearLocalePreference(storage: LocalePreferenceStorage): Promise<void> {
  await storage.remove();
}

export function createMemoryLocaleStorage(
  initial?: string | null
): LocalePreferenceStorage & { snapshot(): string | null } {
  let value = initial ?? null;
  return {
    get() {
      return value;
    },
    set(next) {
      value = next;
    },
    remove() {
      value = null;
    },
    snapshot() {
      return value;
    },
  };
}

export { LOCALE_STORAGE_KEY };
