import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  parseAccountLanguage,
  parseStoredPreference,
  type LocalePreference,
} from "./locales";

/** Guest choice preserved across sign-in. Not an account preference. */
export const LOCALE_GUEST_STORAGE_KEY = "hadro_locale_guest";

/**
 * Marks `hadro_locale` as written for a signed-in session.
 * The value is only "1". It does not store a user id.
 */
export const LOCALE_ACCOUNT_CACHE_KEY = "hadro_locale_account";

export type LocaleClient = "web" | "native";

export type SharedLocaleCache = {
  active: string | null;
  guest: LocalePreference | null;
  accountOwned: boolean;
};

export type SharedLocaleStorage = {
  get(key: string): string | null | Promise<string | null>;
  set(key: string, value: string): void | Promise<void>;
  remove(key: string): void | Promise<void>;
};

/** Explicit account language, or the no-preference fallback for that client. */
export function preferenceForAccount(params: {
  accountLanguage: unknown;
  client: LocaleClient;
}): LocalePreference {
  const account = parseAccountLanguage(params.accountLanguage);
  if (account) return account;
  return params.client === "native" ? "system" : DEFAULT_LOCALE;
}

export function applyAccountSession(
  cache: SharedLocaleCache,
  accountLanguage: unknown,
  client: LocaleClient
): { cache: SharedLocaleCache; preference: LocalePreference } {
  const preference = preferenceForAccount({ accountLanguage, client });
  return {
    preference,
    cache: {
      guest: cache.guest,
      accountOwned: true,
      active: preference,
    },
  };
}

/** Drop an account-owned locale and return the guest choice, if there was one. */
export function releaseAccountSession(cache: SharedLocaleCache): {
  cache: SharedLocaleCache;
  preference: LocalePreference | null;
} {
  return {
    preference: cache.guest,
    cache: {
      guest: cache.guest,
      accountOwned: false,
      active: cache.guest,
    },
  };
}

export function applyGuestChoice(
  cache: SharedLocaleCache,
  preference: LocalePreference
): SharedLocaleCache {
  return {
    guest: preference,
    accountOwned: false,
    active: preference,
  };
}

export function applyAccountChoice(
  cache: SharedLocaleCache,
  preference: LocalePreference
): SharedLocaleCache {
  return {
    guest: cache.guest,
    accountOwned: true,
    active: preference,
  };
}

async function readRaw(storage: SharedLocaleStorage, key: string): Promise<string | null> {
  try {
    const value = await storage.get(key);
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  } catch {
    return null;
  }
}

export async function readSharedLocaleCache(storage: SharedLocaleStorage): Promise<SharedLocaleCache> {
  const [active, guest, owned] = await Promise.all([
    readRaw(storage, LOCALE_STORAGE_KEY),
    readRaw(storage, LOCALE_GUEST_STORAGE_KEY),
    readRaw(storage, LOCALE_ACCOUNT_CACHE_KEY),
  ]);
  return {
    active,
    guest: parseStoredPreference(guest),
    accountOwned: owned === "1",
  };
}

export async function writeSharedLocaleCache(
  storage: SharedLocaleStorage,
  cache: SharedLocaleCache
): Promise<void> {
  if (cache.active) await storage.set(LOCALE_STORAGE_KEY, cache.active);
  else await storage.remove(LOCALE_STORAGE_KEY);
  if (cache.guest) await storage.set(LOCALE_GUEST_STORAGE_KEY, cache.guest);
  else await storage.remove(LOCALE_GUEST_STORAGE_KEY);
  if (cache.accountOwned) await storage.set(LOCALE_ACCOUNT_CACHE_KEY, "1");
  else await storage.remove(LOCALE_ACCOUNT_CACHE_KEY);
}

export async function beginAccountLocale(
  storage: SharedLocaleStorage,
  accountLanguage: unknown,
  client: LocaleClient
): Promise<LocalePreference> {
  const cache = await readSharedLocaleCache(storage);
  const next = applyAccountSession(cache, accountLanguage, client);
  await writeSharedLocaleCache(storage, next.cache);
  return next.preference;
}

export async function endAccountLocale(storage: SharedLocaleStorage): Promise<LocalePreference | null> {
  const cache = await readSharedLocaleCache(storage);
  if (!cache.accountOwned) return parseStoredPreference(cache.active);
  const next = releaseAccountSession(cache);
  await writeSharedLocaleCache(storage, next.cache);
  return next.preference;
}

export async function rememberGuestLocale(
  storage: SharedLocaleStorage,
  preference: LocalePreference
): Promise<void> {
  const cache = await readSharedLocaleCache(storage);
  await writeSharedLocaleCache(storage, applyGuestChoice(cache, preference));
}

export async function rememberAccountLocale(
  storage: SharedLocaleStorage,
  preference: LocalePreference
): Promise<void> {
  const cache = await readSharedLocaleCache(storage);
  await writeSharedLocaleCache(storage, applyAccountChoice(cache, preference));
}
