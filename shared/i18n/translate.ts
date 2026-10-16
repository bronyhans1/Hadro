import { catalogs, en, type EnglishCatalog } from "./catalog";
import { DEFAULT_LOCALE, type Locale } from "./locales";
import { pluralCategory } from "./pluralRules";

const PLURAL_CATEGORIES = new Set(["zero", "one", "two", "few", "many", "other"]);

type CatalogNode = string | { [key: string]: CatalogNode | undefined };

export type TranslateValues = Record<string, string | number>;

export type TranslateOptions = {
  locale?: Locale;
  count?: number;
  values?: TranslateValues;
};

let activeLocale: Locale = DEFAULT_LOCALE;

export function getActiveLocale(): Locale {
  return activeLocale;
}

/** Called by web/mobile preference providers. Defaults to English. */
export function setActiveLocale(locale: Locale): void {
  activeLocale = locale;
}

function isPluralNode(node: CatalogNode): node is { other: string; [key: string]: string | undefined } {
  if (typeof node !== "object" || node == null) return false;
  const keys = Object.keys(node);
  if (!keys.length || !keys.every((key) => PLURAL_CATEGORIES.has(key))) return false;
  return typeof (node as { other?: unknown }).other === "string";
}

function lookup(root: DeepPartialLike, path: string[]): CatalogNode | undefined {
  let current: unknown = root;
  for (const segment of path) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  if (typeof current === "string") return current;
  if (current && typeof current === "object") return current as CatalogNode;
  return undefined;
}

type DeepPartialLike = EnglishCatalog | Partial<Record<string, unknown>>;

function interpolate(template: string, values: TranslateValues): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, name: string) => {
    const value = values[name];
    return value == null ? "" : String(value);
  });
}

function resolveNode(locale: Locale, path: string[]): { node: CatalogNode; ruleLocale: Locale } | null {
  const localized = lookup(catalogs[locale] as DeepPartialLike, path);
  if (localized != null) return { node: localized, ruleLocale: locale };
  if (locale !== DEFAULT_LOCALE) {
    const fallback = lookup(en, path);
    if (fallback != null) return { node: fallback, ruleLocale: DEFAULT_LOCALE };
  }
  return null;
}

/**
 * Look up a dotted key. Missing keys and unfinished locales fall back to English,
 * then to the key itself so the UI never crashes on a gap.
 * `translateLabel` returns `fallback` when the key is missing.
 */
export function translateLabel(key: string, fallback: string, options: TranslateOptions = {}): string {
  const value = translate(key, options);
  return value === key ? fallback : value;
}

export function translate(key: string, options: TranslateOptions = {}): string {
  const locale = options.locale ?? activeLocale;
  const path = key.split(".").filter(Boolean);
  const resolved = resolveNode(locale, path);
  if (!resolved) return key;

  let template: string;
  if (typeof resolved.node === "string") {
    template = resolved.node;
  } else if (isPluralNode(resolved.node)) {
    const count = options.count ?? 0;
    const category = pluralCategory(resolved.ruleLocale, count);
    template = resolved.node[category] ?? resolved.node.other;
  } else {
    return key;
  }

  const values: TranslateValues = { ...options.values };
  if (options.count != null) values.count = options.count;
  return interpolate(template, values);
}

/** True when the key exists in the English catalog (string or plural). */
export function hasEnglishKey(key: string): boolean {
  const node = lookup(en, key.split(".").filter(Boolean));
  if (typeof node === "string") return true;
  return node != null && isPluralNode(node);
}
