import { isPublishedStoreUrl } from "../../../../frontend/lib/marketing/storeLinks";

describe("marketing store links", () => {
  test("unpublished and placeholder store URLs are not treated as public listings", () => {
    expect(isPublishedStoreUrl("")).toBe(false);
    expect(isPublishedStoreUrl("   ")).toBe(false);
    expect(isPublishedStoreUrl(null)).toBe(false);
    expect(isPublishedStoreUrl(undefined)).toBe(false);
    expect(isPublishedStoreUrl("https://apps.apple.com/app/hadro/id0000000000")).toBe(false);
    expect(isPublishedStoreUrl("http://apps.apple.com/app/hadro/id1234567890")).toBe(false);
  });

  test("https store listing URLs are accepted when configured", () => {
    expect(isPublishedStoreUrl("https://apps.apple.com/app/hadro/id1234567890")).toBe(true);
    expect(
      isPublishedStoreUrl("https://play.google.com/store/apps/details?id=com.hadro.mobile")
    ).toBe(true);
  });
});
