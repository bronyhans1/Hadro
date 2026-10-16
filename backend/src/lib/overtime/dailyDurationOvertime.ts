/**
 * Pure daily duration OT aggregation (Phase 1 — not wired to payroll earnings).
 */

export type SessionDurationInput = {
  sessionId: string;
  durationMinutes: number;
  /** Calendar or attendance day key (YYYY-MM-DD). */
  dayKey: string;
  /** Intraday ordering (e.g. check-in epoch ms). Falls back to sessionId sort. */
  orderMs?: number;
  /** Assigned shift scheduled duration (minutes). Omit or null when no valid shift. */
  scheduledShiftMinutes?: number | null;
};

export type SessionDailyAllocation = {
  sessionId: string;
  durationMinutes: number;
  allocatedRegularMinutes: number;
  allocatedOvertimeMinutes: number;
};

export type DailyDurationOvertimeDayResult = {
  dayKey: string;
  totalMinutes: number;
  regularMinutes: number;
  overtimeMinutes: number;
  bySession: SessionDailyAllocation[];
};

/** Per-session duration OT (current payroll behavior). */
export function computeSessionDurationOvertime(
  sessionMinutes: number,
  defaultDailyHours: number
): { regularMinutes: number; overtimeMinutes: number } {
  if (sessionMinutes < 0 || defaultDailyHours <= 0) {
    return { regularMinutes: 0, overtimeMinutes: 0 };
  }
  const capMinutes = defaultDailyHours * 60;
  const regularMinutes = Math.min(sessionMinutes, capMinutes);
  return {
    regularMinutes,
    overtimeMinutes: Math.max(0, sessionMinutes - regularMinutes),
  };
}

/**
 * Aggregate session durations per day, then apply one regular cap per day.
 * Regular minutes are allocated FIFO across sessions (stable sessionId order).
 */
export function aggregateDailyDurationOvertime(
  sessions: SessionDurationInput[],
  defaultDailyHours: number
): DailyDurationOvertimeDayResult[] {
  if (defaultDailyHours <= 0) return [];

  const capMinutes = defaultDailyHours * 60;
  const byDay = new Map<string, SessionDurationInput[]>();

  for (const s of sessions) {
    if (s.durationMinutes < 0) continue;
    const list = byDay.get(s.dayKey) ?? [];
    list.push(s);
    byDay.set(s.dayKey, list);
  }

  const results: DailyDurationOvertimeDayResult[] = [];

  for (const [dayKey, daySessions] of byDay) {
    const sorted = [...daySessions].sort((a, b) => {
      const aOrder = a.orderMs ?? 0;
      const bOrder = b.orderMs ?? 0;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.sessionId.localeCompare(b.sessionId);
    });
    const totalMinutes = sorted.reduce((sum, s) => sum + s.durationMinutes, 0);
    const regularMinutes = Math.min(totalMinutes, capMinutes);
    const overtimeMinutes = Math.max(0, totalMinutes - capMinutes);

    let regularRemaining = regularMinutes;
    const bySession: SessionDailyAllocation[] = sorted.map((s) => {
      const allocatedRegularMinutes = Math.min(s.durationMinutes, regularRemaining);
      regularRemaining -= allocatedRegularMinutes;
      const allocatedOvertimeMinutes =
        s.durationMinutes - allocatedRegularMinutes;
      return {
        sessionId: s.sessionId,
        durationMinutes: s.durationMinutes,
        allocatedRegularMinutes,
        allocatedOvertimeMinutes,
      };
    });

    results.push({
      dayKey,
      totalMinutes,
      regularMinutes,
      overtimeMinutes,
      bySession,
    });
  }

  return results.sort((a, b) => a.dayKey.localeCompare(b.dayKey));
}

function sortSessionsForDayAllocation(
  daySessions: SessionDurationInput[]
): SessionDurationInput[] {
  return [...daySessions].sort((a, b) => {
    const aOrder = a.orderMs ?? 0;
    const bOrder = b.orderMs ?? 0;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.sessionId.localeCompare(b.sessionId);
  });
}

/** Max regular minutes for one session before the company daily cap is applied. */
export function maxRegularMinutesBeforeDailyCap(session: SessionDurationInput): number {
  const worked = session.durationMinutes;
  if (worked < 0) return 0;
  const shift = session.scheduledShiftMinutes;
  if (typeof shift === "number" && shift > 0) {
    return Math.min(worked, shift);
  }
  return worked;
}

/**
 * Shift-aware daily OT: per-session regular ceiling from scheduled shift duration,
 * then FIFO allocation of company default_daily_hours regular cap across the day.
 * Sessions without a valid shift use worked minutes as ceiling (legacy daily behavior).
 */
export function aggregateShiftAwareDailyOvertime(
  sessions: SessionDurationInput[],
  defaultDailyHours: number
): DailyDurationOvertimeDayResult[] {
  if (defaultDailyHours <= 0) return [];

  const capMinutes = defaultDailyHours * 60;
  const byDay = new Map<string, SessionDurationInput[]>();

  for (const s of sessions) {
    if (s.durationMinutes < 0) continue;
    const list = byDay.get(s.dayKey) ?? [];
    list.push(s);
    byDay.set(s.dayKey, list);
  }

  const results: DailyDurationOvertimeDayResult[] = [];

  for (const [dayKey, daySessions] of byDay) {
    const sorted = sortSessionsForDayAllocation(daySessions);
    const totalMinutes = sorted.reduce((sum, s) => sum + s.durationMinutes, 0);
    const dayRegularCap = Math.min(totalMinutes, capMinutes);

    let regularRemaining = dayRegularCap;
    const bySession: SessionDailyAllocation[] = sorted.map((s) => {
      const ceiling = maxRegularMinutesBeforeDailyCap(s);
      const allocatedRegularMinutes = Math.min(ceiling, regularRemaining);
      regularRemaining -= allocatedRegularMinutes;
      const allocatedOvertimeMinutes = s.durationMinutes - allocatedRegularMinutes;
      return {
        sessionId: s.sessionId,
        durationMinutes: s.durationMinutes,
        allocatedRegularMinutes,
        allocatedOvertimeMinutes,
      };
    });

    const regularMinutes = bySession.reduce(
      (sum, row) => sum + row.allocatedRegularMinutes,
      0
    );
    const overtimeMinutes = totalMinutes - regularMinutes;

    results.push({
      dayKey,
      totalMinutes,
      regularMinutes,
      overtimeMinutes,
      bySession,
    });
  }

  return results.sort((a, b) => a.dayKey.localeCompare(b.dayKey));
}
