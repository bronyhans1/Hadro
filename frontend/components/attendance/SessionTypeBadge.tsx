import { Badge } from "@/components/ui/Badge";
import { isRemoteSession, remoteApprovalLabel } from "@/lib/attendance/sessionTypeDisplay";
import { translate } from "@/lib/i18n";

type Props = {
  attendanceMode?: string | null;
  remoteApprovalStatus?: string | null;
  className?: string;
};

/** Remote/Onsite chip(s) for attendance history and overview rows. */
export function SessionTypeBadge({
  attendanceMode,
  remoteApprovalStatus,
  className = "",
}: Props) {
  if (!isRemoteSession(attendanceMode)) {
    return (
      <Badge variant="neutral" className={className}>
        {translate("attendance.onsite")}
      </Badge>
    );
  }

  const approval = remoteApprovalLabel(remoteApprovalStatus);
  const approvalVariant =
    approval === "Approved" ? "approved" : approval === "Rejected" ? "rejected" : "pending";
  const approvalText =
    approval === "Approved"
      ? translate("leave.approved")
      : approval === "Rejected"
        ? translate("leave.rejected")
        : approval
          ? translate("leave.pending")
          : null;

  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${className}`}>
      <Badge variant="remote">{translate("attendance.remote")}</Badge>
      {approvalText ? <Badge variant={approvalVariant}>{approvalText}</Badge> : null}
    </span>
  );
}
