import { DEFAULT_LOCALE, type Locale } from "./locales";

export type PluralCategory = "zero" | "one" | "two" | "few" | "many" | "other";

type Operands = {
  /** Absolute value of the source number. */
  n: number;
  /** Integer digits. */
  i: number;
  /** Visible fraction digits, including trailing zeros from the decimal text. */
  v: number;
};

/**
 * Cardinal plural categories for the six supported locales.
 * Rules follow CLDR so a runtime without Intl.PluralRules still matches the catalogs.
 * English and Kiswahili: one when the integer is 1 and there is no fraction.
 * French and Portuguese: one when the integer part is 0 or 1.
 * Spanish: one only when the number is exactly 1.
 * Arabic: zero, one, two, few (3–10), many (11–99), otherwise other.
 */
export function selectCardinalPlural(locale: Locale, count: number): PluralCategory {
  if (!Number.isFinite(count)) return "other";
  const operands = pluralOperands(count);
  switch (locale) {
    case "fr":
    case "pt":
      return operands.i === 0 || operands.i === 1 ? "one" : "other";
    case "es":
      return operands.n === 1 ? "one" : "other";
    case "ar":
      return arabicCategory(operands.n);
    case "en":
    case "sw":
      return operands.i === 1 && operands.v === 0 ? "one" : "other";
    default:
      return operands.i === 1 && operands.v === 0 ? "one" : "other";
  }
}

function arabicCategory(n: number): PluralCategory {
  if (n === 0) return "zero";
  if (n === 1) return "one";
  if (n === 2) return "two";
  const mod100 = n - Math.floor(n / 100) * 100;
  if (mod100 >= 3 && mod100 <= 10) return "few";
  if (mod100 >= 11 && mod100 <= 99) return "many";
  return "other";
}

function pluralOperands(count: number): Operands {
  const n = Math.abs(count);
  if (Number.isInteger(n)) return { n, i: n, v: 0 };
  const text = expandDecimal(n);
  const [intText, frac = ""] = text.split(".");
  const i = Number(intText);
  return { n, i: Number.isFinite(i) ? i : 0, v: frac.length };
}

function expandDecimal(value: number): string {
  const text = String(value);
  if (!/[eE]/.test(text)) return text;
  return value.toFixed(20).replace(/0+$/, "").replace(/\.$/, "");
}

/**
 * Prefer the runtime implementation. Hermes in this app does not provide
 * Intl.PluralRules, and constructing it again in a catch block throws.
 */
export function pluralCategory(locale: Locale, count: number): PluralCategory {
  const native = nativePluralCategory(locale, count);
  if (native) return native;
  return selectCardinalPlural(locale, count);
}

function nativePluralCategory(locale: Locale, count: number): PluralCategory | null {
  const PluralRules = typeof Intl === "undefined" ? undefined : Intl.PluralRules;
  if (typeof PluralRules !== "function") return null;
  try {
    return new PluralRules(locale).select(count) as PluralCategory;
  } catch {
    try {
      return new PluralRules(DEFAULT_LOCALE).select(count) as PluralCategory;
    } catch {
      return null;
    }
  }
}
