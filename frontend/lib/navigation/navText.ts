import { translateLabel } from "@/lib/i18n";

/** Visible nav/chrome text. Falls back to the existing English string if a key is missing. */
export function navText(key: string | undefined, fallback: string): string {
  if (!key) return fallback;
  return translateLabel(key, fallback);
}
