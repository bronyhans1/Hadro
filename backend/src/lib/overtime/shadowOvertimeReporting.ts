import { PAYROLL_RECORD_TYPE_SESSION_HOURLY } from "../payrollSemantics";

export type ShadowOvertimeFields = {
  duration_ot_minutes: number | null;
  shift_ot_minutes: number | null;
};

export type ShadowOvertimeTotals = {
  total_duration_ot_minutes: number;
  total_shift_ot_minutes: number;
};

export function buildShadowOvertimeForRecord(
  record: {
    record_type?: string | null;
    overtime_minutes?: number | null;
    session_id?: string | null;
  },
  shiftOvertimeBySessionId: ReadonlyMap<string, number | null | undefined>
): ShadowOvertimeFields {
  const rt = record.record_type ?? PAYROLL_RECORD_TYPE_SESSION_HOURLY;
  if (rt !== PAYROLL_RECORD_TYPE_SESSION_HOURLY) {
    return { duration_ot_minutes: null, shift_ot_minutes: null };
  }

  const durationOt =
    typeof record.overtime_minutes === "number" ? record.overtime_minutes : null;

  let shiftOt: number | null = null;
  if (record.session_id) {
    const raw = shiftOvertimeBySessionId.get(record.session_id);
    shiftOt = typeof raw === "number" ? raw : null;
  }

  return {
    duration_ot_minutes: durationOt,
    shift_ot_minutes: shiftOt,
  };
}

export function sumShadowOvertimeTotals(
  records: ReadonlyArray<{ shadow_overtime?: ShadowOvertimeFields | null }>
): ShadowOvertimeTotals {
  let totalDuration = 0;
  let totalShift = 0;

  for (const r of records) {
    const shadow = r.shadow_overtime;
    if (!shadow) continue;
    if (typeof shadow.duration_ot_minutes === "number") {
      totalDuration += shadow.duration_ot_minutes;
    }
    if (typeof shadow.shift_ot_minutes === "number") {
      totalShift += shadow.shift_ot_minutes;
    }
  }

  return {
    total_duration_ot_minutes: totalDuration,
    total_shift_ot_minutes: totalShift,
  };
}
