import * as repo from "./companyPolicy.repository";
import { normalizeWorkingWeekdays } from "../payroll/salaryEarnings.engine";
import { normalizeBusinessTimeZone } from "../../lib/businessCalendar";
import {
  isOvertimePolicyMode,
  isActivatedOvertimePolicyMode,
  normalizeOvertimePolicyMode,
  UNSUPPORTED_OVERTIME_POLICY_MODES,
} from "../../constants/overtimePolicyMode";
import {
  isOvertimeCompensationMethod,
  normalizeOvertimeCompensationMethod,
} from "../../constants/overtimeCompensationMethod";
import { validateFixedOvertimeHourlyRateForMode } from "../../lib/overtime/overtimeCompensation";
import {
  isLatePayDeductionActiveOnAttendanceDate,
  normalizeIsoDateOnly,
} from "./latePayDeductionPolicy";

export interface UpdatePolicyInput {
  default_daily_hours?: number;
  overtime_multiplier?: number;
  lateness_tracking_enabled?: boolean;
  late_pay_deduction_enabled?: boolean;
  /** YYYY-MM-DD or null to clear. Required when enabling late pay deduction. */
  late_pay_deduction_effective_from?: string | null;
  payroll_enabled?: boolean;
  /** IANA timezone, e.g. Africa/Accra */
  business_timezone?: string;
  overnight_shifts_enabled?: boolean;
  remote_attendance_enabled?: boolean;
  attendance_day_classification_enabled?: boolean;
  minimum_minutes_for_counted_day?: number;
  full_day_minutes_threshold?: number;
  currency_code?: string;
  working_weekdays?: unknown;
  overtime_policy_mode?: string;
  overtime_compensation_method?: string;
  fixed_overtime_hourly_rate?: number | null;
}

/** Whether payroll / wage / earnings features are active for the company (default true). */
export async function isPayrollEnabled(companyId: string): Promise<boolean> {
  const policy = await getPolicy(companyId);
  const v = (policy as { payroll_enabled?: boolean }).payroll_enabled;
  return v !== false;
}

/** When false, late_minutes are not stored (forced to 0 at clock-in). Default true. */
export async function isLatenessTrackingEnabled(companyId: string): Promise<boolean> {
  const policy = await getPolicy(companyId);
  return policy.lateness_tracking_enabled !== false;
}

/**
 * Company-level late pay deduction toggle (payroll on + flag).
 * Prefer {@link isLatePayDeductionApplicableForAttendanceDate} for payroll math —
 * deductions also require an effective date and attendance on/after that date.
 */
export async function isLatePayDeductionEnabled(companyId: string): Promise<boolean> {
  if (!(await isPayrollEnabled(companyId))) return false;
  const policy = await getPolicy(companyId);
  return policy.late_pay_deduction_enabled === true;
}

/** Date-aware late pay gate used by hourly and monthly payroll engines. */
export async function isLatePayDeductionApplicableForAttendanceDate(
  companyId: string,
  attendanceDateYmd: string
): Promise<boolean> {
  const policy = await getPolicy(companyId);
  return isLatePayDeductionActiveOnAttendanceDate(policy, attendanceDateYmd);
}

export { isLatePayDeductionActiveOnAttendanceDate, normalizeIsoDateOnly };

function normalizeCurrencyCode(raw: unknown): "GHS" | "USD" | undefined {
  if (raw === undefined) return undefined;
  if (typeof raw !== "string") return undefined;
  const v = raw.trim().toUpperCase();
  if (v === "GHS" || v === "USD") return v;
  return undefined;
}

export async function getPolicy(
  companyId: string
): Promise<repo.CompanyPolicyRecord> {
  let policy = await repo.getPolicyByCompany(companyId);
  if (!policy) {
    policy = await repo.createPolicy(companyId, {});
  }
  return {
    ...policy,
    lateness_tracking_enabled: policy.lateness_tracking_enabled ?? true,
    late_pay_deduction_enabled: policy.late_pay_deduction_enabled ?? false,
    late_pay_deduction_effective_from: normalizeIsoDateOnly(
      (policy as { late_pay_deduction_effective_from?: string | null })
        .late_pay_deduction_effective_from
    ),
    overnight_shifts_enabled:
      (policy as { overnight_shifts_enabled?: boolean }).overnight_shifts_enabled === true,
    remote_attendance_enabled:
      (policy as { remote_attendance_enabled?: boolean }).remote_attendance_enabled === true,
    business_timezone: normalizeBusinessTimeZone(
      (policy as { business_timezone?: string | null }).business_timezone
    ),
    overtime_policy_mode: normalizeOvertimePolicyMode(
      (policy as { overtime_policy_mode?: unknown }).overtime_policy_mode
    ),
    overtime_compensation_method: normalizeOvertimeCompensationMethod(
      (policy as { overtime_compensation_method?: unknown })
        .overtime_compensation_method
    ),
  };
}

/** Validate overtime_policy_mode when supplied. */
export function validateOvertimePolicyModeInput(
  value: unknown
): { ok: true; mode: ReturnType<typeof normalizeOvertimePolicyMode> } | { ok: false; error: string } {
  if (value === undefined) {
    return { ok: true, mode: normalizeOvertimePolicyMode(undefined) };
  }
  if (!isOvertimePolicyMode(value)) {
    return {
      ok: false,
      error:
        "overtime_policy_mode must be one of: duration, shift_end, greater_of, manual_only, none",
    };
  }
  return { ok: true, mode: value };
}

/** Phase 2: only duration and none may be selected for payroll. */
export function validateOvertimePolicyModeForActivation(
  value: unknown
): { ok: true; mode: ReturnType<typeof normalizeOvertimePolicyMode> } | { ok: false; error: string } {
  const base = validateOvertimePolicyModeInput(value);
  if (!base.ok) return base;
  if (
    (UNSUPPORTED_OVERTIME_POLICY_MODES as readonly string[]).includes(base.mode)
  ) {
    return {
      ok: false,
      error: `${base.mode} overtime policy is not available yet. Choose duration or none.`,
    };
  }
  if (!isActivatedOvertimePolicyMode(base.mode)) {
    return {
      ok: false,
      error: "overtime_policy_mode must be duration or none",
    };
  }
  return base;
}

/** Remote clock-in/out feature flag (default false). */
export async function isRemoteAttendanceEnabled(companyId: string): Promise<boolean> {
  const policy = await getPolicy(companyId);
  return policy.remote_attendance_enabled === true;
}

export async function updatePolicy(
  companyId: string,
  data: UpdatePolicyInput
): Promise<{ data: repo.CompanyPolicyRecord | null; error?: string }> {
  let policy = await repo.getPolicyByCompany(companyId);
  if (!policy) {
    policy = await repo.createPolicy(companyId, {});
  }

  if (
    data.default_daily_hours !== undefined &&
    (data.default_daily_hours < 1 || data.default_daily_hours > 24)
  ) {
    return { data: null, error: "default_daily_hours must be between 1 and 24" };
  }
  if (
    data.overtime_multiplier !== undefined &&
    (data.overtime_multiplier < 1 || data.overtime_multiplier > 3)
  ) {
    return {
      data: null,
      error: "overtime_multiplier must be between 1 and 3",
    };
  }

  let workingWeekdaysPayload: unknown | undefined;
  if (data.working_weekdays !== undefined) {
    workingWeekdaysPayload = normalizeWorkingWeekdays(data.working_weekdays);
  }

  if (data.payroll_enabled !== undefined && typeof data.payroll_enabled !== "boolean") {
    return { data: null, error: "payroll_enabled must be a boolean" };
  }
  if (
    data.lateness_tracking_enabled !== undefined &&
    typeof data.lateness_tracking_enabled !== "boolean"
  ) {
    return { data: null, error: "lateness_tracking_enabled must be a boolean" };
  }
  if (
    data.late_pay_deduction_enabled !== undefined &&
    typeof data.late_pay_deduction_enabled !== "boolean"
  ) {
    return { data: null, error: "late_pay_deduction_enabled must be a boolean" };
  }

  let latePayEffectiveFromPayload: string | null | undefined;
  if (data.late_pay_deduction_effective_from !== undefined) {
    if (data.late_pay_deduction_effective_from === null) {
      latePayEffectiveFromPayload = null;
    } else {
      const normalized = normalizeIsoDateOnly(data.late_pay_deduction_effective_from);
      if (!normalized) {
        return {
          data: null,
          error: "late_pay_deduction_effective_from must be a valid YYYY-MM-DD date or null",
        };
      }
      latePayEffectiveFromPayload = normalized;
    }
  }

  const resultingLatePayEnabled =
    data.late_pay_deduction_enabled !== undefined
      ? data.late_pay_deduction_enabled
      : policy.late_pay_deduction_enabled === true;
  const resultingEffectiveFrom =
    latePayEffectiveFromPayload !== undefined
      ? latePayEffectiveFromPayload
      : normalizeIsoDateOnly(
          (policy as { late_pay_deduction_effective_from?: string | null })
            .late_pay_deduction_effective_from
        );
  if (resultingLatePayEnabled && !resultingEffectiveFrom) {
    return {
      data: null,
      error: "Please choose an Effective Policy Date before enabling Late Pay Deduction.",
    };
  }

  if (
    data.overnight_shifts_enabled !== undefined &&
    typeof data.overnight_shifts_enabled !== "boolean"
  ) {
    return { data: null, error: "overnight_shifts_enabled must be a boolean" };
  }
  if (
    data.remote_attendance_enabled !== undefined &&
    typeof data.remote_attendance_enabled !== "boolean"
  ) {
    return { data: null, error: "remote_attendance_enabled must be a boolean" };
  }

  let businessTimezonePayload: string | undefined;
  if (data.business_timezone !== undefined) {
    if (typeof data.business_timezone !== "string" || !data.business_timezone.trim()) {
      return { data: null, error: "business_timezone must be a non-empty string" };
    }
    businessTimezonePayload = normalizeBusinessTimeZone(data.business_timezone.trim());
  }

  if (
    data.attendance_day_classification_enabled !== undefined &&
    typeof data.attendance_day_classification_enabled !== "boolean"
  ) {
    return { data: null, error: "attendance_day_classification_enabled must be a boolean" };
  }

  const minM =
    data.minimum_minutes_for_counted_day !== undefined
      ? Number(data.minimum_minutes_for_counted_day)
      : undefined;
  const fullM =
    data.full_day_minutes_threshold !== undefined
      ? Number(data.full_day_minutes_threshold)
      : undefined;

  function isIntInRange(v: number, min: number, max: number): boolean {
    return Number.isInteger(v) && v >= min && v <= max;
  }

  if (minM !== undefined && !isIntInRange(minM, 0, 1440)) {
    return { data: null, error: "minimum_minutes_for_counted_day must be an integer 0-1440" };
  }
  if (fullM !== undefined && !isIntInRange(fullM, 0, 1440)) {
    return { data: null, error: "full_day_minutes_threshold must be an integer 0-1440" };
  }

  const effectiveMin = minM !== undefined ? minM : policy.minimum_minutes_for_counted_day;
  const effectiveFull = fullM !== undefined ? fullM : policy.full_day_minutes_threshold;
  if (effectiveFull < effectiveMin) {
    return {
      data: null,
      error: "full_day_minutes_threshold must be greater than or equal to minimum_minutes_for_counted_day",
    };
  }

  let currencyPayload: "GHS" | "USD" | undefined;
  if (data.currency_code !== undefined) {
    currencyPayload = normalizeCurrencyCode(data.currency_code);
    if (!currencyPayload) {
      return { data: null, error: "currency_code must be one of: GHS, USD" };
    }
  }

  if (data.overtime_policy_mode !== undefined) {
    const modeCheck = validateOvertimePolicyModeForActivation(
      data.overtime_policy_mode
    );
    if (!modeCheck.ok) {
      return { data: null, error: modeCheck.error };
    }
  }

  if (
    data.overtime_compensation_method !== undefined &&
    !isOvertimeCompensationMethod(data.overtime_compensation_method)
  ) {
    return {
      data: null,
      error: "overtime_compensation_method must be one of: multiplier, fixed_rate",
    };
  }

  const effectiveCompMethod =
    data.overtime_compensation_method !== undefined
      ? normalizeOvertimeCompensationMethod(data.overtime_compensation_method)
      : normalizeOvertimeCompensationMethod(
          (policy as { overtime_compensation_method?: unknown })
            .overtime_compensation_method
        );

  let fixedOvertimeRatePayload: number | null | undefined;
  if (data.fixed_overtime_hourly_rate !== undefined) {
    if (data.fixed_overtime_hourly_rate === null) {
      fixedOvertimeRatePayload = null;
    } else {
      const parsed = Number(data.fixed_overtime_hourly_rate);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return {
          data: null,
          error: "fixed_overtime_hourly_rate must be greater than 0",
        };
      }
      fixedOvertimeRatePayload = Math.round(parsed * 100) / 100;
    }
  }

  const effectiveFixedRate =
    fixedOvertimeRatePayload !== undefined
      ? fixedOvertimeRatePayload
      : (policy as { fixed_overtime_hourly_rate?: number | null })
          .fixed_overtime_hourly_rate ?? null;

  const fixedRateCheck = validateFixedOvertimeHourlyRateForMode(
    effectiveCompMethod,
    effectiveFixedRate
  );
  if (!fixedRateCheck.ok) {
    return { data: null, error: fixedRateCheck.error };
  }

  const updated = await repo.updatePolicy(companyId, {
    default_daily_hours: data.default_daily_hours,
    overtime_multiplier: data.overtime_multiplier,
    lateness_tracking_enabled: data.lateness_tracking_enabled,
    late_pay_deduction_enabled: data.late_pay_deduction_enabled,
    late_pay_deduction_effective_from: latePayEffectiveFromPayload,
    payroll_enabled: data.payroll_enabled,
    business_timezone: businessTimezonePayload,
    overnight_shifts_enabled: data.overnight_shifts_enabled,
    remote_attendance_enabled: data.remote_attendance_enabled,
    attendance_day_classification_enabled: data.attendance_day_classification_enabled,
    minimum_minutes_for_counted_day: minM,
    full_day_minutes_threshold: fullM,
    currency_code: currencyPayload,
    working_weekdays: workingWeekdaysPayload,
    overtime_policy_mode: data.overtime_policy_mode,
    overtime_compensation_method: data.overtime_compensation_method,
    fixed_overtime_hourly_rate: fixedOvertimeRatePayload,
  });

  if (!updated) {
    return { data: null, error: "Failed to update policy" };
  }
  return { data: updated };
}
