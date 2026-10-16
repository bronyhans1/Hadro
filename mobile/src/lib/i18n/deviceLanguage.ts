export type DeviceLocaleTag = {
  languageTag?: string | null;
  languageCode?: string | null;
};

/** Primary language tag from an Expo locale list. Region is ignored later. */
export function languageTagFromLocales(
  locales: DeviceLocaleTag[] | null | undefined
): string | null {
  const first = locales?.[0];
  if (!first) return null;
  const tag = first.languageTag || first.languageCode || null;
  return tag && tag.trim() ? tag : null;
}

/** Never throws. A failed or empty read means the caller should fall back to English. */
export function readDeviceLanguageTagFrom(
  read: () => DeviceLocaleTag[] | null | undefined
): string | null {
  try {
    return languageTagFromLocales(read());
  } catch {
    return null;
  }
}

export function readDeviceLanguageTag(): string | null {
  try {
    // Loaded only when called so tests of the resolver do not require the native module.
    const { getLocales } = require("expo-localization") as {
      getLocales: () => DeviceLocaleTag[];
    };
    return readDeviceLanguageTagFrom(getLocales);
  } catch {
    return null;
  }
}
