"use client";

import * as manualOvertimeApi from "@/lib/api/manualOvertime.api";
import type { UserListItem } from "@/lib/api/users.api";
import { Modal } from "@/components/ui/Modal";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { DateInput, Input, Select, Textarea } from "@/components/ui/FormControls";
import { Alert } from "@/components/ui/Alert";
import { translate } from "@/lib/i18n";

interface ManualOvertimeModalsProps {
  createOpen: boolean;
  formSubmitting: boolean;
  employeesLoading: boolean;
  hourlyEligibleEmployees: UserListItem[];
  formUserId: string;
  formDate: string;
  formHours: string;
  formReasonCode: string;
  formReason: string;
  formError: string | null;
  overlapModal: { summary: manualOvertimeApi.ManualOvertimeOverlapSummary } | null;
  onCloseCreate: () => void;
  onSubmitCreate: (acknowledgeOverlap: boolean) => void;
  onFormUserIdChange: (value: string) => void;
  onFormDateChange: (value: string) => void;
  onFormHoursChange: (value: string) => void;
  onFormReasonCodeChange: (value: string) => void;
  onFormReasonChange: (value: string) => void;
  onCloseOverlap: () => void;
}

export function ManualOvertimeModals({
  createOpen,
  formSubmitting,
  employeesLoading,
  hourlyEligibleEmployees,
  formUserId,
  formDate,
  formHours,
  formReasonCode,
  formReason,
  formError,
  overlapModal,
  onCloseCreate,
  onSubmitCreate,
  onFormUserIdChange,
  onFormDateChange,
  onFormHoursChange,
  onFormReasonCodeChange,
  onFormReasonChange,
  onCloseOverlap,
}: ManualOvertimeModalsProps) {
  return (
    <>
      <Modal open={createOpen} onClose={onCloseCreate} title={translate("payroll.addManualOvertime")}>
        <div className="space-y-3">
          <p className="text-sm" style={{ color: "var(--ds-color-text-muted)" }}>
            {translate("payroll.manualOtHoursHelp")}
          </p>

          {employeesLoading ? (
            <LoadingState message={translate("payroll.loadingEligibleEmployees")} />
          ) : hourlyEligibleEmployees.length === 0 ? (
            <EmptyState message={translate("payroll.noHourlyEmployees")} />
          ) : (
            <>
              <Select
                label={translate("attendance.employee")}
                value={formUserId}
                onChange={(e) => onFormUserIdChange(e.target.value)}
              >
                  <option value="">{translate("payroll.selectEmployee")}</option>
                  {hourlyEligibleEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </option>
                  ))}
              </Select>
              <DateInput
                label={translate("payroll.date")}
                value={formDate}
                onChange={(e) => onFormDateChange(e.target.value)}
              />
              <Input
                label={translate("payroll.hours")}
                type="number"
                min={0.01}
                step={0.25}
                value={formHours}
                onChange={(e) => onFormHoursChange(e.target.value)}
              />
              <Input
                label={translate("payroll.reasonCodeOptional")}
                value={formReasonCode}
                onChange={(e) => onFormReasonCodeChange(e.target.value)}
                placeholder={translate("payroll.reasonCodeExample")}
              />
              <Textarea
                label={translate("payroll.reasonRequiredLabel")}
                rows={3}
                value={formReason}
                onChange={(e) => onFormReasonChange(e.target.value)}
                placeholder={translate("payroll.manualOtReasonPlaceholder")}
              />
              {formError ? <Alert variant="error">{formError}</Alert> : null}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" size="sm" disabled={formSubmitting} onClick={onCloseCreate}>
                  {translate("common.cancel")}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  loading={formSubmitting}
                  disabled={hourlyEligibleEmployees.length === 0}
                  onClick={() => onSubmitCreate(false)}
                >
                  {translate("payroll.create")}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal open={!!overlapModal} onClose={onCloseOverlap} title={translate("payroll.overlapDetected")}>
        {overlapModal ? (
          <div className="space-y-3 text-sm">
            <p>
              {translate("payroll.overlapAlreadyLead")}{" "}
              <strong>{overlapModal.summary.earnings_date}</strong>.
            </p>
            <ul className="list-disc space-y-1 pl-5" style={{ color: "var(--ds-color-text-muted)" }}>
              <li>
                {translate("payroll.attendanceOtLine", {
                  values: {
                    hours: overlapModal.summary.automatic_overtime_hours,
                    count: overlapModal.summary.attendance_session_count,
                  },
                })}
              </li>
              <li>
                {translate("payroll.existingManualOtLine", {
                  values: {
                    hours: overlapModal.summary.existing_manual_overtime_hours,
                    count: overlapModal.summary.existing_manual_entry_count,
                  },
                })}
              </li>
              <li>
                {translate("payroll.proposedManualOt", { values: { hours: overlapModal.summary.proposed_hours } })}
              </li>
              <li>
                {translate("payroll.combinedOt", { values: { hours: overlapModal.summary.combined_overtime_hours } })}
              </li>
            </ul>
            <p style={{ color: "var(--ds-color-text-muted)" }}>
              {translate("payroll.overlapConfirm")}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={onCloseOverlap}>
                {translate("payroll.goBack")}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={formSubmitting}
                onClick={() => onSubmitCreate(true)}
              >
                {translate("payroll.acknowledgeCreate")}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
