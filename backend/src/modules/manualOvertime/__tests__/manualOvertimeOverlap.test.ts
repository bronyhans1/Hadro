import {
  buildManualOvertimeOverlapSummary,
  evaluateManualOtStackingPolicy,
  hasManualOvertimeOverlap,
} from "../manualOvertimeOverlap";

describe("manualOvertimeOverlap", () => {
  const baseSummary = buildManualOvertimeOverlapSummary({
    earningsDate: "2026-05-15",
    automaticOvertimeMinutes: 120,
    existingManualOvertimeMinutes: 60,
    proposedHours: 3,
    attendanceSessionCount: 2,
    existingManualEntryCount: 1,
  });

  it("builds overlap summary with combined hours", () => {
    expect(baseSummary.automatic_overtime_hours).toBe(2);
    expect(baseSummary.existing_manual_overtime_hours).toBe(1);
    expect(baseSummary.proposed_hours).toBe(3);
    expect(baseSummary.combined_overtime_hours).toBe(6);
  });

  it("detects overlap when attendance or manual OT exists", () => {
    expect(hasManualOvertimeOverlap(baseSummary)).toBe(true);
    expect(
      hasManualOvertimeOverlap(
        buildManualOvertimeOverlapSummary({
          earningsDate: "2026-05-15",
          automaticOvertimeMinutes: 0,
          existingManualOvertimeMinutes: 0,
          proposedHours: 2,
          attendanceSessionCount: 0,
          existingManualEntryCount: 0,
        })
      )
    ).toBe(false);
  });

  it("allow mode never requires acknowledgment", () => {
    const result = evaluateManualOtStackingPolicy("allow", baseSummary, false);
    expect(result.allowed).toBe(true);
    expect(result.requiresAcknowledgment).toBe(false);
  });

  it("block mode rejects when attendance OT exists", () => {
    const result = evaluateManualOtStackingPolicy("block", baseSummary, false);
    expect(result.allowed).toBe(false);
    expect(result.error).toMatch(/blocked/i);
  });

  it("block mode allows when only existing manual OT (multiple entries per day)", () => {
    const manualOnly = buildManualOvertimeOverlapSummary({
      earningsDate: "2026-05-15",
      automaticOvertimeMinutes: 0,
      existingManualOvertimeMinutes: 120,
      proposedHours: 2,
      attendanceSessionCount: 0,
      existingManualEntryCount: 1,
    });
    const result = evaluateManualOtStackingPolicy("block", manualOnly, false);
    expect(result.allowed).toBe(true);
  });

  it("warn mode requires acknowledgment when overlap exists", () => {
    const withoutAck = evaluateManualOtStackingPolicy("warn", baseSummary, false);
    expect(withoutAck.allowed).toBe(false);
    expect(withoutAck.requiresAcknowledgment).toBe(true);

    const withAck = evaluateManualOtStackingPolicy("warn", baseSummary, true);
    expect(withAck.allowed).toBe(true);
  });

  it("warn mode allows clean dates without acknowledgment", () => {
    const clean = buildManualOvertimeOverlapSummary({
      earningsDate: "2026-05-15",
      automaticOvertimeMinutes: 0,
      existingManualOvertimeMinutes: 0,
      proposedHours: 2,
      attendanceSessionCount: 0,
      existingManualEntryCount: 0,
    });
    const result = evaluateManualOtStackingPolicy("warn", clean, false);
    expect(result.allowed).toBe(true);
    expect(result.requiresAcknowledgment).toBe(false);
  });
});
