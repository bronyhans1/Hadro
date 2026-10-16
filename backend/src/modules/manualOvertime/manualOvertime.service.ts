import * as repo from "./manualOvertime.repository";
import * as payrollRepo from "../payroll/payroll.repository";
import * as companyPolicy from "../companyPolicy/companyPolicy.service";
import * as wageRatesRepo from "../payroll/wageRates.repository";
import * as usersRepo from "../users/users.repository";
import {
  getPayrollDayClassification,
} from "../payroll/payrollLeaveAwareness.service";
import { resolveCompanyTodayIso } from "../payroll/paidLeavePayrollEligibility";
import {
  buildOvertimeCompensationSnapshot,
  computeOvertimePayFromCompensation,
  overtimeCompensationFromPolicy,
} from "../../lib/overtime/overtimeCompensation";
import {
  buildManualOvertimeOverlapSummary,
  evaluateManualOtStackingPolicy,
  type ManualOvertimeOverlapSummary,
} from "./manualOvertimeOverlap";
import {
  normalizeManualOtStackingMode,
  type ManualOvertimeEntryStatus,
} from "../../constants/manualOvertime";
import type { RequestContext } from "../../middleware/context.middleware";
import { assertManualOvertimeTargetAllowed } from "../../lib/manualOvertimeScope";
import { resolveManagerListUserIds } from "../../lib/resolveScopedUserIds";
import { isPayrollRecordProtected } from "../payroll/payrollRecordProtection";
import {
  assertPayrollPeriodEditableForDate,
  PayrollPeriodLockedError,
} from "../payrollPeriod/payrollPeriodEditable";

export type ManualOvertimeEntryDto = {
  id: string;
  user_id: string;
  employee_name: string | null;
  earnings_date: string;
  hours: number;
  reason: string;
  reason_code: string | null;
  status: ManualOvertimeEntryStatus;
  created_by: string;
  created_by_name: string | null;
  approved_by: string | null;
  approved_at: string | null;
  payroll_record_id: string | null;
  overlap_warning_acknowledged: boolean;
  created_at: string;
};

export type OverlapCheckResult = {
  summary: ManualOvertimeOverlapSummary;
  requires_acknowledgment: boolean;
  allowed: boolean;
  error?: string;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function normalizeHours(raw: unknown): number | null {
  if (typeof raw !== "number" || Number.isNaN(raw)) return null;
  if (raw <= 0) return null;
  return Math.round(raw * 100) / 100;
}

function normalizeReason(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  return t.length > 0 ? t : null;
}

function normalizeDate(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const m = raw.trim().slice(0, 10).match(/^\d{4}-\d{2}-\d{2}$/);
  return m ? m[0] : null;
}

async function loadOverlapSummary(
  userId: string,
  companyId: string,
  earningsDate: string,
  proposedHours: number
): Promise<ManualOvertimeOverlapSummary> {
  const [attendance, manual] = await Promise.all([
    repo.sumAttendanceOvertimeMinutesForDate(userId, companyId, earningsDate),
    repo.sumExistingManualOvertimeMinutesForDate(userId, companyId, earningsDate),
  ]);
  return buildManualOvertimeOverlapSummary({
    earningsDate,
    automaticOvertimeMinutes: attendance.totalMinutes,
    existingManualOvertimeMinutes: manual.totalMinutes,
    proposedHours,
    attendanceSessionCount: attendance.sessionCount,
    existingManualEntryCount: manual.entryCount,
  });
}

export async function checkManualOvertimeOverlap(
  companyId: string,
  userId: string,
  earningsDate: string,
  hours: number
): Promise<OverlapCheckResult> {
  const policy = await companyPolicy.getPolicy(companyId);
  const stackingMode = normalizeManualOtStackingMode(
    (policy as { manual_ot_stacking_mode?: unknown }).manual_ot_stacking_mode
  );
  const summary = await loadOverlapSummary(userId, companyId, earningsDate, hours);
  const evaluation = evaluateManualOtStackingPolicy(stackingMode, summary, false);
  return {
    summary,
    requires_acknowledgment: evaluation.requiresAcknowledgment,
    allowed: evaluation.allowed,
    error: evaluation.error,
  };
}

async function enrichEntries(
  entries: repo.ManualOvertimeEntryRecord[],
  companyId: string
): Promise<ManualOvertimeEntryDto[]> {
  const userIds = new Set<string>();
  for (const e of entries) {
    userIds.add(e.user_id);
    userIds.add(e.created_by);
  }
  const nameById = new Map<string, string>();
  for (const uid of userIds) {
    const u = await usersRepo.findByIdAndCompanyId(uid, companyId);
    if (u) {
      nameById.set(
        uid,
        `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email
      );
    }
  }
  return entries.map((e) => ({
    id: e.id,
    user_id: e.user_id,
    employee_name: nameById.get(e.user_id) ?? null,
    earnings_date: e.earnings_date.slice(0, 10),
    hours: e.hours,
    reason: e.reason,
    reason_code: e.reason_code,
    status: e.status,
    created_by: e.created_by,
    created_by_name: nameById.get(e.created_by) ?? null,
    approved_by: e.approved_by,
    approved_at: e.approved_at,
    payroll_record_id: e.payroll_record_id,
    overlap_warning_acknowledged: e.overlap_warning_acknowledged,
    created_at: e.created_at,
  }));
}

export async function listManualOvertimeEntries(
  context: RequestContext,
  companyId: string,
  filters: {
    year: number;
    month: number;
    userId?: string;
    status?: ManualOvertimeEntryStatus;
  }
): Promise<{ entries: ManualOvertimeEntryDto[]; error?: string }> {
  const scope = await resolveManagerListUserIds(context, companyId);
  if (scope.error) {
    return { entries: [], error: scope.error.message };
  }

  if (filters.userId) {
    const gate = await assertManualOvertimeTargetAllowed(
      context,
      companyId,
      filters.userId
    );
    if (!gate.ok) {
      return { entries: [], error: gate.message };
    }
  }

  const entries = await repo.listManualOvertimeEntries({
    companyId,
    year: filters.year,
    month: filters.month,
    userId: filters.userId,
    status: filters.status,
    scopedUserIds: scope.scopedUserIds,
  });

  return { entries: await enrichEntries(entries, companyId) };
}

export async function createManualOvertimeEntry(
  context: RequestContext,
  companyId: string,
  actorId: string,
  input: {
    user_id: string;
    earnings_date: string;
    hours: number;
    reason: string;
    reason_code?: string | null;
    overlap_warning_acknowledged?: boolean;
  }
): Promise<{
  entry: ManualOvertimeEntryDto | null;
  overlap?: ManualOvertimeOverlapSummary;
  error?: string;
  status?: number;
}> {
  if (!(await companyPolicy.isPayrollEnabled(companyId))) {
    return { entry: null, error: "Payroll is disabled for this company", status: 403 };
  }

  const userId = input.user_id?.trim();
  const earningsDate = normalizeDate(input.earnings_date);
  const hours = normalizeHours(input.hours);
  const reason = normalizeReason(input.reason);

  if (!userId) return { entry: null, error: "user_id is required", status: 400 };
  if (!earningsDate) return { entry: null, error: "Invalid earnings_date", status: 400 };
  if (hours == null) return { entry: null, error: "hours must be greater than 0", status: 400 };
  if (!reason) return { entry: null, error: "reason is required", status: 400 };

  try {
    await assertPayrollPeriodEditableForDate(companyId, earningsDate);
  } catch (e) {
    if (e instanceof PayrollPeriodLockedError) {
      return { entry: null, error: e.message, status: 409 };
    }
    throw e;
  }

  const gate = await assertManualOvertimeTargetAllowed(context, companyId, userId);
  if (!gate.ok) {
    return { entry: null, error: gate.message, status: gate.status };
  }

  const policy = await companyPolicy.getPolicy(companyId);
  const todayIso = resolveCompanyTodayIso(policy);
  if (earningsDate > todayIso) {
    return {
      entry: null,
      error: "Manual overtime cannot be created for a future date",
      status: 400,
    };
  }

  const hourlyRate = await wageRatesRepo.getHourlyRate(userId, companyId, earningsDate);
  if (hourlyRate == null || hourlyRate <= 0) {
    return {
      entry: null,
      error: "No active hourly wage rate for this employee on the selected date",
      status: 400,
    };
  }

  const dayCtx = await getPayrollDayClassification(userId, companyId, earningsDate);
  if (dayCtx.coveredByPaidLeave) {
    return {
      entry: null,
      error: "Manual overtime cannot be added on a paid leave day",
      status: 400,
    };
  }
  if (dayCtx.coveredByUnpaidLeave) {
    return {
      entry: null,
      error: "Manual overtime cannot be added on an unpaid leave day",
      status: 400,
    };
  }

  const stackingMode = normalizeManualOtStackingMode(
    (policy as { manual_ot_stacking_mode?: unknown }).manual_ot_stacking_mode
  );
  const summary = await loadOverlapSummary(userId, companyId, earningsDate, hours);
  const ack = input.overlap_warning_acknowledged === true;
  const stacking = evaluateManualOtStackingPolicy(stackingMode, summary, ack);
  if (!stacking.allowed) {
    return {
      entry: null,
      overlap: summary,
      error: stacking.error,
      status: stacking.requiresAcknowledgment ? 409 : 400,
    };
  }

  const compensation = overtimeCompensationFromPolicy(policy);
  const otSnapshot = buildOvertimeCompensationSnapshot(compensation);
  const overtimeMinutes = Math.round(hours * 60);
  const gross = round2(
    computeOvertimePayFromCompensation(overtimeMinutes, hourlyRate, compensation)
  );

  const nowIso = new Date().toISOString();
  let entry: repo.ManualOvertimeEntryRecord | null = null;
  try {
    entry = await repo.insertManualOvertimeEntry({
      company_id: companyId,
      user_id: userId,
      earnings_date: earningsDate,
      hours,
      reason,
      reason_code:
        typeof input.reason_code === "string" && input.reason_code.trim()
          ? input.reason_code.trim()
          : null,
      status: "approved",
      created_by: actorId,
      approved_by: actorId,
      approved_at: nowIso,
      overlap_warning_acknowledged: ack,
    });

    const payrollRow = await payrollRepo.insertManualOvertimePayrollRecord({
      user_id: userId,
      company_id: companyId,
      earnings_date: earningsDate,
      manual_overtime_entry_id: entry.id,
      overtime_minutes: overtimeMinutes,
      hourly_rate: hourlyRate,
      gross_earnings: gross,
      overtime_multiplier_applied: otSnapshot.overtime_multiplier_applied,
      overtime_compensation_method_applied:
        otSnapshot.overtime_compensation_method_applied,
      fixed_overtime_rate_applied: otSnapshot.fixed_overtime_rate_applied,
    });

    entry =
      (await repo.updateManualOvertimeEntryPayrollLink(
        entry.id,
        companyId,
        payrollRow.id
      )) ?? entry;
  } catch (err) {
    if (entry?.id) {
      await repo.deleteManualOvertimeEntry(entry.id, companyId).catch(() => undefined);
    }
    console.error("createManualOvertimeEntry error", err);
    return { entry: null, error: "Failed to create manual overtime entry", status: 500 };
  }

  const [dto] = await enrichEntries([entry], companyId);
  return { entry: dto };
}

export async function cancelManualOvertimeEntry(
  context: RequestContext,
  companyId: string,
  entryId: string
): Promise<{ entry: ManualOvertimeEntryDto | null; error?: string; status?: number }> {
  const existing = await repo.getManualOvertimeEntryById(entryId, companyId);
  if (!existing) {
    return { entry: null, error: "Manual overtime entry not found", status: 404 };
  }

  const gate = await assertManualOvertimeTargetAllowed(
    context,
    companyId,
    existing.user_id
  );
  if (!gate.ok) {
    return { entry: null, error: gate.message, status: gate.status };
  }

  const earningsYmd = existing.earnings_date.slice(0, 10);
  try {
    await assertPayrollPeriodEditableForDate(companyId, earningsYmd);
  } catch (e) {
    if (e instanceof PayrollPeriodLockedError) {
      return { entry: null, error: e.message, status: 409 };
    }
    throw e;
  }

  if (existing.status === "cancelled") {
    return { entry: null, error: "Entry is already cancelled", status: 400 };
  }

  if (existing.payroll_record_id) {
    const payroll = await payrollRepo.getPayrollById(existing.payroll_record_id);
    if (payroll && isPayrollRecordProtected(payroll.status)) {
      return {
        entry: null,
        error: "Cannot cancel manual overtime linked to approved or locked payroll",
        status: 400,
      };
    }
    if (payroll) {
      const deleted = await payrollRepo.deleteDraftManualOvertimePayrollRecord(
        payroll.id,
        companyId
      );
      if (!deleted) {
        return {
          entry: null,
          error: "Cannot cancel: payroll row is not in draft status",
          status: 400,
        };
      }
    }
  }

  const cancelled = await repo.cancelManualOvertimeEntry(entryId, companyId);
  if (!cancelled) {
    return { entry: null, error: "Manual overtime entry not found", status: 404 };
  }

  const [dto] = await enrichEntries([cancelled], companyId);
  return { entry: dto };
}
