import { setActiveLocale, translate } from "../../../../shared/i18n";
import { selectCardinalPlural, type PluralCategory } from "../../../../shared/i18n/pluralRules";
import { activeLeaveBalanceSummary } from "../leave/leaveBalanceDisplay";

const SAMPLES = [0, 0.5, 1, 1.5, 2, 3, 10, 11, 99, 100, 101, 103];

describe("cardinal plural rules", () => {
  const original = Intl.PluralRules;

  afterEach(() => {
    Object.defineProperty(Intl, "PluralRules", {
      configurable: true,
      writable: true,
      value: original,
    });
    setActiveLocale("en");
  });

  test("matches Intl for every supported locale", () => {
    for (const locale of ["en", "fr", "pt", "es", "sw", "ar"] as const) {
      const rules = new Intl.PluralRules(locale);
      for (const count of SAMPLES) {
        expect(selectCardinalPlural(locale, count)).toBe(rules.select(count) as PluralCategory);
      }
    }
  });

  test("selects English, French, Portuguese, Spanish, and Kiswahili categories", () => {
    expect(selectCardinalPlural("en", 1)).toBe("one");
    expect(selectCardinalPlural("en", 0)).toBe("other");
    expect(selectCardinalPlural("en", 1.5)).toBe("other");
    expect(selectCardinalPlural("fr", 0)).toBe("one");
    expect(selectCardinalPlural("fr", 1)).toBe("one");
    expect(selectCardinalPlural("fr", 2)).toBe("other");
    expect(selectCardinalPlural("pt", 0)).toBe("one");
    expect(selectCardinalPlural("pt", 1.2)).toBe("one");
    expect(selectCardinalPlural("pt", 2)).toBe("other");
    expect(selectCardinalPlural("es", 1)).toBe("one");
    expect(selectCardinalPlural("es", 0)).toBe("other");
    expect(selectCardinalPlural("sw", 1)).toBe("one");
    expect(selectCardinalPlural("sw", 2)).toBe("other");
  });

  test("selects Arabic zero, one, two, few, many, and other", () => {
    expect(selectCardinalPlural("ar", 0)).toBe("zero");
    expect(selectCardinalPlural("ar", 1)).toBe("one");
    expect(selectCardinalPlural("ar", 2)).toBe("two");
    expect(selectCardinalPlural("ar", 3)).toBe("few");
    expect(selectCardinalPlural("ar", 11)).toBe("many");
    expect(selectCardinalPlural("ar", 100)).toBe("other");
    expect(selectCardinalPlural("ar", 0.5)).toBe("other");
  });

  test("does not throw when Intl.PluralRules is missing", () => {
    Object.defineProperty(Intl, "PluralRules", {
      configurable: true,
      writable: true,
      value: undefined,
    });
    expect(translate("leave.activeBalanceCount", { locale: "en", count: 1 })).toBe(
      "1 active leave balance"
    );
    expect(translate("leave.activeBalanceCount", { locale: "fr", count: 2 })).toBe(
      "2 soldes de congés actifs"
    );
    expect(translate("employees.count", { locale: "ar", count: 0 })).toBe("0 موظف");
    expect(translate("employees.count", { locale: "ar", count: 2 })).toBe("2 موظفان");
    expect(translate("employees.count", { locale: "ar", count: 5 })).toBe("5 موظفون");
    expect(translate("employees.count", { locale: "sw", count: 1 })).toBe("Mfanyakazi 1");
    expect(translate("employees.count", { locale: "pt", count: 1 })).toBe("1 colaborador");
    expect(translate("employees.count", { locale: "es", count: 2 })).toBe("2 empleados");
  });

  test("uses English cardinal rules for an unsupported locale tag", () => {
    expect(selectCardinalPlural("de" as "en", 1)).toBe("one");
    expect(selectCardinalPlural("de" as "en", 0)).toBe("other");
    expect(selectCardinalPlural("en", Number.NaN)).toBe("other");
  });

  test("renders an assigned leave balance in English, French, and Arabic without PluralRules", () => {
    Object.defineProperty(Intl, "PluralRules", {
      configurable: true,
      writable: true,
      value: undefined,
    });
    setActiveLocale("en");
    expect(activeLeaveBalanceSummary(1)).toBe("1 active leave balance");
    setActiveLocale("fr");
    expect(activeLeaveBalanceSummary(1)).toBe("1 solde de congés actif");
    setActiveLocale("ar");
    expect(activeLeaveBalanceSummary(2)).toBe("2 رصيدا إجازة نشطان");
  });
});
