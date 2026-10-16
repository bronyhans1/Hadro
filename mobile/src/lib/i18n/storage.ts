import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LOCALE_STORAGE_KEY, type LocalePreferenceStorage, type SharedLocaleStorage } from "@/lib/i18n";

/**
 * UI language preference. Not a credential, so it is not written to SecureStore.
 * Web: localStorage. Native: AsyncStorage, so an explicit choice survives restart.
 * An automatic device-language choice is not written here.
 */
export const mobileLocaleStorage: LocalePreferenceStorage = {
  get() {
    if (Platform.OS === "web") {
      try {
        return globalThis.localStorage?.getItem(LOCALE_STORAGE_KEY) ?? null;
      } catch {
        return null;
      }
    }
    return AsyncStorage.getItem(LOCALE_STORAGE_KEY).catch(() => null);
  },
  set(value) {
    if (Platform.OS === "web") {
      try {
        globalThis.localStorage?.setItem(LOCALE_STORAGE_KEY, value);
      } catch {
        /* ignore */
      }
      return;
    }
    return AsyncStorage.setItem(LOCALE_STORAGE_KEY, value).catch(() => undefined);
  },
  remove() {
    if (Platform.OS === "web") {
      try {
        globalThis.localStorage?.removeItem(LOCALE_STORAGE_KEY);
      } catch {
        /* ignore */
      }
      return;
    }
    return AsyncStorage.removeItem(LOCALE_STORAGE_KEY).catch(() => undefined);
  },
};

/** Guest locale plus the flag that marks an account-owned cache. Not a credential. */
export const mobileLocaleSession: SharedLocaleStorage = {
  get(key) {
    if (Platform.OS === "web") {
      try {
        return globalThis.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    }
    return AsyncStorage.getItem(key).catch(() => null);
  },
  set(key, value) {
    if (Platform.OS === "web") {
      try {
        globalThis.localStorage?.setItem(key, value);
      } catch {
        /* ignore */
      }
      return;
    }
    return AsyncStorage.setItem(key, value).catch(() => undefined);
  },
  remove(key) {
    if (Platform.OS === "web") {
      try {
        globalThis.localStorage?.removeItem(key);
      } catch {
        /* ignore */
      }
      return;
    }
    return AsyncStorage.removeItem(key).catch(() => undefined);
  },
};
