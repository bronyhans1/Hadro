import type { RequestContext } from "../middleware/context.middleware";
import * as usersRepo from "../modules/users/users.repository";
import { isBranchScopedManagerRole, isCompanyAdminRole } from "./branchAccess";

export async function assertManualOvertimeTargetAllowed(
  context: RequestContext,
  companyId: string,
  targetUserId: string
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  if (isCompanyAdminRole(context.roles)) {
    const target = await usersRepo.findByIdAndCompanyId(targetUserId, companyId);
    if (!target) {
      return { ok: false, status: 404, message: "User not found" };
    }
    return { ok: true };
  }
  if (!isBranchScopedManagerRole(context.roles)) {
    return {
      ok: false,
      status: 403,
      message: "You do not have permission to manage manual overtime",
    };
  }
  if (!context.branchId) {
    return {
      ok: false,
      status: 403,
      message: "Branch context required for this role",
    };
  }
  const target = await usersRepo.findByIdAndCompanyId(targetUserId, companyId);
  if (!target || target.branch_id !== context.branchId) {
    return { ok: false, status: 404, message: "User not found" };
  }
  return { ok: true };
}
