import { parseAccountLanguage, type Locale } from "@/lib/i18n";

export type ExplicitAccountLocale = {
  userId: string;
  locale: Locale;
};

export function accountLanguageMarker(userId: string, accountLanguage: unknown): string {
  return `${userId}:${parseAccountLanguage(accountLanguage) ?? ""}`;
}

/**
 * An explicit choice stays in effect until the account payload carries that same locale.
 * A slower profile response with the previous language must not replace it.
 */
export function shouldApplyAccountLanguage(params: {
  userId: string;
  accountLanguage: unknown;
  appliedMarker: string | null;
  explicit: ExplicitAccountLocale | null;
}): "apply" | "keep-explicit" | "already-applied" {
  const account = parseAccountLanguage(params.accountLanguage);
  if (
    params.explicit &&
    params.explicit.userId === params.userId &&
    account !== params.explicit.locale
  ) {
    return "keep-explicit";
  }
  if (params.appliedMarker === accountLanguageMarker(params.userId, params.accountLanguage)) {
    return "already-applied";
  }
  return "apply";
}
