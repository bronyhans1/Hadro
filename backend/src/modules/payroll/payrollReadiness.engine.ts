/**
 * Read-only payroll readiness rules (Phase 4A.2).
 * Does not block or mutate payroll.
 */

export type PayrollReadinessStatus = "ready" | "needs_review" | "action_required";

export type PayrollHealthCounts = {
  draftRecords: number;
  approvedRecords: number;
  lockedRecords: number;
  pendingManualOt: number;
  pendingRemoteAttendance: number;
  leaveChangesInMonth: number;
  recordsRequiringAttention: number;
  syncFailuresInMonth: number;
};

export type PayrollReadinessResult = {
  status: PayrollReadinessStatus;
  label: string;
  warnings: string[];
};

const STATUS_LABELS: Record<PayrollReadinessStatus, string> = {
  ready: "Ready",
  needs_review: "Needs Review",
  action_required: "Action Required",
};

export function buildPayrollHealthWarnings(counts: PayrollHealthCounts): string[] {
  const warnings: string[] = [];

  if (counts.draftRecords > 0) {
    warnings.push(
      `${counts.draftRecords} payroll record${counts.draftRecords === 1 ? "" : "s"} ${counts.draftRecords === 1 ? "is" : "are"} still Draft.`
    );
  }
  if (counts.pendingRemoteAttendance > 0) {
    warnings.push(
      `${counts.pendingRemoteAttendance} remote attendance request${counts.pendingRemoteAttendance === 1 ? "" : "s"} require approval.`
    );
  }
  if (counts.pendingManualOt > 0) {
    const empWord = counts.pendingManualOt === 1 ? "entry has" : "entries have";
    warnings.push(
      `${counts.pendingManualOt} manual OT ${empWord} draft payroll linked.`
    );
  }
  if (counts.leaveChangesInMonth > 0) {
    warnings.push(
      `Approved or changed leave during this payroll month (${counts.leaveChangesInMonth} request${counts.leaveChangesInMonth === 1 ? "" : "s"}).`
    );
  }
  if (counts.syncFailuresInMonth > 0) {
    warnings.push(
      `${counts.syncFailuresInMonth} payroll sync error${counts.syncFailuresInMonth === 1 ? "" : "s"} recorded this month.`
    );
  }

  return warnings;
}

export function computePayrollReadiness(counts: PayrollHealthCounts): PayrollReadinessResult {
  const warnings = buildPayrollHealthWarnings(counts);

  let status: PayrollReadinessStatus;

  if (counts.pendingRemoteAttendance > 0 || counts.syncFailuresInMonth > 0) {
    status = "action_required";
  } else if (
    counts.draftRecords > 0 ||
    counts.pendingManualOt > 0 ||
    counts.leaveChangesInMonth > 0
  ) {
    status = "needs_review";
  } else {
    status = "ready";
  }

  const displayWarnings =
    warnings.length > 0 ? warnings : ["Payroll appears ready for review."];

  return {
    status,
    label: STATUS_LABELS[status],
    warnings: displayWarnings,
  };
}

export function countPayrollRecordStatuses(
  records: Array<{ status?: string | null }>
): Pick<
  PayrollHealthCounts,
  "draftRecords" | "approvedRecords" | "lockedRecords"
> {
  let draftRecords = 0;
  let approvedRecords = 0;
  let lockedRecords = 0;

  for (const r of records) {
    const s = (r.status ?? "draft").toLowerCase();
    if (s === "locked") lockedRecords += 1;
    else if (s === "approved") approvedRecords += 1;
    else draftRecords += 1;
  }

  return { draftRecords, approvedRecords, lockedRecords };
}

export function countPendingManualOtFromRecords(
  records: Array<{ record_type?: string | null; status?: string | null }>
): number {
  return records.filter((r) => {
    const rt = r.record_type ?? "session_hourly";
    const st = (r.status ?? "draft").toLowerCase();
    return rt === "manual_overtime" && st === "draft";
  }).length;
}
