import {
  DEFAULT_OVERTIME_COMPENSATION_METHOD,
  OVERTIME_COMPENSATION_METHOD_FIXED_RATE,
  OVERTIME_COMPENSATION_METHOD_MULTIPLIER,
  normalizeOvertimeCompensationMethod,
  type OvertimeCompensationMethod,
} from "../../constants/overtimeCompensationMethod";
import {
  computeOvertimePayAmount,
  resolveOvertimeMultiplierApplied,
} from "./overtimeMultiplier";

export type OvertimeCompensationParams = {
  method: OvertimeCompensationMethod;
  overtimeMultiplier: number;
  fixedOvertimeHourlyRate: number | null;
};

export type OvertimeCompensationSnapshot = {
  overtime_compensation_method_applied: OvertimeCompensationMethod;
  overtime_multiplier_applied: number | null;
  fixed_overtime_rate_applied: number | null;
};

export type OvertimeCompensationPolicyLike = {
  overtime_compensation_method?: unknown;
  overtime_multiplier?: number | null;
  fixed_overtime_hourly_rate?: number | null;
};

export type OvertimeCompensationRecordLike = {
  overtime_compensation_method_applied?: string | null;
  overtime_multiplier_applied?: number | null;
  fixed_overtime_rate_applied?: number | null;
};

export function overtimeCompensationFromPolicy(
  policy: OvertimeCompensationPolicyLike
): OvertimeCompensationParams {
  const method = normalizeOvertimeCompensationMethod(
    policy.overtime_compensation_method
  );
  const overtimeMultiplier =
    typeof policy.overtime_multiplier === "number" &&
    !Number.isNaN(policy.overtime_multiplier) &&
    policy.overtime_multiplier >= 1
      ? policy.overtime_multiplier
      : 1.5;
  const fixedRaw = policy.fixed_overtime_hourly_rate;
  const fixedOvertimeHourlyRate =
    typeof fixedRaw === "number" && !Number.isNaN(fixedRaw) && fixedRaw > 0
      ? fixedRaw
      : null;
  return { method, overtimeMultiplier, fixedOvertimeHourlyRate };
}

export function buildOvertimeCompensationSnapshot(
  compensation: OvertimeCompensationParams
): OvertimeCompensationSnapshot {
  if (compensation.method === OVERTIME_COMPENSATION_METHOD_FIXED_RATE) {
    return {
      overtime_compensation_method_applied: OVERTIME_COMPENSATION_METHOD_FIXED_RATE,
      overtime_multiplier_applied: null,
      fixed_overtime_rate_applied: compensation.fixedOvertimeHourlyRate,
    };
  }
  return {
    overtime_compensation_method_applied: OVERTIME_COMPENSATION_METHOD_MULTIPLIER,
    overtime_multiplier_applied: compensation.overtimeMultiplier,
    fixed_overtime_rate_applied: null,
  };
}

/** Resolve compensation applied on a payroll row (snapshot first, legacy → multiplier). */
export function resolveOvertimeCompensationApplied(
  record: OvertimeCompensationRecordLike,
  policy: OvertimeCompensationParams
): OvertimeCompensationParams {
  const snapMethod = record.overtime_compensation_method_applied;
  if (snapMethod == null || snapMethod === "") {
    return {
      method: OVERTIME_COMPENSATION_METHOD_MULTIPLIER,
      overtimeMultiplier: resolveOvertimeMultiplierApplied(
        record,
        policy.overtimeMultiplier
      ),
      fixedOvertimeHourlyRate: null,
    };
  }

  const method = normalizeOvertimeCompensationMethod(snapMethod);

  if (method === OVERTIME_COMPENSATION_METHOD_FIXED_RATE) {
    const snapRate = record.fixed_overtime_rate_applied;
    const fixedOvertimeHourlyRate =
      typeof snapRate === "number" && !Number.isNaN(snapRate) && snapRate > 0
        ? snapRate
        : policy.fixedOvertimeHourlyRate;
    return {
      method,
      overtimeMultiplier: policy.overtimeMultiplier,
      fixedOvertimeHourlyRate,
    };
  }

  return {
    method: OVERTIME_COMPENSATION_METHOD_MULTIPLIER,
    overtimeMultiplier: resolveOvertimeMultiplierApplied(
      record,
      policy.overtimeMultiplier
    ),
    fixedOvertimeHourlyRate: null,
  };
}

/** OT pay only — does not affect regular earnings or OT minute calculation. */
export function computeOvertimePayFromCompensation(
  overtimeMinutes: number,
  hourlyRate: number,
  compensation: OvertimeCompensationParams
): number {
  if (overtimeMinutes <= 0) return 0;
  if (compensation.method === OVERTIME_COMPENSATION_METHOD_FIXED_RATE) {
    const rate = compensation.fixedOvertimeHourlyRate;
    if (rate == null || rate <= 0) return 0;
    return (overtimeMinutes / 60) * rate;
  }
  return computeOvertimePayAmount(
    overtimeMinutes,
    hourlyRate,
    compensation.overtimeMultiplier
  );
}

export function formatOvertimeCompensationLabel(
  compensation: OvertimeCompensationParams
): string {
  if (
    compensation.method === OVERTIME_COMPENSATION_METHOD_FIXED_RATE &&
    compensation.fixedOvertimeHourlyRate != null
  ) {
    return `Fixed OT rate (${compensation.fixedOvertimeHourlyRate.toFixed(2)}/hr)`;
  }
  return `Multiplier (${compensation.overtimeMultiplier}x)`;
}

export function validateFixedOvertimeHourlyRateForMode(
  method: OvertimeCompensationMethod,
  fixedRate: unknown
): { ok: true; rate: number | null } | { ok: false; error: string } {
  if (method !== OVERTIME_COMPENSATION_METHOD_FIXED_RATE) {
    return { ok: true, rate: null };
  }
  const rate = typeof fixedRate === "number" ? fixedRate : Number(fixedRate);
  if (!Number.isFinite(rate) || rate <= 0) {
    return {
      ok: false,
      error: "fixed_overtime_hourly_rate must be greater than 0 when using fixed OT rate",
    };
  }
  return { ok: true, rate: Math.round(rate * 100) / 100 };
}

/** Legacy rows without method snapshot are treated as multiplier. */
export function legacyCompensationMethodApplied(
  record: OvertimeCompensationRecordLike
): OvertimeCompensationMethod {
  if (record.overtime_compensation_method_applied) {
    return normalizeOvertimeCompensationMethod(
      record.overtime_compensation_method_applied
    );
  }
  return DEFAULT_OVERTIME_COMPENSATION_METHOD;
}
