"use client";

import { LEAVE_TYPES, compensationLabel, leaveTypeLabel } from "@/lib/leave/leaveTypes";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { DateInput, Select, Textarea } from "@/components/ui/FormControls";
import { Label } from "@/components/ui/Label";
import { translate } from "@/lib/i18n";

export interface RequestLeaveModalProps {
  open: boolean;
  formStart: string;
  formEnd: string;
  formType: string;
  formReason: string;
  formError: string | null;
  formSubmitting: boolean;
  /** Company leave compensation policy keyed by leave_type (paid | unpaid). */
  compensationByType?: Record<string, "paid" | "unpaid">;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormStartChange: (value: string) => void;
  onFormEndChange: (value: string) => void;
  onFormTypeChange: (value: string) => void;
  onFormReasonChange: (value: string) => void;
}

const FORM_ID = "request-leave-form";

export function RequestLeaveModal({
  open,
  formStart,
  formEnd,
  formType,
  formReason,
  formError,
  formSubmitting,
  compensationByType,
  onClose,
  onSubmit,
  onFormStartChange,
  onFormEndChange,
  onFormTypeChange,
  onFormReasonChange,
}: RequestLeaveModalProps) {
  const selectedDefault = LEAVE_TYPES.find((t) => t.value === formType)?.compensation ?? "paid";
  const selectedCompensation =
    compensationByType?.[formType] ?? selectedDefault;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={translate("leave.requestLeave")}
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            className="w-full sm:w-auto"
            onClick={onClose}
            disabled={formSubmitting}
          >
            {translate("common.cancel")}
          </Button>
          <Button type="submit" form={FORM_ID} loading={formSubmitting} className="w-full sm:w-auto">
            {translate("leave.submitRequest")}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit} className="space-y-4">
        {formError ? <Alert variant="error">{formError}</Alert> : null}
        <div className="min-w-0">
          <DateInput
            id="leave-start"
            label={translate("leave.startDate")}
            value={formStart}
            onChange={(e) => onFormStartChange(e.target.value)}
            required
          />
        </div>
        <div className="min-w-0">
          <DateInput
            id="leave-end"
            label={translate("leave.endDate")}
            value={formEnd}
            onChange={(e) => onFormEndChange(e.target.value)}
            required
          />
        </div>
        <div className="min-w-0">
          <Label htmlFor="leave-type">{translate("leave.leaveType")}</Label>
          <Select
            id="leave-type"
            value={formType}
            onChange={(e) => onFormTypeChange(e.target.value)}
            className="mt-1 w-full"
          >
            {LEAVE_TYPES.map((t) => {
              const compensation = compensationByType?.[t.value] ?? t.compensation;
              return (
                <option key={t.value} value={t.value}>
                  {leaveTypeLabel(t.value)} ({compensationLabel(compensation)})
                </option>
              );
            })}
          </Select>
          <p className="mt-1 text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
            {translate("leave.companyDefaultHint", {
              values: { compensation: compensationLabel(selectedCompensation) },
            })}
          </p>
        </div>
        <div className="min-w-0">
          <Label htmlFor="leave-reason">{translate("leave.reasonOptional")}</Label>
          <Textarea
            id="leave-reason"
            value={formReason}
            onChange={(e) => onFormReasonChange(e.target.value)}
            className="mt-1 w-full"
            rows={3}
          />
        </div>
      </form>
    </Modal>
  );
}
