import { useEffect } from "react";
import { Platform } from "react-native";
import { useAuth } from "@/store/auth";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import {
  DEFAULT_LOCALE,
  beginAccountLocale,
  endAccountLocale,
  parseAccountLanguage,
  readSharedLocaleCache,
} from "@/lib/i18n";
import { mobileLocaleSession } from "@/lib/i18n/storage";
import {
  shouldApplyAccountLanguage,
  type ExplicitAccountLocale,
} from "@/lib/i18n/accountLocaleSync";

/**
 * Survives the locale remount. A new account value is applied once, so a
 * choice that has not been saved yet is not replaced by the previous server value.
 * Sign-out clears an account-owned cache so the next user cannot inherit it.
 */
let sessionUserId: string | null = null;
let appliedMarker: string | null = null;
let explicitChoice: ExplicitAccountLocale | null = null;

/** Remember a language the signed-in user just chose, before the account payload catches up. */
export function noteExplicitAccountLocale(choice: ExplicitAccountLocale): void {
  explicitChoice = choice;
}

const client = Platform.OS === "web" ? "web" : "native";

/** Apply the signed-in user's language. A missing preference follows the device on native. */
export function AccountLanguageSync() {
  const { user, isLoading } = useAuth();
  const { setPreference } = useLocale();

  useEffect(() => {
    if (isLoading) return;
    let cancelled = false;

    async function run() {
      if (!user) {
        const cache = await readSharedLocaleCache(mobileLocaleSession);
        if (cancelled || (!sessionUserId && !cache.accountOwned)) return;
        sessionUserId = null;
        appliedMarker = null;
        explicitChoice = null;
        const guest = await endAccountLocale(mobileLocaleSession);
        if (cancelled) return;
        await setPreference(guest ?? (client === "native" ? "system" : DEFAULT_LOCALE));
        return;
      }

      const decision = shouldApplyAccountLanguage({
        userId: user.userId,
        accountLanguage: user.language,
        appliedMarker: sessionUserId === user.userId ? appliedMarker : null,
        explicit: explicitChoice,
      });
      if (decision !== "apply") return;
      sessionUserId = user.userId;
      appliedMarker = `${user.userId}:${parseAccountLanguage(user.language) ?? ""}`;
      const preference = await beginAccountLocale(mobileLocaleSession, user.language, client);
      if (cancelled) return;
      await setPreference(preference);
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [user, isLoading, setPreference]);

  return null;
}
