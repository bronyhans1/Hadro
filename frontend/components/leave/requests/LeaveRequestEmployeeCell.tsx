"use client";

import type { LeaveRequest } from "@/lib/api/leave.api";
import type { UserListItem } from "@/lib/api/users.api";
import { EmployeeAvatar } from "@/components/employees/EmployeeAvatar";
import { EmployeeInsightCell } from "@/components/attendance/insights/EmployeeInsightCell";
import { employeeLeaveName } from "@/lib/leave/leaveOverviewUtils";

interface LeaveRequestEmployeeCellProps {
  row: LeaveRequest;
  usersById: Map<string, UserListItem>;
}

export function LeaveRequestEmployeeCell({ row, usersById }: LeaveRequestEmployeeCellProps) {
  const name = employeeLeaveName(row);
  const user = usersById.get(row.user_id);

  if (user) {
    return (
      <div className="flex items-center gap-2.5">
        <EmployeeAvatar user={user} size="sm" />
        <span className="font-medium">{name}</span>
      </div>
    );
  }

  return <EmployeeInsightCell name={name} />;
}
