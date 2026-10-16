"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/FormControls";
import * as attendanceApi from "@/lib/api/attendance.api";
import { isApiError } from "@/lib/types/api";
import type { UserListItem } from "@/lib/api/users.api";
import { MANUAL_ATTENDANCE_REASONS } from "@/lib/attendance/manualAttendance";
import { useToast } from "@/components/ui/ToastProvider";
import * as leaveApi from "@/lib/api/leave.api";
import type { CurrentlyOnLeaveRow } from "@/lib/api/leave.api";
import { safeApi } from "@/lib/api/safeApi";
import { toUserFacingApiError } from "@/lib/api/userFacingError";
import { translate } from "@/lib/i18n";

type Action = "check_in" | "check_out";

export interface ManualAttendanceModalProps {
  open: boolean;
  onClose: () => void;
  employees: UserListItem[];
  /** When set, pre-selects this employee when the modal opens. */
  initialUserId?: string | null;
  onSuccess?: () => void;
}

function fullName(u: UserListItem): string {
  const first = u.first_name?.trim() ?? "";
  const last = u.last_name?.trim() ?? "";
  return [first, last].filter(Boolean).join(" ") || (u.email ?? "—");
}

export function ManualAttendanceModal({
  open,
  onClose,
  employees,
  initialUserId,
  onSuccess,
}: ManualAttendanceModalProps) {
  const toast = useToast();
  const [userId, setUserId] = useState("");
  const [action, setAction] = useState<Action>("check_in");
  const [reason, setReason] = useState(MANUAL_ATTENDANCE_REASONS[0]?.code ?? "missed_scan");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [onLeaveRows, setOnLeaveRows] = useState<CurrentlyOnLeaveRow[]>([]);

  useEffect(() => {
    if (!open) return;
    void leaveApi.getCurrentlyOnLeave().then((res) => {
      if (!isApiError(res)) setOnLeaveRows(res.data ?? []);
    });
  }, [open]);

  const selectedOnLeave =
    userId && action === "check_in"
      ? onLeaveRows.find((r) => r.user_id === userId) ?? null
      : null;

  useEffect(() => {
    if (!open) return;
    setUserId(initialUserId?.trim() ? initialUserId.trim() : "");
    setAction("check_in");
    setReason(MANUAL_ATTENDANCE_REASONS[0]?.code ?? "missed_scan");
    setNote("");
  }, [open, initialUserId]);

  const sorted = useMemo(() => {
    return [...employees].sort((a, b) => fullName(a).localeCompare(fullName(b), undefined, { sensitivity: "base" }));
  }, [employees]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      toast.error(translate("attendance.selectEmployee"));
      return;
    }
    if (reason === "other" && !note.trim()) {
      toast.error(translate("attendance.noteWhenOther"));
      return;
    }
    if (selectedOnLeave) {
      toast.error(translate("attendance.cannotClockInOnLeave", { values: { date: selectedOnLeave.end_date } }));
      return;
    }
    setSubmitting(true);
    try {
      const notePayload = note.trim() ? note.trim() : null;
      const selected = employees.find((x) => x.id === userId);
      if (action === "check_in") {
        const res = await safeApi(attendanceApi.manualClockIn({
          user_id: userId,
          department_id: selected?.department_id ?? undefined,
          reason,
          note: notePayload,
        }));
        if (isApiError(res)) {
          toast.error(res.error ?? translate("attendance.manualClockInFailed"));
          return;
        }
        toast.success(translate("attendance.manualClockInRecorded"));
      } else {
        const res = await safeApi(attendanceApi.manualClockOut({
          user_id: userId,
          reason,
          note: notePayload,
        }));
        if (isApiError(res)) {
          toast.error(res.error ?? translate("attendance.manualClockOutFailed"));
          return;
        }
        toast.success(translate("attendance.manualClockOutRecorded"));
      }
      onSuccess?.();
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : translate("attendance.requestFailed");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={translate("attendance.manualClockInOut")}>
      <form onSubmit={submit} className="space-y-4 p-4">
        <p className="text-sm text-theme-muted">
          {translate("attendance.manualHelp")}
        </p>
        {selectedOnLeave ? (
          <div className="callout-warning text-sm">
            {translate("attendance.onLeaveBlocked", { values: { date: selectedOnLeave.end_date } })}
          </div>
        ) : null}
        <div>
          <label htmlFor="manual-emp" className="mb-1 block text-xs font-medium text-theme">
            {translate("attendance.employee")}
          </label>
          <Select
            id="manual-emp"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          >
            <option value="">{translate("attendance.selectEllipsis")}</option>
            {sorted.map((u) => (
              <option key={u.id} value={u.id}>
                {fullName(u)} — {u.email}
              </option>
            ))}
          </Select>
        </div>
        <fieldset>
          <legend className="mb-2 text-xs font-medium text-theme">{translate("attendance.action")}</legend>
          <div className="flex gap-4 text-sm">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="manual-action"
                checked={action === "check_in"}
                onChange={() => setAction("check_in")}
              />
              {translate("attendance.manualClockIn")}
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="manual-action"
                checked={action === "check_out"}
                onChange={() => setAction("check_out")}
              />
              {translate("attendance.manualClockOut")}
            </label>
          </div>
        </fieldset>
        <div>
          <label htmlFor="manual-reason" className="mb-1 block text-xs font-medium text-theme">
            {translate("attendance.reason")}
          </label>
          <Select
            id="manual-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            {MANUAL_ATTENDANCE_REASONS.map((r) => (
              <option key={r.code} value={r.code}>
                {translate(
                  r.code === "phone_unavailable"
                    ? "attendance.reasonPhoneUnavailable"
                    : r.code === "device_battery_dead"
                      ? "attendance.reasonDeviceBatteryDead"
                      : r.code === "app_or_network_issue"
                        ? "attendance.reasonAppOrNetwork"
                        : r.code === "missed_scan"
                          ? "attendance.reasonMissedScan"
                          : r.code === "supervisor_override"
                            ? "attendance.reasonSupervisorOverride"
                            : "attendance.reasonOther"
                )}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="manual-note" className="mb-1 block text-xs font-medium text-theme">
            {translate("attendance.note")} {reason === "other" ? translate("attendance.requiredParen") : translate("attendance.optionalParen")}
          </label>
          <textarea
            id="manual-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="input-field w-full"
            placeholder={reason === "other" ? translate("attendance.describeSituation") : translate("attendance.optionalContext")}
          />
        </div>
        <div className="flex justify-end gap-2 border-t pt-4" style={{ borderColor: "var(--border-soft)" }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Confirm
          </Button>
        </div>
      </form>
    </Modal>
  );
}
