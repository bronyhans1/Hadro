"use client";

import { ResponsiveFilterCard } from "@/components/ui/FilterCard";
import { Select } from "@/components/ui/FormControls";
import { Label } from "@/components/ui/Label";
import { formatLeaveStatus } from "@/lib/dashboard/formatters";
import { translate } from "@/lib/i18n";

export type LeaveStatusFilter =
  | ""
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "terminated"
  | "completed";

const STATUS_FILTER_VALUES: LeaveStatusFilter[] = [
  "",
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "terminated",
  "completed",
];

interface LeaveRequestsFiltersProps {
  status: LeaveStatusFilter;
  onStatusChange: (value: LeaveStatusFilter) => void;
  showStatusFilter: boolean;
  branchScoped?: boolean;
}

function FilterFields({
  status,
  onStatusChange,
  showStatusFilter,
}: LeaveRequestsFiltersProps) {
  if (!showStatusFilter) {
    return (
      <p className="text-sm" style={{ color: "var(--ds-color-text-muted)" }}>
        {translate("leave.showingAllYourRequests")}
      </p>
    );
  }

  return (
    <div className="max-w-xs">
      <Label htmlFor="leave-req-status">{translate("attendance.status")}</Label>
      <Select
        id="leave-req-status"
        value={status}
        onChange={(e) => onStatusChange(e.target.value as LeaveStatusFilter)}
        className="mt-1"
      >
        {STATUS_FILTER_VALUES.map((value) => (
          <option key={value || "all"} value={value}>
            {value === "" ? translate("leave.all") : formatLeaveStatus(value).label}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function LeaveRequestsFilters(props: LeaveRequestsFiltersProps) {
  const { branchScoped, showStatusFilter } = props;

  return (
    <ResponsiveFilterCard
      mobileId="leave-req-filters-mobile"
      description={
        showStatusFilter && branchScoped
          ? translate("leave.showingBranchRequests")
          : undefined
      }
    >
      <FilterFields {...props} />
    </ResponsiveFilterCard>
  );
}

export { STATUS_FILTER_VALUES as STATUS_OPTIONS };
