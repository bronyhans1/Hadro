import type { UserListItem } from "@/lib/api/users.api";
import { formatRolesList } from "@/lib/navigation/formatRoleLabel";

export function employeeFullName(row: UserListItem): string {
  const first = row.first_name?.trim() ?? "";
  const last = row.last_name?.trim() ?? "";
  return [first, last].filter(Boolean).join(" ") || "—";
}

export function employeeInitials(row: UserListItem): string {
  const name = employeeFullName(row);
  if (name === "—") return (row.email?.[0] ?? "U").toUpperCase();
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function employeeRoleLabel(row: UserListItem): string {
  if (!row.roles?.length) return "—";
  return formatRolesList(row.roles, ", ");
}

export interface EmployeeFilterState {
  search: string;
  branchId: string;
  departmentId: string;
  status: string;
  role: string;
}

export const EMPTY_EMPLOYEE_FILTERS: EmployeeFilterState = {
  search: "",
  branchId: "",
  departmentId: "",
  status: "",
  role: "",
};

export function filterEmployees(users: UserListItem[], filters: EmployeeFilterState): UserListItem[] {
  let result = users;

  const q = filters.search.trim().toLowerCase();
  if (q) {
    result = result.filter(
      (u) =>
        employeeFullName(u).toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
    );
  }

  if (filters.branchId) {
    result = result.filter((u) => u.branch_id === filters.branchId);
  }

  if (filters.departmentId) {
    result = result.filter((u) => u.department_id === filters.departmentId);
  }

  if (filters.status) {
    result = result.filter((u) => u.status === filters.status);
  }

  if (filters.role) {
    result = result.filter((u) => u.roles?.includes(filters.role));
  }

  return result;
}

export interface EmployeeSummaryStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  departmentCount: number;
  branchCount: number;
}

export function computeEmployeeSummary(
  users: UserListItem[],
  departments: { id: string }[],
  branches: { id: string }[]
): EmployeeSummaryStats {
  return {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    inactive: users.filter((u) => u.status === "inactive").length,
    suspended: users.filter((u) => u.status === "suspended").length,
    departmentCount: departments.length,
    branchCount: branches.length,
  };
}

export function hasActiveEmployeeFilters(filters: EmployeeFilterState): boolean {
  return Boolean(
    filters.search.trim() ||
      filters.branchId ||
      filters.departmentId ||
      filters.status ||
      filters.role
  );
}
