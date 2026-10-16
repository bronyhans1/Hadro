import {
  LOCALE_ACCOUNT_CACHE_KEY,
  LOCALE_GUEST_STORAGE_KEY,
  LOCALE_STORAGE_KEY,
  applyAccountSession,
  applyGuestChoice,
  beginAccountLocale,
  endAccountLocale,
  getTextDirection,
  parseAccountLanguage,
  readSharedLocaleCache,
  releaseAccountSession,
  rememberGuestLocale,
  resolveActiveLocale,
  resolveAuthenticatedLocale,
  resolveLaunchLocale,
  type SharedLocaleCache,
  type SharedLocaleStorage,
} from "../../../../shared/i18n";

describe("account language preference", () => {
  it("accepts only supported locale codes", () => {
    expect(parseAccountLanguage("en")).toBe("en");
    expect(parseAccountLanguage("fr")).toBe("fr");
    expect(parseAccountLanguage("pt")).toBe("pt");
    expect(parseAccountLanguage("ar")).toBe("ar");
    expect(parseAccountLanguage("sw")).toBe("sw");
    expect(parseAccountLanguage("es")).toBe("es");
    expect(parseAccountLanguage(" FR ")).toBe("fr");
  });

  it("rejects display names and unsupported codes", () => {
    expect(parseAccountLanguage("English")).toBeNull();
    expect(parseAccountLanguage("Français")).toBeNull();
    expect(parseAccountLanguage("de")).toBeNull();
    expect(parseAccountLanguage("")).toBeNull();
    expect(parseAccountLanguage(null)).toBeNull();
    expect(parseAccountLanguage(undefined)).toBeNull();
  });

  it("uses an explicit account preference over the browser and a local cache", () => {
    expect(
      resolveAuthenticatedLocale({
        accountLanguage: "fr",
        localPreference: "en",
        deviceLanguage: "en-US",
        client: "web",
      })
    ).toBe("fr");
  });

  it("uses an explicit account preference over the device language", () => {
    expect(
      resolveAuthenticatedLocale({
        accountLanguage: "es",
        localPreference: null,
        deviceLanguage: "en-US",
        client: "native",
      })
    ).toBe("es");
  });

  it("keeps web English when the account has no preference", () => {
    expect(
      resolveAuthenticatedLocale({
        accountLanguage: null,
        localPreference: null,
        deviceLanguage: "fr-FR",
        client: "web",
      })
    ).toBe("en");
  });

  it("keeps mobile device detection when the account has no preference", () => {
    expect(
      resolveAuthenticatedLocale({
        accountLanguage: null,
        localPreference: null,
        deviceLanguage: "pt-BR",
        client: "native",
      })
    ).toBe("pt");
    expect(
      resolveAuthenticatedLocale({
        accountLanguage: null,
        localPreference: null,
        deviceLanguage: "de-DE",
        client: "native",
      })
    ).toBe("en");
  });

  it("ignores a shared local cache when the account has no preference", () => {
    expect(
      resolveAuthenticatedLocale({
        accountLanguage: null,
        localPreference: "fr",
        deviceLanguage: "en-US",
        client: "web",
      })
    ).toBe("en");
    expect(
      resolveAuthenticatedLocale({
        accountLanguage: null,
        localPreference: "sw",
        deviceLanguage: "en-US",
        client: "native",
      })
    ).toBe("en");
    expect(
      resolveAuthenticatedLocale({
        accountLanguage: null,
        localPreference: "fr",
        deviceLanguage: "pt-BR",
        client: "native",
      })
    ).toBe("pt");
  });

  it("isolates preferences between users", () => {
    const userA = resolveAuthenticatedLocale({
      accountLanguage: "fr",
      deviceLanguage: "en-US",
      client: "web",
    });
    const userB = resolveAuthenticatedLocale({
      accountLanguage: "en",
      deviceLanguage: "fr-FR",
      client: "web",
    });
    expect(userA).toBe("fr");
    expect(userB).toBe("en");
  });

  it("still treats Arabic as right to left and falls back to English", () => {
    expect(
      resolveAuthenticatedLocale({
        accountLanguage: "ar",
        deviceLanguage: "en-US",
        client: "web",
      })
    ).toBe("ar");
    expect(getTextDirection("ar")).toBe("rtl");
    expect(
      resolveAuthenticatedLocale({
        accountLanguage: "de",
        localPreference: null,
        deviceLanguage: null,
        client: "web",
      })
    ).toBe("en");
  });
});

const emptyCache = (): SharedLocaleCache => ({
  active: null,
  guest: null,
  accountOwned: false,
});

function memoryLocaleSession(): SharedLocaleStorage {
  const values = new Map<string, string>();
  return {
    get(key) {
      return values.get(key) ?? null;
    },
    set(key, value) {
      values.set(key, value);
    },
    remove(key) {
      values.delete(key);
    },
  };
}

describe("shared browser account language isolation", () => {
  it("does not give User B another user's French cache", async () => {
    const storage = memoryLocaleSession();
    await beginAccountLocale(storage, "fr", "web");
    expect((await readSharedLocaleCache(storage)).active).toBe("fr");

    const signedOut = await endAccountLocale(storage);
    expect(signedOut).toBeNull();
    expect(resolveActiveLocale(signedOut)).toBe("en");

    const userB = await beginAccountLocale(storage, null, "web");
    expect(userB).toBe("en");
    expect(resolveActiveLocale(userB)).toBe("en");
    expect((await readSharedLocaleCache(storage)).active).not.toBe("fr");
  });

  it("gives each signed-in account its own language", async () => {
    const storage = memoryLocaleSession();
    expect(await beginAccountLocale(storage, "fr", "web")).toBe("fr");
    await endAccountLocale(storage);
    expect(await beginAccountLocale(storage, "es", "web")).toBe("es");
    const cache = await readSharedLocaleCache(storage);
    expect(cache.active).toBe("es");
    expect(cache.accountOwned).toBe(true);
  });

  it("does not let a user with no preference inherit Arabic or right-to-left", async () => {
    const storage = memoryLocaleSession();
    const arabic = await beginAccountLocale(storage, "ar", "web");
    expect(arabic).toBe("ar");
    expect(getTextDirection("ar")).toBe("rtl");
    await endAccountLocale(storage);

    const userB = await beginAccountLocale(storage, null, "web");
    const locale = resolveActiveLocale(userB);
    expect(locale).toBe("en");
    expect(getTextDirection(locale)).toBe("ltr");
  });

  it("keeps the same user's Portuguese after sign-out and sign-in", async () => {
    const storage = memoryLocaleSession();
    expect(await beginAccountLocale(storage, "pt", "web")).toBe("pt");
    await endAccountLocale(storage);
    expect(await beginAccountLocale(storage, "pt", "web")).toBe("pt");
  });

  it("switches accounts without keeping the previous language", () => {
    const userA = applyAccountSession(emptyCache(), "fr", "web");
    const userB = applyAccountSession(userA.cache, "es", "web");
    expect(userA.preference).toBe("fr");
    expect(userB.preference).toBe("es");
    expect(userB.cache.guest).toBeNull();
  });

  it("keeps a guest choice and restores it after an account session", async () => {
    const storage = memoryLocaleSession();
    await rememberGuestLocale(storage, "fr");
    expect(resolveActiveLocale("fr")).toBe("fr");

    expect(await beginAccountLocale(storage, null, "web")).toBe("en");
    const duringAccount = await readSharedLocaleCache(storage);
    expect(duringAccount.active).toBe("en");
    expect(duringAccount.guest).toBe("fr");
    expect(duringAccount.accountOwned).toBe(true);

    const restored = await endAccountLocale(storage);
    expect(restored).toBe("fr");
    const after = await readSharedLocaleCache(storage);
    expect(after.active).toBe("fr");
    expect(after.accountOwned).toBe(false);
    expect(after.guest).toBe("fr");
  });

  it("uses device language on mobile when the account has no preference", async () => {
    const storage = memoryLocaleSession();
    await beginAccountLocale(storage, "fr", "native");
    await endAccountLocale(storage);
    const userB = await beginAccountLocale(storage, null, "native");
    expect(userB).toBe("system");
    expect(resolveLaunchLocale(userB, "en-US")).toBe("en");
    expect(resolveLaunchLocale(userB, "pt-BR")).toBe("pt");
    expect(resolveLaunchLocale(userB, "en-US")).not.toBe("fr");
  });

  it("stores only locale codes and an account flag", async () => {
    const storage = memoryLocaleSession();
    await rememberGuestLocale(storage, "es");
    await beginAccountLocale(storage, "ar", "web");
    expect(await storage.get(LOCALE_STORAGE_KEY)).toBe("ar");
    expect(await storage.get(LOCALE_GUEST_STORAGE_KEY)).toBe("es");
    expect(await storage.get(LOCALE_ACCOUNT_CACHE_KEY)).toBe("1");

    const released = releaseAccountSession({
      active: "ar",
      guest: "es",
      accountOwned: true,
    });
    expect(released.preference).toBe("es");
    expect(applyGuestChoice(emptyCache(), "pt").accountOwned).toBe(false);
  });
});
