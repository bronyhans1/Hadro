"use client";

import type { ManualOvertimeEntryStatus } from "@/lib/api/manualOvertime.api";
import type { UserListItem } from "@/lib/api/users.api";
import { ResponsiveFilterCard } from "@/components/ui/FilterCard";
import { MonthInput, Select } from "@/components/ui/FormControls";
import { Label } from "@/components/ui/Label";
import { translate } from "@/lib/i18n";

const STATUS_FILTER_VALUES = ["", "approved", "cancelled", "draft", "rejected"] as const;

function statusFilterLabel(value: (typeof STATUS_FILTER_VALUES)[number]): string {
  if (value === "approved") return translate("leave.approved");
  if (value === "cancelled") return translate("leave.cancelled");
  if (value === "draft") return translate("payroll.draft");
  if (value === "rejected") return translate("leave.rejected");
  return translate("employees.allStatuses");
}

interface ManualOvertimeFiltersProps {
  year: number;
  month: number;
  onPeriodChange: (year: number, month: number) => void;
  employeeFilter: string;
  onEmployeeFilterChange: (value: string) => void;
  statusFilter: "" | ManualOvertimeEntryStatus;
  onStatusFilterChange: (value: "" | ManualOvertimeEntryStatus) => void;
  employees: UserListItem[];
}

function FilterFields({
  year,
  month,
  onPeriodChange,
  employeeFilter,
  onEmployeeFilterChange,
  statusFilter,
  onStatusFilterChange,
  employees,
}: ManualOvertimeFiltersProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <MonthInput
          id="mot-period"
          label={translate("payroll.payrollPeriod")}
          value={`${year}-${String(month).padStart(2, "0")}`}
          onChange={(e) => {
            const [y, m] = e.target.value.split("-");
            if (y && m) onPeriodChange(Number(y), Number(m));
          }}
        />
      </div>
      <div>
        <Label htmlFor="mot-employee">{translate("attendance.employee")}</Label>
        <Select
          id="mot-employee"
          value={employeeFilter}
          onChange={(e) => onEmployeeFilterChange(e.target.value)}
          className="mt-1"
        >
          <option value="">{translate("attendance.allEmployees")}</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.first_name} {emp.last_name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="mot-status">{translate("attendance.status")}</Label>
        <Select
          id="mot-status"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as "" | ManualOvertimeEntryStatus)}
          className="mt-1"
        >
          {STATUS_FILTER_VALUES.map((value) => (
            <option key={value || "all"} value={value}>
              {statusFilterLabel(value)}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}

export function ManualOvertimeFilters(props: ManualOvertimeFiltersProps) {
  return (
    <ResponsiveFilterCard mobileId="mot-filters-mobile">
      <FilterFields {...props} />
    </ResponsiveFilterCard>
  );
}
