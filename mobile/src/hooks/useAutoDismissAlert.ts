import { useCallback, useEffect, useRef, useState } from "react";

/** Default auto-dismiss delay for transient inline alerts (4–6s range). */
export const TRANSIENT_ALERT_MS = 5000;

/**
 * Holds a short-lived alert string. Each `show` call resets the dismiss timer.
 * Use for validation errors, load failures, and other non-persistent messages.
 */
export function useAutoDismissAlert(durationMs = TRANSIENT_ALERT_MS) {
  const [alert, setAlert] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setAlert(null);
  }, []);

  const show = useCallback(
    (message: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setAlert(message);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setAlert(null);
      }, durationMs);
    },
    [durationMs]
  );

  useEffect(() => () => clear(), [clear]);

  return { alert, show, clear };
}

/**
 * Shows `source` as a transient alert when it becomes non-null, then auto-dismisses.
 * Does not re-show when `source` is unchanged (e.g. after navigating back to the screen).
 */
export function useTransientQueryError(source: string | null, durationMs = TRANSIENT_ALERT_MS) {
  const { alert, show, clear } = useAutoDismissAlert(durationMs);
  const lastShownRef = useRef<string | null>(null);

  useEffect(() => {
    if (!source) {
      lastShownRef.current = null;
      clear();
      return;
    }
    if (source === lastShownRef.current) return;
    lastShownRef.current = source;
    show(source);
  }, [source, show, clear]);

  return { alert, clear };
}
