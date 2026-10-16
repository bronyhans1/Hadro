import type { ManualOtStackingMode } from "../../constants/manualOvertime";

export type ManualOvertimeOverlapSummary = {
  earnings_date: string;
  automatic_overtime_minutes: number;
  automatic_overtime_hours: number;
  existing_manual_overtime_minutes: number;
  existing_manual_overtime_hours: number;
  proposed_hours: number;
  combined_overtime_hours: number;
  attendance_session_count: number;
  existing_manual_entry_count: number;
};

export function buildManualOvertimeOverlapSummary(params: {
  earningsDate: string;
  automaticOvertimeMinutes: number;
  existingManualOvertimeMinutes: number;
  proposedHours: number;
  attendanceSessionCount: number;
  existingManualEntryCount: number;
}): ManualOvertimeOverlapSummary {
  const automaticHours = params.automaticOvertimeMinutes / 60;
  const existingManualHours = params.existingManualOvertimeMinutes / 60;
  const combinedHours =
    automaticHours + existingManualHours + params.proposedHours;

  return {
    earnings_date: params.earningsDate.slice(0, 10),
    automatic_overtime_minutes: params.automaticOvertimeMinutes,
    automatic_overtime_hours: round2(automaticHours),
    existing_manual_overtime_minutes: params.existingManualOvertimeMinutes,
    existing_manual_overtime_hours: round2(existingManualHours),
    proposed_hours: round2(params.proposedHours),
    combined_overtime_hours: round2(combinedHours),
    attendance_session_count: params.attendanceSessionCount,
    existing_manual_entry_count: params.existingManualEntryCount,
  };
}

export function hasManualOvertimeOverlap(summary: ManualOvertimeOverlapSummary): boolean {
  return (
    summary.automatic_overtime_minutes > 0 ||
    summary.existing_manual_overtime_minutes > 0
  );
}

export type StackingEvaluation = {
  allowed: boolean;
  requiresAcknowledgment: boolean;
  error?: string;
};

/**
 * Evaluate company stacking policy for a proposed manual OT entry.
 * Block applies when attendance OT exists; warn requires acknowledgment when any overlap exists.
 */
export function evaluateManualOtStackingPolicy(
  mode: ManualOtStackingMode,
  summary: ManualOvertimeOverlapSummary,
  overlapWarningAcknowledged: boolean
): StackingEvaluation {
  const overlap = hasManualOvertimeOverlap(summary);

  if (mode === "allow") {
    return { allowed: true, requiresAcknowledgment: false };
  }

  if (mode === "block") {
    if (summary.automatic_overtime_minutes > 0) {
      return {
        allowed: false,
        requiresAcknowledgment: false,
        error:
          "Manual overtime is blocked because the employee already has attendance overtime on this date.",
      };
    }
    return { allowed: true, requiresAcknowledgment: false };
  }

  // warn (default)
  if (!overlap) {
    return { allowed: true, requiresAcknowledgment: false };
  }
  if (!overlapWarningAcknowledged) {
    return {
      allowed: false,
      requiresAcknowledgment: true,
      error:
        "Overlap with existing overtime detected. Acknowledge the overlap warning to continue.",
    };
  }
  return { allowed: true, requiresAcknowledgment: false };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
