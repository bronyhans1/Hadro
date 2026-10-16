"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { LogOut } from "lucide-react";
import { translate } from "@/lib/i18n";

export const LOGOUT_CONFIRM_TITLE = "Log out?";
export const LOGOUT_CONFIRM_BODY =
  "Are you sure you want to log out? You'll need to sign in again to access your workspace.";

export interface LogoutConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** Optional extra warning (e.g. active clock-in) — reserved for future safeguards. */
  extraMessage?: string;
}

export function LogoutConfirmDialog({
  open,
  onClose,
  onConfirm,
  extraMessage,
}: LogoutConfirmDialogProps) {
  function handleConfirm() {
    onConfirm();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={translate("auth.logOutQuestion")}>
      <div role="alertdialog" aria-describedby="logout-confirm-desc">
        <p id="logout-confirm-desc" className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {translate("auth.logOutBody")}
        </p>
        {extraMessage ? (
          <p
            className="mt-3 rounded-lg border px-3 py-2 text-sm leading-relaxed"
            style={{
              borderColor: "var(--border-soft)",
              background: "var(--surface-muted)",
              color: "var(--text-primary)",
            }}
          >
            {extraMessage}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            autoFocus
          >
            {translate("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirm}
            leftIcon={<LogOut className="h-4 w-4" aria-hidden />}
          >
            {translate("auth.logOut")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
