import { formatDate } from "./format";
import { getActiveLocale, translate, translateLabel } from "./translate";

export type PayrollWarningCounts = {
  draftRecords: number;
  pendingManualOt: number;
  pendingRemoteAttendance: number;
  leaveChangesInMonth: number;
  syncFailuresInMonth: number;
};

const TIMELINE_KEYS: Record<string, { title: string; body: string }> = {
  "payroll_period.created": {
    title: "payroll.periodTimeline.createdTitle",
    body: "payroll.periodTimeline.createdBody",
  },
  "payroll_period.submitted_for_review": {
    title: "payroll.periodTimeline.submittedTitle",
    body: "payroll.periodTimeline.submittedBody",
  },
  "payroll_period.approved": {
    title: "payroll.periodTimeline.approvedTitle",
    body: "payroll.periodTimeline.approvedBody",
  },
  "payroll_period.locked": {
    title: "payroll.periodTimeline.lockedTitle",
    body: "payroll.periodTimeline.lockedBody",
  },
  "payroll_period.unlocked": {
    title: "payroll.periodTimeline.unlockedTitle",
    body: "payroll.periodTimeline.unlockedBody",
  },
  "payroll_period.closed": {
    title: "payroll.periodTimeline.archivedTitle",
    body: "payroll.periodTimeline.archivedBody",
  },
  "payroll_period.archived": {
    title: "payroll.periodTimeline.archivedTitle",
    body: "payroll.periodTimeline.archivedBody",
  },
  "payroll_period.reopened": {
    title: "payroll.periodTimeline.reopenedTitle",
    body: "payroll.periodTimeline.reopenedBody",
  },
  "payroll_period.regenerated": {
    title: "payroll.periodTimeline.regeneratedTitle",
    body: "payroll.periodTimeline.regeneratedBody",
  },
};

/** Presentation for payroll health. Counts stay numeric; only the sentences follow the locale. */
export function payrollHealthWarnings(counts: PayrollWarningCounts): string[] {
  const lines: string[] = [];
  if (counts.draftRecords > 0) {
    lines.push(translate("payroll.warningDraft", { count: counts.draftRecords }));
  }
  if (counts.pendingRemoteAttendance > 0) {
    lines.push(translate("payroll.warningRemote", { count: counts.pendingRemoteAttendance }));
  }
  if (counts.pendingManualOt > 0) {
    lines.push(translate("payroll.warningManualOt", { count: counts.pendingManualOt }));
  }
  if (counts.leaveChangesInMonth > 0) {
    lines.push(translate("payroll.warningLeave", { count: counts.leaveChangesInMonth }));
  }
  if (counts.syncFailuresInMonth > 0) {
    lines.push(translate("payroll.warningSync", { count: counts.syncFailuresInMonth }));
  }
  if (lines.length === 0) lines.push(translate("payroll.appearsReady"));
  return lines;
}

function periodLabel(metadata: Record<string, unknown> | null | undefined): string | null {
  const year = Number(metadata?.year);
  const month = Number(metadata?.month);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return null;
  return formatDate(new Date(year, month - 1, 1), getActiveLocale(), {
    month: "long",
    year: "numeric",
  });
}

/**
 * Render a stored payroll timeline event from its type and metadata.
 * Unknown events keep the stored title and description.
 */
export function presentPayrollTimelineEvent(event: {
  event_type: string;
  title: string;
  description: string;
  metadata?: Record<string, unknown> | null;
}): { title: string; description: string } {
  const spec = TIMELINE_KEYS[event.event_type];
  if (!spec) return { title: event.title, description: event.description };
  const period = periodLabel(event.metadata);
  const title = translate(spec.title);
  if (!period) return { title, description: event.description };
  const reasonCode = typeof event.metadata?.reason === "string" ? event.metadata.reason : "";
  const storedReason = typeof event.metadata?.reason_label === "string" ? event.metadata.reason_label : reasonCode;
  const reason = reasonCode ? translateLabel(`payroll.reopenReasons.${reasonCode}`, storedReason) : "";
  return {
    title,
    description: translate(spec.body, { values: { period, reason } }),
  };
}

const READINESS_STATUS_KEYS: Record<string, string> = {
  ready: "payroll.readiness.ready",
  needs_review: "payroll.readiness.needsReview",
  action_required: "payroll.readiness.actionRequired",
};

/** Localized payroll readiness from the stable status code. Unknown codes keep the fallback. */
export function presentPayrollReadiness(status: string, fallback?: string): string {
  const key = READINESS_STATUS_KEYS[status];
  if (key) return translate(key);
  return fallback ?? status;
}

const TIMELINE_MODULE_KEYS: Record<string, string> = {
  payroll: "navigation.payroll",
  attendance: "navigation.attendance",
  leave: "navigation.leave",
};

/** Localize a known timeline category. Unknown module values stay as stored. */
export function presentTimelineModule(module: string): string {
  const key = TIMELINE_MODULE_KEYS[module.trim().toLowerCase()];
  return key ? translate(key) : module;
}
