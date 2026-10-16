"use client";

import { useCallback, useEffect, useState } from "react";
import * as leaveBalancesApi from "@/lib/api/leaveBalances.api";
import { isApiError } from "@/lib/types/api";
import { LEAVE_TYPES, leaveTypeLabel } from "@/lib/leave/leaveTypes";
import { translate } from "@/lib/i18n";
import { Button } from "@/components/ui";
import { useToast } from "@/components/ui/ToastProvider";
import { useSuccessBanner } from "@/hooks/useSuccessBanner";
import { safeApi } from "@/lib/api/safeApi";
import { toUserFacingApiError } from "@/lib/api/userFacingError";

type Props = {
  userId: string;
};

function findBalanceForType(
  list: leaveBalancesApi.LeaveBalanceRecord[],
  leaveType: string
): leaveBalancesApi.LeaveBalanceRecord | undefined {
  const key = leaveType.trim().toLowerCase();
  return list.find((b) => (b.leave_type ?? "").trim().toLowerCase() === key);
}

function draftsFromBalances(
  list: leaveBalancesApi.LeaveBalanceRecord[]
): Record<string, { allocated: string; used: string }> {
  const next: Record<string, { allocated: string; used: string }> = {};
  for (const t of LEAVE_TYPES) {
    const row = findBalanceForType(list, t.value);
    next[t.value] = {
      allocated: row ? String(row.allocated_days) : "0",
      used: row ? String(row.used_days) : "0",
    };
  }
  return next;
}

function mergeBalanceIntoList(
  list: leaveBalancesApi.LeaveBalanceRecord[],
  saved: leaveBalancesApi.LeaveBalanceRecord
): leaveBalancesApi.LeaveBalanceRecord[] {
  const key = (saved.leave_type ?? "").trim().toLowerCase();
  const without = list.filter((b) => (b.leave_type ?? "").trim().toLowerCase() !== key);
  return [...without, saved].sort((a, b) =>
    a.leave_type_label.localeCompare(b.leave_type_label)
  );
}

export function LeaveBalancesAdminPanel({ userId }: Props) {
  const toast = useToast();
  const success = useSuccessBanner();
  const [balances, setBalances] = useState<leaveBalancesApi.LeaveBalanceRecord[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingType, setSavingType] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { allocated: string; used: string }>>({});

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) {
        setInitialLoading(true);
      }
      setError(null);
      try {
        const res = await safeApi(leaveBalancesApi.getUserLeaveBalances(userId));
        if (isApiError(res)) {
          setBalances([]);
          setError(res.error ?? translate("leave.failedLoadLeaveBalances"));
          return;
        }
        const list = res.data ?? [];
        setBalances(list);
        setDrafts(draftsFromBalances(list));
      } catch (e) {
        setError(e instanceof Error ? e.message : translate("leave.failedLoad"));
        setBalances([]);
      } finally {
        if (!opts?.silent) {
          setInitialLoading(false);
        }
      }
    },
    [userId]
  );

  useEffect(() => {
    void load();
  }, [load]);

  async function saveType(leaveType: string) {
    const d = drafts[leaveType];
    if (!d) return;
    const allocated = Number(d.allocated);
    const row = findBalanceForType(balances, leaveType);
    const usedFromSystem = row?.used_days ?? 0;
    if (!Number.isFinite(allocated) || allocated < 0) {
      toast.error(translate("leave.allocatedMustBeNonNegative"));
      return;
    }
    if (allocated < usedFromSystem) {
      toast.error(translate("leave.allocatedBelowUsed", { values: { used: usedFromSystem } }));
      return;
    }

    setSavingType(leaveType);
    try {
      const existing = row;
      const res = existing
        ? await safeApi(leaveBalancesApi.updateLeaveBalance(existing.id, {
            total_days: allocated,
          }))
        : await safeApi(leaveBalancesApi.createLeaveBalance({
            user_id: userId,
            leave_type: leaveType,
            total_days: allocated,
          }));

      if (isApiError(res)) {
        toast.error(res.error ?? translate("leave.failedToSave"));
        return;
      }
      if (res.data) {
        setBalances((prev) => mergeBalanceIntoList(prev, res.data!));
        setDrafts((prev) => ({
          ...prev,
          [leaveType]: {
            allocated: String(res.data!.allocated_days),
            used: String(res.data!.used_days),
          },
        }));
      }
      success.showSuccess({
        title: translate("leave.changesSaved"),
        description: translate("leave.balanceSaved", { values: { type: leaveTypeLabel(leaveType) } }),
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : translate("leave.failedToSave"));
    } finally {
      setSavingType(null);
    }
  }

  return (
    <>
      {success.banner}
    <div className="rounded-lg border p-3" style={{ borderColor: "var(--border-soft)" }}>
      <p className="ds-caption uppercase tracking-wide">
        {translate("leave.balancesByTypeTitle")}
      </p>
      <p className="mt-1 ds-caption">
        {translate("leave.balancesByTypeHelp")}
      </p>
      {error ? (
        <p className="mt-2 text-sm" style={{ color: "var(--state-error-text)" }}>
          {error}
        </p>
      ) : null}
      {initialLoading ? (
        <p className="mt-2 text-sm text-theme-muted">{translate("common.loadingEllipsis")}</p>
      ) : (
        <div className="mt-3 space-y-3">
          {LEAVE_TYPES.map((t) => {
            const d = drafts[t.value] ?? { allocated: "0", used: "0" };
            const allocN = Number(d.allocated);
            const usedN = Number(d.used);
            const remaining =
              Number.isFinite(allocN) && Number.isFinite(usedN)
                ? Math.max(0, allocN - usedN)
                : "—";
            const rowSaving = savingType === t.value;
            return (
              <div
                key={t.value}
                className="rounded-md border p-2"
                style={{ borderColor: "var(--border-soft)" }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-theme">{leaveTypeLabel(t.value)}</span>
                  <span className="text-xs text-theme-muted">
                    {(t.compensation === "unpaid" ? translate("leave.unpaid") : translate("leave.paid"))} · {translate("leave.remainingInline", { values: { value: remaining } })}
                  </span>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-medium text-theme-muted">{translate("leave.allocated")}</label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={d.allocated}
                      disabled={rowSaving}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [t.value]: { ...d, allocated: e.target.value },
                        }))
                      }
                      className="input-field mt-1 w-full py-1.5 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-theme-muted">{translate("leave.usedSystem")}</label>
                    <input
                      type="number"
                      readOnly
                      tabIndex={-1}
                      value={d.used}
                      aria-readonly
                      title={translate("leave.usedManagedTitle")}
                      className="input-field mt-1 w-full cursor-not-allowed py-1.5 opacity-70"
                      style={{ backgroundColor: "var(--ds-color-surface-muted)" }}
                    />
                    <p className="mt-0.5 ds-caption leading-snug text-theme-muted">
                      {translate("leave.managedByLifecycle")}
                    </p>
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      className="w-full"
                      loading={rowSaving}
                      onClick={() => void saveType(t.value)}
                    >
                      {translate("common.save")}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
    </>
  );
}
