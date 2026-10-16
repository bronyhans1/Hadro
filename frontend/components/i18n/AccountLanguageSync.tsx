"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLocale } from "@/components/providers/LocaleProvider";
import { DEFAULT_LOCALE, beginAccountLocale, endAccountLocale, parseAccountLanguage, readSharedLocaleCache } from "@hadro/i18n";
import { browserLocaleSession } from "@/lib/i18n/storage";

/**
 * Survives the locale remount. A new account value is applied once, so a
 * choice that has not been saved yet is not replaced by the previous server value.
 * Sign-out clears an account-owned cache so the next user cannot inherit it.
 */
let sessionUserId: string | null = null;
let appliedMarker: string | null = null;

/** Apply the signed-in user's language. A missing preference uses the web fallback. */
export function AccountLanguageSync() {
  const { user, isLoading } = useAuth();
  const { setPreference } = useLocale();

  useEffect(() => {
    if (isLoading) return;
    let cancelled = false;

    async function run() {
      if (!user) {
        const cache = await readSharedLocaleCache(browserLocaleSession);
        if (cancelled || (!sessionUserId && !cache.accountOwned)) return;
        sessionUserId = null;
        appliedMarker = null;
        const guest = await endAccountLocale(browserLocaleSession);
        if (cancelled) return;
        await setPreference(guest ?? DEFAULT_LOCALE);
        return;
      }

      const account = parseAccountLanguage(user.language);
      const marker = `${user.userId}:${account ?? ""}`;
      if (sessionUserId === user.userId && appliedMarker === marker) return;
      sessionUserId = user.userId;
      appliedMarker = marker;
      const preference = await beginAccountLocale(browserLocaleSession, user.language, "web");
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
