"use client";

import type { ManualOvertimeEntry } from "@/lib/api/manualOvertime.api";
import type { UserListItem } from "@/lib/api/users.api";
import { EmployeeAvatar } from "@/components/employees/EmployeeAvatar";
import { translate } from "@/lib/i18n";

interface ManualOvertimeEmployeeCellProps {
  entry: ManualOvertimeEntry;
  usersById: Map<string, UserListItem>;
}

export function ManualOvertimeEmployeeCell({ entry, usersById }: ManualOvertimeEmployeeCellProps) {
  const name = entry.employee_name?.trim() || translate("attendance.employee");
  const user = usersById.get(entry.user_id);

  if (user) {
    return (
      <div className="flex items-center gap-2.5">
        <EmployeeAvatar user={user} size="sm" />
        <span className="font-medium">{name}</span>
      </div>
    );
  }

  return <span className="font-medium">{name}</span>;
}
