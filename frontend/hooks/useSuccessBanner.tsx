"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SuccessBanner } from "@/components/ui/SuccessBanner";
import { useToast } from "@/components/ui/ToastProvider";
import { translate } from "@/lib/i18n";

export type SuccessFeedbackInput = {
  title?: string;
  description?: string;
};

const DEFAULT_AUTO_DISMISS_MS = 7000;

type Options = {
  /** Auto-dismiss delay for the inline banner. Default 7000ms. Pass 0 to disable. */
  autoDismissMs?: number;
};

/**
 * Major-action success feedback:
 * - Inline SuccessBanner (no auto-scroll) for users who stay on the form
 * - Floating success toast immediately (viewport-fixed, ~4–5s) so save confirmation
 *   is always visible regardless of scroll position
 */
export function useSuccessBanner(options?: Options) {
  const toast = useToast();
  const autoDismissMs = options?.autoDismissMs ?? DEFAULT_AUTO_DISMISS_MS;
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(() => translate("leave.changesSaved"));
  const [description, setDescription] = useState<string | undefined>(() =>
    translate("common.changesSavedDescription")
  );
  const timerRef = useRef<number | null>(null);

  const clearSuccess = useCallback(() => {
    setOpen(false);
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showSuccess = useCallback(
    (input?: SuccessFeedbackInput | string) => {
      const fallbackTitle = translate("leave.changesSaved");
      const fallbackDescription = translate("common.changesSavedDescription");
      let nextTitle = fallbackTitle;
      let nextDescription: string | undefined = fallbackDescription;

      if (typeof input === "string") {
        nextTitle = fallbackTitle;
        nextDescription = input;
      } else {
        nextTitle = input?.title?.trim() || fallbackTitle;
        nextDescription =
          input?.description === undefined
            ? fallbackDescription
            : input.description || undefined;
      }

      setTitle(nextTitle);
      setDescription(nextDescription);
      setOpen(true);

      // Viewport toast — never depends on scroll position.
      toast.success(nextDescription?.trim() || nextTitle);

      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      if (autoDismissMs > 0) {
        timerRef.current = window.setTimeout(() => {
          setOpen(false);
          timerRef.current = null;
        }, autoDismissMs);
      }
    },
    [autoDismissMs, toast]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const banner = (
    <SuccessBanner
      open={open}
      title={title}
      description={description}
      onDismiss={clearSuccess}
    />
  );

  return {
    open,
    showSuccess,
    clearSuccess,
    /** Ready-to-render banner — place near the Save button / form. */
    banner,
  };
}
