import type { RemoteSessionRow } from "@/lib/api/remoteAttendance.api";
import { translate } from "@/lib/i18n";

export interface RemoteReviewSummaryMetrics {
  pendingReviews: number;
  awaitingAction: number;
  employeesPending: number;
  missingContextCount: number;
}

export function employeeDisplayName(row: RemoteSessionRow): string {
  return row.employee_name ?? row.employee_email ?? row.user_id;
}

export function computeRemoteReviewSummary(rows: RemoteSessionRow[]): RemoteReviewSummaryMetrics {
  const uniqueEmployees = new Set(rows.map((r) => r.user_id)).size;
  const missingContextCount = rows.filter((r) => !r.branch_name || !r.department_name).length;

  return {
    pendingReviews: rows.length,
    awaitingAction: rows.length,
    employeesPending: uniqueEmployees,
    missingContextCount,
  };
}

export function findOldestPendingRow(rows: RemoteSessionRow[]): RemoteSessionRow | null {
  if (rows.length === 0) return null;

  return rows.reduce<RemoteSessionRow | null>((oldest, row) => {
    if (!row.check_in) return oldest;
    if (!oldest?.check_in) return row;
    return new Date(row.check_in).getTime() < new Date(oldest.check_in).getTime() ? row : oldest;
  }, null);
}

export interface RemoteReviewAttentionItem {
  id: string;
  label: string;
  value: string;
  attention: boolean;
}

export function buildRemoteReviewAttentionItems(
  rows: RemoteSessionRow[],
  formatWhen: (iso: string | null) => string
): RemoteReviewAttentionItem[] {
  const oldest = findOldestPendingRow(rows);
  const summary = computeRemoteReviewSummary(rows);

  const items: RemoteReviewAttentionItem[] = [
    {
      id: "awaiting",
      label: translate("attendance.requestsAwaitingReview"),
      value:
        summary.awaitingAction === 0
          ? translate("attendance.noPendingRemoteSessions")
          : translate("attendance.sessionsNeedAction", { count: summary.awaitingAction }),
      attention: summary.awaitingAction > 0,
    },
  ];

  if (oldest?.check_in) {
    items.push({
      id: "oldest",
      label: translate("attendance.oldestPendingRequest"),
      value: `${employeeDisplayName(oldest)} · ${formatWhen(oldest.check_in)}`,
      attention: summary.awaitingAction > 0,
    });
  }

  if (summary.missingContextCount > 0) {
    items.push({
      id: "context",
      label: translate("attendance.incompleteSessionContext"),
      value: translate("attendance.missingContextRequests", { count: summary.missingContextCount }),
      attention: true,
    });
  }

  return items;
}
