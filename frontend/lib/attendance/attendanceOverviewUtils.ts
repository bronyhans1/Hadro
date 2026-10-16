import type { UserListItem } from "@/lib/api/users.api";
import type { AppRole } from "@/lib/types/auth";
import { employeeFullName } from "@/lib/employees/employeeUtils";
import { hasRole } from "@/lib/auth/roles";

export function canReviewAttendance(roles: AppRole[] | undefined): boolean {
  return hasRole(roles, ["admin", "manager", "HR"]);
}

export function buildEmployeeMetaById(users: readonly UserListItem[]) {
  const m = new Map<string, { name: string; photoUrl?: string | null; departmentName?: string | null }>();
  for (const u of users) {
    m.set(u.id, {
      name: employeeFullName(u),
      photoUrl: u.profile_photo_url,
      departmentName: u.department?.name ?? null,
    });
  }
  return m;
}

export function buildUsersById(users: readonly UserListItem[]) {
  const m = new Map<string, UserListItem>();
  for (const u of users) {
    m.set(u.id, u);
  }
  return m;
}
