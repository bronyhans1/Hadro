import { resolveLaunchLocale, type LocalePreference } from "../../../../shared/i18n";
import {
  languageTagFromLocales,
  readDeviceLanguageTagFrom,
} from "../i18n/deviceLanguage";

const EXPLICIT: LocalePreference[] = ["en", "fr", "pt", "ar", "sw", "es"];

describe("mobile first-launch language", () => {
  it.each(EXPLICIT)("saved explicit %s stays %s", (code) => {
    expect(resolveLaunchLocale(code, "fr-FR")).toBe(code);
  });

  it.each([
    ["en-US", "en"],
    ["en-GH", "en"],
    ["fr-FR", "fr"],
    ["pt-BR", "pt"],
    ["ar-SA", "ar"],
    ["sw-KE", "sw"],
    ["es-ES", "es"],
  ] as const)("device %s resolves to %s", (tag, locale) => {
    expect(resolveLaunchLocale(null, tag)).toBe(locale);
  });

  it.each(["de-DE", "it-IT", "ja-JP"])("unsupported %s falls back to English", (tag) => {
    expect(resolveLaunchLocale(null, tag)).toBe("en");
  });

  it("saved explicit preference overrides the device locale", () => {
    expect(resolveLaunchLocale("es", "fr-FR")).toBe("es");
  });

  it("no saved preference uses a supported device locale", () => {
    expect(resolveLaunchLocale(null, "fr-FR")).toBe("fr");
  });

  it("no saved preference and an unsupported device locale use English", () => {
    expect(resolveLaunchLocale(null, "de-DE")).toBe("en");
  });

  it("a failed device read falls back to English", () => {
    expect(resolveLaunchLocale(null, null)).toBe("en");
    expect(resolveLaunchLocale(undefined, undefined)).toBe("en");
    expect(readDeviceLanguageTagFrom(() => {
      throw new Error("locale unavailable");
    })).toBeNull();
    expect(resolveLaunchLocale(null, readDeviceLanguageTagFrom(() => {
      throw new Error("locale unavailable");
    }))).toBe("en");
  });

  it("keeps only the language from a device locale list", () => {
    expect(languageTagFromLocales([{ languageTag: "pt-BR", languageCode: "pt" }])).toBe("pt-BR");
    expect(languageTagFromLocales([{ languageCode: "sw" }])).toBe("sw");
    expect(languageTagFromLocales([])).toBeNull();
    expect(languageTagFromLocales(null)).toBeNull();
  });
});
