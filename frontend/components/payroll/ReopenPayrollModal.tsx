"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { Modal } from "@/components/ui/Modal";
import { Select, Textarea } from "@/components/ui/FormControls";
import type { PayrollReopenReasonCode } from "@/lib/payroll/payrollReopenReasons";
import {
  PAYROLL_REOPEN_EXPLANATION_MIN_LENGTH,
  PAYROLL_REOPEN_REASON_CODES,
} from "@/lib/payroll/payrollReopenReasons";
import { translate } from "@/lib/i18n";

type ReopenPayrollModalProps = {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: { reason_code: PayrollReopenReasonCode; explanation: string }) => void;
};

export function ReopenPayrollModal({
  open,
  loading,
  onClose,
  onSubmit,
}: ReopenPayrollModalProps) {
  const [reasonCode, setReasonCode] = useState<PayrollReopenReasonCode | "">("");
  const [explanation, setExplanation] = useState("");

  useEffect(() => {
    if (!open) return;
    setReasonCode("");
    setExplanation("");
  }, [open]);

  const trimmedExplanation = explanation.trim();
  const canSubmit = useMemo(
    () =>
      Boolean(reasonCode) &&
      trimmedExplanation.length >= PAYROLL_REOPEN_EXPLANATION_MIN_LENGTH &&
      !loading,
    [reasonCode, trimmedExplanation.length, loading]
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={translate("payroll.reopenPayroll")}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={onClose}
            disabled={loading}
          >
            {translate("common.cancel")}
          </Button>
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={!canSubmit}
            loading={loading}
            onClick={() => {
              if (!reasonCode) return;
              onSubmit({ reason_code: reasonCode, explanation: trimmedExplanation });
            }}
          >
            {translate("payroll.confirmReopen")}
          </Button>
        </>
      }
    >
      <p className="text-sm" style={{ color: "var(--ds-color-text-muted)" }}>
        {translate("payroll.reopenIntro")}
      </p>

      <div className="mt-4 space-y-4">
        <div className="min-w-0">
          <Select
            id="reopen-reason"
            label={translate("leave.reason")}
            value={reasonCode}
            onChange={(e) => setReasonCode(e.target.value as PayrollReopenReasonCode)}
            className="w-full"
          >
            <option value="">{translate("payroll.selectAReason")}</option>
            {PAYROLL_REOPEN_REASON_CODES.map((value) => (
              <option key={value} value={value}>
                {translate(`payroll.reopenReasons.${value}`)}
              </option>
            ))}
          </Select>
        </div>

        <div className="min-w-0">
          <Textarea
            id="reopen-explanation"
            label={translate("payroll.explanation")}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={4}
            maxLength={1000}
            className="w-full"
            placeholder={translate("payroll.minimumCharacters", {
              values: { count: PAYROLL_REOPEN_EXPLANATION_MIN_LENGTH },
            })}
          />
          <p className="mt-1 text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
            {translate("payroll.explanationProgress", {
              values: {
                current: trimmedExplanation.length,
                minimum: PAYROLL_REOPEN_EXPLANATION_MIN_LENGTH,
              },
            })}
          </p>
        </div>
      </div>
    </Modal>
  );
}
