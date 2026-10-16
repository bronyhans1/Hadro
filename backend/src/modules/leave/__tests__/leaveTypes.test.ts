import {
  leaveCompensationForType,
  normalizeLeaveType,
  LEAVE_TYPES,
} from "../leaveTypes";

describe("leaveTypes", () => {
  it("accepts standard leave types", () => {
    for (const t of LEAVE_TYPES) {
      expect(normalizeLeaveType(t)).toBe(t);
      expect(normalizeLeaveType(t.toUpperCase())).toBe(t);
    }
  });

  it("maps legacy other to emergency", () => {
    expect(normalizeLeaveType("other")).toBe("emergency");
  });

  it("rejects unknown types", () => {
    expect(normalizeLeaveType("paternity")).toBeNull();
  });

  it("maps compensation by type", () => {
    expect(leaveCompensationForType("annual")).toBe("paid");
    expect(leaveCompensationForType("unpaid")).toBe("unpaid");
  });
});
