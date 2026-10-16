"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PayrollSection } from "@/components/payroll/PayrollSection";
import * as leaveTypePoliciesApi from "@/lib/api/leaveTypePolicies.api";
import type { LeaveTypePolicy } from "@/lib/api/leaveTypePolicies.api";
import { safeApi } from "@/lib/api/safeApi";
import { isApiError } from "@/lib/types/api";
import { useToast } from "@/components/ui/ToastProvider";
import { useSuccessBanner } from "@/hooks/useSuccessBanner";
import { leaveTypeLabel } from "@/lib/leave/leaveTypes";
import { translate } from "@/lib/i18n";

const helper = () => translate("leave.compensationPolicyHelper");

type Props = {
  canEdit: boolean;
};

export function LeaveTypeCompensationSection({ canEdit }: Props) {
  const toast = useToast();
  const success = useSuccessBanner();
  const [policies, setPolicies] = useState<LeaveTypePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await safeApi(leaveTypePoliciesApi.listLeaveTypePolicies());
      if (isApiError(res)) {
        setError(res.error ?? translate("leave.failedLoadPolicies"));
        setPolicies([]);
        return;
      }
      setPolicies(res.data ?? []);
    } catch {
      setError(translate("leave.failedLoadPolicies"));
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateCompensation = async (
    leaveType: string,
    compensation_type: "paid" | "unpaid"
  ) => {
    if (!canEdit) return;
    setSavingType(leaveType);
    try {
      const res = await safeApi(
        leaveTypePoliciesApi.updateLeaveTypePolicy(leaveType, compensation_type)
      );
      if (isApiError(res)) {
        toast.error(res.error ?? translate("leave.failedUpdateCompensation"));
        return;
      }
      const updated = res.data;
      if (updated) {
        setPolicies((prev) =>
          prev.map((p) => (p.leave_type === updated.leave_type ? updated : p))
        );
      }
      success.showSuccess({
        title: translate("leave.changesSaved"),
        description: translate("leave.compensationSetTo", {
          values: { name: updated?.label ?? leaveType, compensation: compensation_type },
        }),
      });
    } catch {
      toast.error(translate("leave.failedUpdateCompensation"));
    } finally {
      setSavingType(null);
    }
  };

  return (
    <PayrollSection title={translate("leave.leaveTypeCompensation")}>
      <Card>
        <div className="space-y-4">
          {success.banner}
          <p className="text-xs text-theme-muted">{helper()}</p>
          <p className="text-xs text-theme-muted">
            {translate("leave.paidLeavePayrollNote")}
          </p>

          {error ? <div className="alert-error px-3 py-2 text-sm">{error}</div> : null}

          {loading ? (
            <p className="text-sm text-theme-muted">{translate("leave.loadingLeaveTypes")}</p>
          ) : (
            <ul
              className="divide-y divide-[color:var(--border-soft)] rounded-md border"
              style={{ borderColor: "var(--border-soft)", background: "var(--surface)" }}
            >
              {policies.map((p) => {
                const lockedUnpaid = p.leave_type === "unpaid";
                const busy = savingType === p.leave_type;
                return (
                  <li
                    key={p.leave_type}
                    className="flex flex-wrap items-center justify-between gap-3 px-3 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-theme">{leaveTypeLabel(p.leave_type, p.label)}</p>
                      <p className="text-xs text-theme-muted">{translate("leave.compensation")}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-theme">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`leave-comp-${p.leave_type}`}
                          checked={p.compensation_type === "paid"}
                          disabled={!canEdit || lockedUnpaid || busy}
                          onChange={() => void updateCompensation(p.leave_type, "paid")}
                        />
                        {translate("leave.paid")}
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`leave-comp-${p.leave_type}`}
                          checked={p.compensation_type === "unpaid"}
                          disabled={!canEdit || busy}
                          onChange={() => void updateCompensation(p.leave_type, "unpaid")}
                        />
                        {translate("leave.unpaid")}
                      </label>
                      {busy ? (
                        <span className="text-xs text-theme-muted">{translate("leave.saving")}</span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {!canEdit ? (
            <p className="text-xs text-theme-muted">
              {translate("leave.onlyAdminHrPolicy")}
            </p>
          ) : null}

          {canEdit ? (
            <div className="flex justify-end">
              <Button type="button" size="sm" variant="ghost" onClick={() => void load()}>
                {translate("leave.refresh")}
              </Button>
            </div>
          ) : null}
        </div>
      </Card>
    </PayrollSection>
  );
}
