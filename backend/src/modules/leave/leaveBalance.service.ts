import * as repo from "./leaveBalance.repository";
import * as usersRepo from "../users/users.repository";
import { normalizeLeaveType, leaveTypeLabel } from "./leaveTypes";

export interface CreateLeaveBalanceInput {
  user_id: string;
  leave_type: string;
  total_days: number;
  /** Ignored — used_days is lifecycle-managed (starts at 0 for new rows). */
  used_days?: number;
}

export interface UpdateLeaveBalanceInput {
  total_days?: number;
  /** Ignored — used_days is lifecycle-managed only. */
  used_days?: number;
}

export interface ServiceResult<T> {
  data: T | null;
  error?: string;
}

export async function getMyLeaveBalances(
  userId: string,
  companyId: string
): Promise<repo.LeaveBalanceRecord[]> {
  return repo.getLeaveBalancesForUser(userId, companyId);
}

export async function getUserLeaveBalances(
  userId: string,
  companyId: string,
  restrictToBranchId?: string
): Promise<ServiceResult<repo.LeaveBalanceRecord[]>> {
  const user = await usersRepo.findByIdAndCompanyId(userId, companyId);
  if (!user) {
    return { data: null, error: "User not found" };
  }
  if (restrictToBranchId && user.branch_id !== restrictToBranchId) {
    return { data: null, error: "User not found" };
  }

  const balances = await repo.getLeaveBalancesForUser(userId, companyId);
  return { data: balances };
}

/** @deprecated Prefer getUserLeaveBalances — returns annual row only if present. */
export async function getUserLeaveBalance(
  userId: string,
  companyId: string,
  restrictToBranchId?: string
): Promise<ServiceResult<repo.LeaveBalanceRecord>> {
  const result = await getUserLeaveBalances(userId, companyId, restrictToBranchId);
  if (result.error) {
    return { data: null, error: result.error };
  }
  const annual =
    result.data?.find((b) => (b.leave_type ?? "").toLowerCase() === "annual") ??
    result.data?.[0] ??
    null;
  return { data: annual };
}

export async function createLeaveBalance(
  userId: string,
  companyId: string,
  data: CreateLeaveBalanceInput,
  restrictToBranchId?: string
): Promise<ServiceResult<repo.LeaveBalanceRecord>> {
  const user = await usersRepo.findByIdAndCompanyId(userId, companyId);
  if (!user) {
    return { data: null, error: "User not found" };
  }
  if (restrictToBranchId && user.branch_id !== restrictToBranchId) {
    return { data: null, error: "User not found" };
  }

  const leaveType = normalizeLeaveType(data.leave_type);
  if (!leaveType) {
    return { data: null, error: "Invalid leave_type" };
  }

  const totalDays = Number(data.total_days);

  if (!Number.isFinite(totalDays) || totalDays < 0) {
    return { data: null, error: "total_days must be >= 0" };
  }

  const existing = await repo.getLeaveBalanceByType(userId, companyId, leaveType);
  if (existing) {
    return updateLeaveBalance(
      existing.id,
      companyId,
      { total_days: totalDays },
      restrictToBranchId
    );
  }

  try {
    const record = await repo.createLeaveBalance({
      user_id: userId,
      company_id: companyId,
      leave_type: leaveType,
      total_days: totalDays,
      used_days: 0,
    });
    return { data: record };
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "23505") {
      const row = await repo.getLeaveBalanceByType(userId, companyId, leaveType);
      if (row) {
        return updateLeaveBalance(
          row.id,
          companyId,
          { total_days: totalDays },
          restrictToBranchId
        );
      }
      return {
        data: null,
        error: `${leaveTypeLabel(leaveType)} leave balance already exists for this user`,
      };
    }
    throw err;
  }
}

export async function updateLeaveBalance(
  balanceId: string,
  companyId: string,
  data: UpdateLeaveBalanceInput,
  restrictToBranchId?: string
): Promise<ServiceResult<repo.LeaveBalanceRecord>> {
  const existing = await repo.getLeaveBalanceById(balanceId, companyId);
  if (!existing) {
    return { data: null, error: "Leave balance not found" };
  }
  if (restrictToBranchId) {
    const owner = await usersRepo.findByIdAndCompanyId(existing.user_id, companyId);
    if (!owner || owner.branch_id !== restrictToBranchId) {
      return { data: null, error: "Leave balance not found" };
    }
  }

  let totalDays = existing.total_days;
  const usedDays = existing.used_days;

  if (data.total_days !== undefined) {
    const v = Number(data.total_days);
    if (!Number.isFinite(v) || v < 0) {
      return { data: null, error: "total_days must be >= 0" };
    }
    totalDays = v;
  }

  if (usedDays > totalDays) {
    return {
      data: null,
      error: "total_days cannot be less than lifecycle-used days",
    };
  }

  const updated = await repo.updateLeaveBalanceById(balanceId, companyId, {
    total_days: totalDays,
  });
  if (!updated) {
    return { data: null, error: "Failed to update leave balance" };
  }
  return { data: updated };
}

export async function getCompanyLeaveBalances(
  companyId: string,
  filterUserIds?: string[] | null
): Promise<repo.LeaveBalanceRecord[]> {
  return repo.getCompanyLeaveBalances(companyId, filterUserIds);
}
