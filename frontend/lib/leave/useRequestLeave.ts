"use client";

import { useCallback, useState } from "react";
import * as leaveApi from "@/lib/api/leave.api";
import { isApiError } from "@/lib/types/api";
import { safeApi } from "@/lib/api/safeApi";
import { translate } from "@/lib/i18n";

export function useRequestLeave(onSuccess?: () => void | Promise<void>) {
  const [open, setOpen] = useState(false);
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formType, setFormType] = useState("annual");
  const [formReason, setFormReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const openRequestLeave = useCallback(() => {
    setFormError(null);
    setOpen(true);
  }, []);

  const closeRequestLeave = useCallback(() => {
    setOpen(false);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);
      const start = formStart.trim();
      const end = formEnd.trim();
      const leaveType = formType.trim();
      if (!start || !end || !leaveType) {
        setFormError(translate("leave.datesRequired"));
        return;
      }
      setFormSubmitting(true);
      try {
        const res = await safeApi(leaveApi.requestLeave({
          start_date: start,
          end_date: end,
          leave_type: leaveType,
          reason: formReason.trim() || undefined,
        }));
        if (isApiError(res)) {
          setFormError(res.error ?? translate("leave.failedSubmitLeave"));
          return;
        }
        setOpen(false);
        setFormStart("");
        setFormEnd("");
        setFormReason("");
        await onSuccess?.();
      } catch (err) {
        setFormError(err instanceof Error ? err.message : translate("leave.failedSubmit"));
      } finally {
        setFormSubmitting(false);
      }
    },
    [formStart, formEnd, formType, formReason, onSuccess]
  );

  return {
    open,
    openRequestLeave,
    closeRequestLeave,
    formStart,
    formEnd,
    formType,
    formReason,
    formError,
    formSubmitting,
    setFormStart,
    setFormEnd,
    setFormType,
    setFormReason,
    handleSubmit,
  };
}
