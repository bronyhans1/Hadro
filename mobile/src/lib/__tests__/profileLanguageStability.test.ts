import { shouldApplyAccountLanguage } from "../i18n/accountLocaleSync";
import { readProfileSection, resetProfileSection, writeProfileSection } from "../profile/profileSectionMemory";

describe("profile language switch stability", () => {
  afterEach(() => {
    resetProfileSection();
  });

  test("keeps an explicit French choice when a stale English profile arrives", () => {
    expect(
      shouldApplyAccountLanguage({
        userId: "user-1",
        accountLanguage: "en",
        appliedMarker: "user-1:en",
        explicit: { userId: "user-1", locale: "fr" },
      })
    ).toBe("keep-explicit");
  });

  test("applies the account language once the saved preference matches", () => {
    expect(
      shouldApplyAccountLanguage({
        userId: "user-1",
        accountLanguage: "fr",
        appliedMarker: "user-1:en",
        explicit: { userId: "user-1", locale: "fr" },
      })
    ).toBe("apply");
    expect(
      shouldApplyAccountLanguage({
        userId: "user-1",
        accountLanguage: "fr",
        appliedMarker: "user-1:fr",
        explicit: { userId: "user-1", locale: "fr" },
      })
    ).toBe("already-applied");
  });

  test("still follows the device when the account has no language and no explicit choice", () => {
    expect(
      shouldApplyAccountLanguage({
        userId: "user-2",
        accountLanguage: null,
        appliedMarker: null,
        explicit: null,
      })
    ).toBe("apply");
  });

  test("does not let another account's explicit choice block this user", () => {
    expect(
      shouldApplyAccountLanguage({
        userId: "user-2",
        accountLanguage: "es",
        appliedMarker: null,
        explicit: { userId: "user-1", locale: "fr" },
      })
    ).toBe("apply");
  });

  test("keeps the selected profile tab across a remount", () => {
    writeProfileSection("preferences");
    expect(readProfileSection()).toBe("preferences");
    resetProfileSection();
    expect(readProfileSection()).toBe("personal");
  });
});
