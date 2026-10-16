"use client";

import type { BranchDto } from "@/lib/api/branches.api";
import type { Department } from "@/lib/api/departments.api";
import type { EmployeeFilterState } from "@/lib/employees/employeeUtils";
import { FilterCard, FilterGrid } from "@/components/ui/FilterCard";
import { SearchInput, Select } from "@/components/ui/FormControls";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { formatAccountStatusLabel } from "@/lib/format/displayLabels";
import { translate } from "@/lib/i18n";
import { formatRoleLabel } from "@/lib/navigation/formatRoleLabel";

interface EmployeesSearchFiltersProps {
  filters: EmployeeFilterState;
  onChange: (patch: Partial<EmployeeFilterState>) => void;
  onClear: () => void;
  branches: BranchDto[];
  departments: Department[];
  showBranchFilter: boolean;
  resultCount: number;
  totalCount: number;
}

const STATUS_FILTER_VALUES = ["", "active", "inactive", "suspended"] as const;

const ROLE_FILTER_VALUES = ["employee", "manager", "HR", "admin"] as const;

export function EmployeesSearchFilters({
  filters,
  onChange,
  onClear,
  branches,
  departments,
  showBranchFilter,
  resultCount,
  totalCount,
}: EmployeesSearchFiltersProps) {
  const hasFilters =
    filters.search.trim() ||
    filters.branchId ||
    filters.departmentId ||
    filters.status ||
    filters.role;

  return (
    <FilterCard
      title={translate("employees.employeeFilters")}
      actions={
        <p className="text-sm tabular-nums" style={{ color: "var(--ds-color-text-muted)" }}>
          {translate("employees.showingCount", {
            values: { shown: resultCount, total: totalCount },
          })}
        </p>
      }
    >
        <div className="min-w-0">
            <SearchInput
              id="employees-search"
              label={translate("common.search")}
              placeholder={translate("employees.searchPlaceholder")}
              value={filters.search}
              onChange={(e) => onChange({ search: e.target.value })}
              aria-label={translate("employees.searchEmployees")}
            />
        </div>

        <FilterGrid>
          {showBranchFilter ? (
            <div>
              <Label htmlFor="filter-branch">{translate("attendance.branch")}</Label>
              <Select
                id="filter-branch"
                value={filters.branchId}
                onChange={(e) => onChange({ branchId: e.target.value })}
                className="mt-1"
              >
                <option value="">{translate("employees.allBranches")}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}

          <div>
            <Label htmlFor="filter-department">{translate("attendance.department")}</Label>
            <Select
              id="filter-department"
              value={filters.departmentId}
              onChange={(e) => onChange({ departmentId: e.target.value })}
              className="mt-1"
            >
              <option value="">{translate("employees.allDepartments")}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="filter-status">{translate("attendance.status")}</Label>
            <Select
              id="filter-status"
              value={filters.status}
              onChange={(e) => onChange({ status: e.target.value })}
              className="mt-1"
            >
              {STATUS_FILTER_VALUES.map((value) => (
                <option key={value || "all"} value={value}>
                  {value === "" ? translate("employees.allStatuses") : formatAccountStatusLabel(value)}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="filter-role">{translate("employees.role")}</Label>
            <Select
              id="filter-role"
              value={filters.role}
              onChange={(e) => onChange({ role: e.target.value })}
              className="mt-1"
            >
              <option value="">{translate("employees.allRoles")}</option>
              {ROLE_FILTER_VALUES.map((value) => (
                <option key={value} value={value}>
                  {formatRoleLabel(value)}
                </option>
              ))}
            </Select>
          </div>
        </FilterGrid>

        {hasFilters ? (
          <div className="flex justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={onClear}>
              {translate("employees.clearFilters")}
            </Button>
          </div>
        ) : null}
    </FilterCard>
  );
}
