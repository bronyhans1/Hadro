/**
 * Path helper unit tests (no Storage I/O).
 */
import {
  getCompanyAssetFolder,
  getCompanyAssetObjectPath,
  getCompanyLogoPath,
  REGISTERED_COMPANY_ASSET_BUCKETS,
} from "../companyAssetPaths";

describe("companyAssetPaths", () => {
  it("builds company folder and object paths", () => {
    expect(getCompanyAssetFolder(" 1f8d3a72 ")).toBe("1f8d3a72");
    expect(getCompanyAssetObjectPath("1f8d3a72", "/banner.png")).toBe(
      "1f8d3a72/banner.png"
    );
  });

  it("builds canonical logo path", () => {
    expect(getCompanyLogoPath("1f8d3a72", "webp")).toBe("1f8d3a72/logo.webp");
    expect(getCompanyLogoPath("1f8d3a72", ".JPEG")).toBe("1f8d3a72/logo.jpg");
  });

  it("registers company-logos among asset buckets", () => {
    expect(REGISTERED_COMPANY_ASSET_BUCKETS).toContain("company-logos");
  });
});
