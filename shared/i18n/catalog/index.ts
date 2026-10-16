import { ar, es, fr, pt, sw } from "./bundles";
import { en, type EnglishCatalog } from "./en";
import type { Locale } from "../locales";

/** Nested partial so unfinished locales omit keys instead of inventing copy. */
export type DeepPartial<T> = T extends string
  ? string
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

/**
 * English is the source catalog.
 * fr, pt, ar, sw, and es are reviewed translations of that catalog.
 * A missing key still resolves to English.
 */
export const catalogs: Record<Locale, DeepPartial<EnglishCatalog>> = {
  en,
  fr: fr as unknown as DeepPartial<EnglishCatalog>,
  pt: pt as unknown as DeepPartial<EnglishCatalog>,
  ar: ar as unknown as DeepPartial<EnglishCatalog>,
  sw: sw as unknown as DeepPartial<EnglishCatalog>,
  es: es as unknown as DeepPartial<EnglishCatalog>,
};

export { en };
export type { EnglishCatalog };
