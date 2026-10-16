import { canAccessManagerFeatures, hasRole } from "@/lib/auth/roles";
import type { AppRole } from "@/lib/types/auth";
import { translate } from "@/lib/i18n";

export interface AttendanceQuickAction {
  href: string;
  label: string;
  description: string;
}

export function getAttendanceQuickActions(opts: {
  roles: AppRole[] | undefined;
  canRecordManualAttendance: boolean;
}): AttendanceQuickAction[] {
  const { roles, canRecordManualAttendance } = opts;
  const isManager = canAccessManagerFeatures(roles);
  const isCompanyViewer = hasRole(roles, ["admin", "manager", "HR"]);

  const actions: AttendanceQuickAction[] = [
    {
      href: "/attendance/history",
      label: translate("attendance.attendanceHistory"),
      description: translate("attendance.browseSessionRecords"),
    },
  ];

  if (isManager) {
    actions.push({
      href: "/employees",
      label: translate("employees.title"),
      description: translate("attendance.manageWorkforceProfiles"),
    });
  }

  if (isCompanyViewer) {
    actions.push({
      href: "/attendance/remote-review",
      label: translate("attendance.remoteReview"),
      description: translate("attendance.approveRemoteClockIns"),
    });
    actions.push({
      href: "/attendance/flags",
      label: translate("attendance.attendanceFlags"),
      description: translate("attendance.reviewFlaggedPatterns"),
    });
  }

  if (canRecordManualAttendance) {
    actions.push({
      href: "/attendance/history",
      label: translate("attendance.manualAttendance"),
      description: translate("attendance.recordClockInOrOut"),
    });
  }

  return actions;
}
