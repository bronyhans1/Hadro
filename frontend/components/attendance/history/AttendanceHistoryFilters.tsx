"use client";

import type { UserListItem } from "@/lib/api/users.api";
import { ResponsiveFilterCard } from "@/components/ui/FilterCard";
import { DateInput, Select } from "@/components/ui/FormControls";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { translate } from "@/lib/i18n";

interface AttendanceHistoryFiltersProps {
  start: string;
  end: string;
  employeeFilter: string;
  canViewCompany: boolean;
  branchScoped: boolean;
  employees: UserListItem[];
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onEmployeeChange: (value: string) => void;
  onRefresh: () => void;
  loading?: boolean;
}

function FilterFields({
  start,
  end,
  employeeFilter,
  canViewCompany,
  employees,
  onStartChange,
  onEndChange,
  onEmployeeChange,
  onRefresh,
  loading,
}: AttendanceHistoryFiltersProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <DateInput
          id="hist-start"
          label={translate("attendance.fromOptional")}
          value={start}
          onChange={(e) => onStartChange(e.target.value)}
        />
      </div>
      <div>
        <DateInput
          id="hist-end"
          label={translate("attendance.toOptional")}
          value={end}
          onChange={(e) => onEndChange(e.target.value)}
        />
      </div>
      {canViewCompany ? (
        <div>
          <Label htmlFor="hist-emp">{translate("attendance.employee")}</Label>
          <Select
            id="hist-emp"
            value={employeeFilter}
            onChange={(e) => onEmployeeChange(e.target.value)}
            className="mt-1"
          >
            <option value="">{translate("attendance.allEmployees")}</option>
            {employees.map((u) => (
              <option key={u.id} value={u.id}>
                {[u.first_name, u.last_name].filter(Boolean).join(" ") || u.email}
              </option>
            ))}
          </Select>
        </div>
      ) : null}
      <div className="flex items-end">
        <Button type="button" variant="secondary" onClick={onRefresh} loading={loading} className="w-full sm:w-auto">
          {translate("attendance.refresh")}
        </Button>
      </div>
    </div>
  );
}

export function AttendanceHistoryFilters(props: AttendanceHistoryFiltersProps) {
  const { branchScoped, canViewCompany } = props;

  const helperText = canViewCompany
    ? branchScoped
      ? translate("attendance.officeSessionsHint")
      : translate("attendance.companySessionsHint")
    : translate("attendance.yourSessionsHint");

  return (
    <ResponsiveFilterCard
      mobileId="history-filters-mobile"
      description={<>{helperText} {translate("attendance.historyDefaultRange")}</>}
    >
      <FilterFields {...props} />
    </ResponsiveFilterCard>
  );
}
