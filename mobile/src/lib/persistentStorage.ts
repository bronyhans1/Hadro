import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * Native: Expo SecureStore. Web: localStorage (SecureStore is not available on web).
 * Keys stay the same (hadro_*).
 */
export async function getPersistentItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

export async function setPersistentItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      /* ignore quota / private mode */
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deletePersistentItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      /* ignore */
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
