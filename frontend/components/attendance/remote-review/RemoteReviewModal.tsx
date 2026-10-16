"use client";

import type { RemoteSessionRow } from "@/lib/api/remoteAttendance.api";
import { employeeDisplayName } from "@/lib/attendance/remoteReviewUtils";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/FormControls";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { translate } from "@/lib/i18n";

interface RemoteReviewModalProps {
  reviewModal: { row: RemoteSessionRow; action: "approve" | "reject" } | null;
  reviewNote: string;
  actionLoading: boolean;
  formatWhen: (iso: string | null) => string;
  onClose: () => void;
  onNoteChange: (value: string) => void;
  onSubmit: () => void;
}

export function RemoteReviewModal({
  reviewModal,
  reviewNote,
  actionLoading,
  formatWhen,
  onClose,
  onNoteChange,
  onSubmit,
}: RemoteReviewModalProps) {
  const isApprove = reviewModal?.action === "approve";
  const row = reviewModal?.row;

  return (
    <Modal
      open={Boolean(reviewModal)}
      onClose={onClose}
      title={isApprove ? translate("attendance.approveRemoteSession") : translate("attendance.rejectRemoteSession")}
      size="md"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={actionLoading}>
            {translate("common.cancel")}
          </Button>
          <Button
            type="button"
            variant={isApprove ? "success" : "danger"}
            loading={actionLoading}
            onClick={onSubmit}
          >
            {isApprove ? translate("attendance.approve") : translate("attendance.reject")}
          </Button>
        </>
      }
    >
      {row ? (
        <div className="space-y-4">
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: "var(--ds-color-border)", background: "var(--ds-color-surface-muted)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--ds-color-text-primary)" }}>
              {employeeDisplayName(row)}
            </p>
            {row.employee_email ? (
              <p className="mt-0.5 text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
                {row.employee_email}
              </p>
            ) : null}
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="ds-label">{translate("attendance.clockIn")}</dt>
                <dd className="mt-0.5 tabular-nums">{formatWhen(row.check_in)}</dd>
              </div>
              <div>
                <dt className="ds-label">{translate("attendance.attendanceDay")}</dt>
                <dd className="mt-0.5">{row.attendance_date ?? "—"}</dd>
              </div>
              <div>
                <dt className="ds-label">{translate("attendance.branch")}</dt>
                <dd className="mt-0.5">{row.branch_name ?? "—"}</dd>
              </div>
              <div>
                <dt className="ds-label">{translate("attendance.department")}</dt>
                <dd className="mt-0.5">{row.department_name ?? "—"}</dd>
              </div>
            </dl>
            <div className="mt-3">
              <Badge variant="warning">{translate("attendance.pendingApproval")}</Badge>
            </div>
          </div>

          <Alert variant={isApprove ? "success" : "warning"}>
            {isApprove
              ? translate("attendance.approvePayrollNote")
              : translate("attendance.rejectExcludeNote")}
          </Alert>

          <div>
            <Label htmlFor="remote-review-note">{translate("attendance.approvalNoteOptional")}</Label>
            <Textarea
              id="remote-review-note"
              value={reviewNote}
              onChange={(e) => onNoteChange(e.target.value)}
              rows={3}
              placeholder={translate("attendance.decisionPlaceholder")}
              className="mt-1"
            />
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
