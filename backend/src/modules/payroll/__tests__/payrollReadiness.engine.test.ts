import {
  computePayrollReadiness,
  countPayrollRecordStatuses,
  buildPayrollHealthWarnings,
  type PayrollHealthCounts,
} from "../payrollReadiness.engine";

describe("payrollReadiness.engine", () => {
  const clean: PayrollHealthCounts = {
    draftRecords: 0,
    approvedRecords: 5,
    lockedRecords: 0,
    pendingManualOt: 0,
    pendingRemoteAttendance: 0,
    leaveChangesInMonth: 0,
    recordsRequiringAttention: 0,
    syncFailuresInMonth: 0,
  };

  test("ready when no blockers", () => {
    const result = computePayrollReadiness(clean);
    expect(result.status).toBe("ready");
    expect(result.warnings).toContain("Payroll appears ready for review.");
  });

  test("needs_review when draft records exist", () => {
    const result = computePayrollReadiness({ ...clean, draftRecords: 3 });
    expect(result.status).toBe("needs_review");
    expect(result.warnings.some((w) => w.includes("Draft"))).toBe(true);
  });

  test("action_required when remote pending", () => {
    const result = computePayrollReadiness({
      ...clean,
      pendingRemoteAttendance: 2,
    });
    expect(result.status).toBe("action_required");
  });

  test("action_required when sync failures", () => {
    const result = computePayrollReadiness({
      ...clean,
      syncFailuresInMonth: 1,
    });
    expect(result.status).toBe("action_required");
  });

  test("action_required takes priority over needs_review", () => {
    const result = computePayrollReadiness({
      ...clean,
      draftRecords: 5,
      pendingRemoteAttendance: 1,
    });
    expect(result.status).toBe("action_required");
  });

  test("countPayrollRecordStatuses", () => {
    expect(
      countPayrollRecordStatuses([
        { status: "draft" },
        { status: "approved" },
        { status: "locked" },
        {},
      ])
    ).toEqual({ draftRecords: 2, approvedRecords: 1, lockedRecords: 1 });
  });

  test("buildPayrollHealthWarnings lists all issues", () => {
    const warnings = buildPayrollHealthWarnings({
      ...clean,
      draftRecords: 3,
      pendingRemoteAttendance: 2,
      pendingManualOt: 1,
      leaveChangesInMonth: 1,
      syncFailuresInMonth: 1,
      recordsRequiringAttention: 6,
    });
    expect(warnings.length).toBe(5);
  });
});
