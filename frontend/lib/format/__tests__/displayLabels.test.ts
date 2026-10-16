import {
  formatAccountStatusLabel,
  formatGenderLabel,
  humanizeEnumKey,
} from "../displayLabels";

describe("displayLabels", () => {
  test("formatGenderLabel title-cases known and snake_case values", () => {
    expect(formatGenderLabel("male")).toBe("Male");
    expect(formatGenderLabel("female")).toBe("Female");
    expect(formatGenderLabel("other")).toBe("Other");
    expect(formatGenderLabel("prefer_not_to_say")).toBe("Prefer Not To Say");
    expect(formatGenderLabel(null)).toBe("—");
    expect(formatGenderLabel("")).toBe("—");
  });

  test("formatAccountStatusLabel", () => {
    expect(formatAccountStatusLabel("active")).toBe("Active");
    expect(formatAccountStatusLabel("suspended")).toBe("Suspended");
  });

  test("humanizeEnumKey", () => {
    expect(humanizeEnumKey("prefer_not_to_say")).toBe("Prefer Not To Say");
    expect(humanizeEnumKey("ON_SITE")).toBe("On Site");
  });
});
