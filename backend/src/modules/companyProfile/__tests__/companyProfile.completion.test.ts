/**
 * Company profile completion / location / initials helpers.
 */
import {
  companyInitials,
  companyProfileCompletionPercent,
  companyProfileMissingFields,
  formatCompanyLocation,
} from "../companyProfile.completion";

describe("companyProfile.completion", () => {
  it("computes initials from multi-word and single-word names", () => {
    expect(companyInitials("SEDVIS Hotel")).toBe("SH");
    expect(companyInitials("Kembu Consult")).toBe("KC");
    expect(companyInitials("Acme")).toBe("AC");
    expect(companyInitials("")).toBe("?");
  });

  it("formats location hierarchy with best available parts", () => {
    expect(
      formatCompanyLocation({
        city: "Ho",
        region: "Volta Region",
        country: "Ghana",
      })
    ).toBe("Ho, Volta Region, Ghana");
    expect(formatCompanyLocation({ country: "Ghana" })).toBe("Ghana");
    expect(formatCompanyLocation({})).toBe("—");
  });

  it("tracks completion percent across profile fields", () => {
    expect(companyProfileCompletionPercent({})).toBe(0);
    expect(companyProfileMissingFields({}).length).toBe(10);

    const half = {
      logo_url: "https://example.com/logo.png",
      industry: "Hospitality",
      country: "Ghana",
      region: "Volta Region",
      city: "Ho",
    };
    expect(companyProfileCompletionPercent(half)).toBe(50);
    expect(companyProfileMissingFields(half)).toEqual([
      "street_address",
      "business_phone",
      "website",
      "registration_number",
      "tax_number",
    ]);
  });
});
