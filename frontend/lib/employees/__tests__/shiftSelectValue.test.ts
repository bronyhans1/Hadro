import { shiftIdFromSelectValue } from "../shiftSelectValue";
import { rowClickShouldOpen } from "../../ui/rowActivation";

describe("employee shift select", () => {
  test("reads the select value and clears an empty choice", () => {
    expect(shiftIdFromSelectValue("shift-morning")).toBe("shift-morning");
    expect(shiftIdFromSelectValue("")).toBeNull();
  });

  test("row clicks on the shift control do not open the employee record", () => {
    const control = {
      closest: (selector: string) => (selector.includes("[data-row-control]") ? {} : null),
    };
    const cell = { closest: () => null };
    expect(rowClickShouldOpen(control as unknown as EventTarget)).toBe(false);
    expect(rowClickShouldOpen(cell as unknown as EventTarget)).toBe(true);
  });
});
