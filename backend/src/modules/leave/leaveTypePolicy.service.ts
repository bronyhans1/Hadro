import * as repo from "./leaveTypePolicy.repository";
import {
  DEFAULT_LEAVE_COMPENSATION,
  LEAVE_TYPES,
  leaveCompensationForType,
  leaveTypeLabel,
  normalizeLeaveType,
  type LeaveCompensationType,
  type LeaveType,
} from "./leaveTypes";

export type LeaveTypePolicyDto = {
  leave_type: LeaveType;
  label: string;
  compensation_type: LeaveCompensationType;
};

function normalizeCompensation(raw: string | null | undefined): LeaveCompensationType {
  return (raw ?? "").trim().toLowerCase() === "unpaid" ? "unpaid" : "paid";
}

/**
 * Ensure every canonical leave type has a policy row, then return the company catalogue.
 */
export async function listLeaveTypePolicies(
  companyId: string
): Promise<LeaveTypePolicyDto[]> {
  await repo.ensureDefaultPoliciesForCompany(companyId);
  const rows = await repo.listPoliciesForCompany(companyId);
  const byType = new Map(
    rows.map((r) => [r.leave_type.trim().toLowerCase(), normalizeCompensation(r.compensation_type)])
  );

  return LEAVE_TYPES.map((leaveType) => ({
    leave_type: leaveType,
    label: leaveTypeLabel(leaveType),
    compensation_type: byType.get(leaveType) ?? DEFAULT_LEAVE_COMPENSATION[leaveType],
  }));
}

/**
 * Resolve compensation for a NEW leave request from company policy.
 * Falls back to platform defaults if a row is missing (then ensures seed).
 */
export async function resolveLeaveCompensationForCompany(
  companyId: string,
  leaveType: LeaveType
): Promise<LeaveCompensationType> {
  const existing = await repo.getPolicyForLeaveType(companyId, leaveType);
  if (existing) {
    return normalizeCompensation(existing.compensation_type);
  }
  await repo.ensureDefaultPoliciesForCompany(companyId);
  const again = await repo.getPolicyForLeaveType(companyId, leaveType);
  if (again) {
    return normalizeCompensation(again.compensation_type);
  }
  return leaveCompensationForType(leaveType);
}

export async function updateLeaveTypeCompensation(params: {
  companyId: string;
  leaveTypeRaw: string;
  compensationRaw: string;
}): Promise<{ data: LeaveTypePolicyDto | null; error?: string }> {
  const leaveType = normalizeLeaveType(params.leaveTypeRaw);
  if (!leaveType) {
    return { data: null, error: "Invalid leave_type" };
  }
  const compensation = normalizeCompensation(params.compensationRaw);
  // Product default: the dedicated "unpaid" leave type stays unpaid (still stored explicitly).
  const effective: LeaveCompensationType =
    leaveType === "unpaid" ? "unpaid" : compensation;

  await repo.ensureDefaultPoliciesForCompany(params.companyId);
  await repo.upsertPolicy({
    companyId: params.companyId,
    leaveType,
    compensationType: effective,
  });

  return {
    data: {
      leave_type: leaveType,
      label: leaveTypeLabel(leaveType),
      compensation_type: effective,
    },
  };
}

export async function seedLeaveTypePoliciesForNewCompany(
  companyId: string
): Promise<void> {
  await repo.ensureDefaultPoliciesForCompany(companyId);
}
