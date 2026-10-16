"use client";

import { useEffect, useState } from "react";
import type { LeaveRequest } from "@/lib/api/leave.api";
import { employeeLeaveName } from "@/lib/leave/leaveOverviewUtils";
import {
  estimateRestoredDaysPreview,
  maxTerminateReturnDateYmd,
} from "@/lib/leave/leaveLifecycle";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { DateInput, Textarea } from "@/components/ui/FormControls";
import { Label } from "@/components/ui/Label";
import { LeaveCompensationDisplay } from "@/components/leave/LeaveCompensationDisplay";
import { LeaveCompensationSummaryCard } from "@/components/leave/LeaveCompensationSummaryCard";
import { compensationLabel, leaveTypeLabel } from "@/lib/leave/leaveTypes";
import { translate } from "@/lib/i18n";

interface LeaveApprovalModalsProps {
  reviewModal: { leave: LeaveRequest; action: "approve" | "reject" } | null;
  cancelModal: LeaveRequest | null;
  terminateModal: LeaveRequest | null;
  terminateReturnDate: string;
  terminateReason: string;
  actionLoading: string | null;
  /** Admin/HR may override compensation before approval. */
  canOverrideCompensation?: boolean;
  reviewCompensation: "paid" | "unpaid";
  reviewOverrideReason: string;
  onReviewCompensationChange: (value: "paid" | "unpaid") => void;
  onReviewOverrideReasonChange: (value: string) => void;
  onCloseReview: () => void;
  onConfirmReview: () => void;
  onCloseCancel: () => void;
  onConfirmCancel: () => void;
  onCloseTerminate: () => void;
  onConfirmTerminate: () => void;
  onTerminateReturnDateChange: (value: string) => void;
  onTerminateReasonChange: (value: string) => void;
}

function normalizeComp(raw: string | null | undefined): "paid" | "unpaid" {
  return (raw ?? "").trim().toLowerCase() === "unpaid" ? "unpaid" : "paid";
}

export function LeaveApprovalModals({
  reviewModal,
  cancelModal,
  terminateModal,
  terminateReturnDate,
  terminateReason,
  actionLoading,
  canOverrideCompensation = false,
  reviewCompensation,
  reviewOverrideReason,
  onReviewCompensationChange,
  onReviewOverrideReasonChange,
  onCloseReview,
  onConfirmReview,
  onCloseCancel,
  onConfirmCancel,
  onCloseTerminate,
  onConfirmTerminate,
  onTerminateReturnDateChange,
  onTerminateReasonChange,
}: LeaveApprovalModalsProps) {
  const terminateRestoredPreview = terminateModal
    ? estimateRestoredDaysPreview(terminateModal, terminateReturnDate)
    : null;

  const companyDefault = reviewModal
    ? normalizeComp(
        reviewModal.leave.leave_compensation_default ??
          reviewModal.leave.leave_compensation_type
      )
    : "paid";
  const overrideApplied = reviewModal
    ? reviewCompensation !== companyDefault
    : false;
  const overrideReasonMissing =
    canOverrideCompensation && overrideApplied && !reviewOverrideReason.trim();

  return (
    <>
      <Modal
        open={reviewModal !== null}
        onClose={onCloseReview}
        title={reviewModal?.action === "approve" ? translate("leave.approveLeaveTitle") : translate("leave.rejectLeaveTitle")}
        footer={
          reviewModal ? (
            <>
              <Button type="button" variant="outline" onClick={onCloseReview} disabled={actionLoading !== null}>
                {translate("common.cancel")}
              </Button>
              <Button
                type="button"
                variant={reviewModal.action === "approve" ? "success" : "danger"}
                loading={actionLoading !== null}
                disabled={overrideReasonMissing}
                onClick={onConfirmReview}
              >
                {reviewModal.action === "approve" ? translate("attendance.approve") : translate("attendance.reject")}
              </Button>
            </>
          ) : null
        }
      >
        {reviewModal ? (
          <div className="space-y-4">
            <div
              className="rounded-xl border p-4 text-sm"
              style={{ borderColor: "var(--ds-color-border)", background: "var(--ds-color-surface-muted)" }}
            >
              <p>
                <span className="font-medium">{translate("leave.employee")}</span> {employeeLeaveName(reviewModal.leave)}
              </p>
              <p className="mt-1">
                <span className="font-medium">{translate("leave.dates")}</span> {reviewModal.leave.start_date} →{" "}
                {reviewModal.leave.end_date} {translate("leave.dayCountInline", { count: reviewModal.leave.total_days })}
              </p>
              <p className="mt-1">
                <span className="font-medium">{translate("leave.leaveTypeColon")}</span>{" "}
                {leaveTypeLabel(reviewModal.leave.leave_type)}
              </p>
              {reviewModal.leave.reason ? (
                <p className="mt-1" style={{ color: "var(--ds-color-text-muted)" }}>
                  <span className="font-medium" style={{ color: "var(--ds-color-text-primary)" }}>
                    {translate("leave.employeeReason")}
                  </span>{" "}
                  {reviewModal.leave.reason}
                </p>
              ) : null}
            </div>

            <LeaveCompensationSummaryCard
              companyDefault={companyDefault}
              currentCompensation={reviewCompensation}
              overrideReason={
                overrideApplied
                  ? reviewOverrideReason.trim() ||
                    reviewModal.leave.leave_override_reason ||
                    null
                  : null
              }
            />

            {canOverrideCompensation ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-theme">{translate("leave.adjustCompensation")}</p>
                  <p className="mt-0.5 text-xs text-theme-muted">
                    {translate("leave.adjustCompensationHint", {
                      values: { compensation: compensationLabel(companyDefault) },
                    })}
                  </p>
                  <div className="mt-2 flex gap-4 text-sm text-theme">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="review-leave-compensation"
                        checked={reviewCompensation === "paid"}
                        disabled={actionLoading !== null}
                        onChange={() => onReviewCompensationChange("paid")}
                      />
                      {translate("leave.paid")}
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="review-leave-compensation"
                        checked={reviewCompensation === "unpaid"}
                        disabled={actionLoading !== null}
                        onChange={() => onReviewCompensationChange("unpaid")}
                      />
                      {translate("leave.unpaid")}
                    </label>
                  </div>
                </div>

                {overrideApplied ? (
                  <div>
                    <Label htmlFor="leave-override-reason">{translate("leave.overrideReason")}</Label>
                    <Textarea
                      id="leave-override-reason"
                      value={reviewOverrideReason}
                      onChange={(e) => onReviewOverrideReasonChange(e.target.value)}
                      rows={3}
                      required
                      disabled={actionLoading !== null}
                      placeholder={translate("leave.overrideReasonPlaceholder")}
                      className="mt-1"
                    />
                    <p className="mt-1 text-xs text-theme-muted">
                      {translate("leave.overrideReasonAudit")}
                    </p>
                    {overrideReasonMissing ? (
                      <p className="mt-1 text-xs" style={{ color: "var(--ds-color-danger-text)" }}>
                        {translate("leave.overrideReasonMissing")}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            <Alert variant={reviewModal.action === "approve" ? "success" : "warning"}>
              {reviewModal.action === "approve"
                ? translate("leave.approveEffect")
                : translate("leave.rejectEffect")}
            </Alert>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={cancelModal !== null}
        onClose={onCloseCancel}
        title={translate("leave.cancelLeaveRequestTitle")}
        footer={
          cancelModal ? (
            <>
              <Button type="button" variant="outline" onClick={onCloseCancel} disabled={actionLoading !== null}>
                {translate("leave.keepRequest")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                loading={actionLoading !== null}
                onClick={onConfirmCancel}
              >
                {translate("leave.cancelLeaveRequest")}
              </Button>
            </>
          ) : null
        }
      >
        {cancelModal ? (
          <div className="space-y-4">
            <div
              className="rounded-xl border p-4 text-sm"
              style={{ borderColor: "var(--ds-color-border)", background: "var(--ds-color-surface-muted)" }}
            >
              <p>
                <span className="font-medium">{translate("leave.dates")}</span> {cancelModal.start_date} → {cancelModal.end_date}
              </p>
              <p className="mt-1">
                <span className="font-medium">{translate("leave.type")}</span> {leaveTypeLabel(cancelModal.leave_type)}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-2">
                <span className="font-medium">{translate("leave.compensationColon")}</span>
                <LeaveCompensationDisplay
                  compensation={cancelModal.leave_compensation_type}
                  overridden={cancelModal.leave_compensation_overridden}
                  variant="employee"
                />
              </p>
            </div>
            <p className="text-sm" style={{ color: "var(--ds-color-text-muted)" }}>
              {translate("leave.cancelPendingAudit")}
            </p>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={terminateModal !== null}
        onClose={onCloseTerminate}
        title={translate("leave.terminateEarlyTitle")}
        footer={
          terminateModal ? (
            <>
              <Button type="button" variant="outline" onClick={onCloseTerminate} disabled={actionLoading !== null}>
                {translate("common.cancel")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                loading={actionLoading !== null}
                onClick={onConfirmTerminate}
              >
                {translate("leave.terminateLeave")}
              </Button>
            </>
          ) : null
        }
      >
        {terminateModal ? (
          <div className="space-y-4">
            <div
              className="rounded-xl border p-4 text-sm"
              style={{ borderColor: "var(--ds-color-border)", background: "var(--ds-color-surface-muted)" }}
            >
              <p>
                <span className="font-medium">{translate("leave.employee")}</span> {employeeLeaveName(terminateModal)}
              </p>
              <p className="mt-1">
                <span className="font-medium">{translate("leave.originalDates")}</span> {terminateModal.start_date} →{" "}
                {terminateModal.end_date}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-2">
                <span className="font-medium">{translate("leave.compensationColon")}</span>
                <LeaveCompensationDisplay
                  compensation={terminateModal.leave_compensation_type}
                  overridden={terminateModal.leave_compensation_overridden}
                  variant="hr"
                />
              </p>
              {terminateModal.leave_override_reason ? (
                <p className="mt-1" style={{ color: "var(--ds-color-text-muted)" }}>
                  <span className="font-medium" style={{ color: "var(--ds-color-text-primary)" }}>
                    {translate("leave.overrideReasonColon")}
                  </span>{" "}
                  {terminateModal.leave_override_reason}
                </p>
              ) : null}
            </div>

            <div>
              <DateInput
                id="terminate-return"
                label={translate("leave.firstDayBack")}
                hint={translate("leave.firstDayBackHint")}
                value={terminateReturnDate}
                min={terminateModal.start_date}
                max={maxTerminateReturnDateYmd(terminateModal.end_date)}
                onChange={(e) => onTerminateReturnDateChange(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="terminate-reason">{translate("leave.reasonOptional")}</Label>
              <Textarea
                id="terminate-reason"
                value={terminateReason}
                onChange={(e) => onTerminateReasonChange(e.target.value)}
                rows={3}
                placeholder={translate("leave.auditNotePlaceholder")}
                className="mt-1"
              />
            </div>

            <p className="text-sm" style={{ color: "var(--ds-color-text-muted)" }}>
              {translate("leave.estimatedRestoredDays")}{" "}
              <span className="font-medium" style={{ color: "var(--ds-color-text-primary)" }}>
                {terminateRestoredPreview === null ? "—" : String(terminateRestoredPreview)}
              </span>
            </p>

            {terminateRestoredPreview === 0 ? (
              <Alert variant="warning">
                {translate("leave.noDaysRestored")}
              </Alert>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </>
  );
}

/** Sync review compensation + override reason when a leave is opened for review. */
export function useReviewCompensationState(
  reviewModal: { leave: LeaveRequest; action: "approve" | "reject" } | null
): {
  reviewCompensation: "paid" | "unpaid";
  setReviewCompensation: (v: "paid" | "unpaid") => void;
  reviewOverrideReason: string;
  setReviewOverrideReason: (v: string) => void;
} {
  const [reviewCompensation, setReviewCompensation] = useState<"paid" | "unpaid">("paid");
  const [reviewOverrideReason, setReviewOverrideReason] = useState("");

  useEffect(() => {
    if (!reviewModal) return;
    setReviewCompensation(normalizeComp(reviewModal.leave.leave_compensation_type));
    setReviewOverrideReason(reviewModal.leave.leave_override_reason?.trim() ?? "");
  }, [reviewModal]);

  return {
    reviewCompensation,
    setReviewCompensation,
    reviewOverrideReason,
    setReviewOverrideReason,
  };
}
