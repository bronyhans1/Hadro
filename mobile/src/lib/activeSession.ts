import type { SessionHistoryItem, SessionRecord } from "@/lib/api/attendance.api";

export type SessionLike = {
  id: string;
  status?: string | null;
  check_in?: string | null;
  check_out?: string | null;
  attendance_date?: string | null;
  overnight_session?: boolean;
  attendance_mode?: string | null;
  remote_approval_status?: string | null;
  duration_minutes?: number | null;
  branch_name?: string | null;
  department_name?: string | null;
};

/** Backend truth: open session is ACTIVE (or legacy row with no check_out). */
export function isActiveSessionRow(s: SessionLike): boolean {
  const st = (s.status ?? "").toUpperCase();
  if (st === "ACTIVE") return true;
  if (st === "COMPLETED") return false;
  return s.check_in != null && (s.check_out == null || s.check_out === "");
}

/**
 * Prefer today's list (matches /api/sessions/today after overnight merge).
 * Fall back to recent history when cache is stale or pre-backend-fix edge cases.
 */
export function pickActiveSession<T extends SessionLike>(
  todaySessions: T[],
  historySessions?: T[] | null
): T | null {
  const fromToday = todaySessions.find(isActiveSessionRow);
  if (fromToday) return fromToday;
  if (!historySessions?.length) return null;
  return historySessions.find(isActiveSessionRow) ?? null;
}

/** Normalize history row for cards that expect SessionRecord shape. */
export function toSessionRecord(row: SessionLike): SessionRecord {
  return {
    id: row.id,
    check_in: row.check_in ?? null,
    check_out: row.check_out ?? null,
    status: row.status ?? "",
    attendance_date: row.attendance_date,
    overnight_session: row.overnight_session,
    attendance_mode: row.attendance_mode ?? undefined,
    remote_approval_status: row.remote_approval_status ?? null,
    duration_minutes: row.duration_minutes ?? null,
  };
}

export type ActiveSessionSource = "today" | "history" | null;

export function pickActiveSessionWithSource(
  todaySessions: SessionLike[],
  historySessions?: SessionLike[] | null
): { session: SessionRecord | null; source: ActiveSessionSource } {
  const fromToday = todaySessions.find(isActiveSessionRow);
  if (fromToday) {
    return { session: toSessionRecord(fromToday), source: "today" };
  }
  const fromHistory = historySessions?.find(isActiveSessionRow);
  if (fromHistory) {
    return { session: toSessionRecord(fromHistory), source: "history" };
  }
  return { session: null, source: null };
}
