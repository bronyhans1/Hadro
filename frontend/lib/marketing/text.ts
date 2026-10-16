import { translate, type TranslateOptions } from "@/lib/i18n";

/** Call-time lookup for public marketing copy. Keys are relative to `marketing`. */
export function marketingText(key: string, options?: TranslateOptions): string {
  return translate(`marketing.${key}`, options);
}
