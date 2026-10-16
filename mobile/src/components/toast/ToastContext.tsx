import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ToastHost } from "./ToastHost";
import type { ShowToastOptions, ToastItem } from "./types";

const DEFAULT_DURATION_MS = 5000;

type ToastContextValue = {
  show: (options: ShowToastOptions) => void;
  dismiss: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<ToastItem[]>([]);
  const [active, setActive] = useState<ToastItem | null>(null);
  const idRef = useRef(0);

  const dismiss = useCallback(() => {
    setActive(null);
  }, []);

  const show = useCallback((options: ShowToastOptions) => {
    const id = `toast-${++idRef.current}`;
    const item: ToastItem = {
      id,
      message: options.message,
      subtitle: options.subtitle,
      variant: options.variant ?? "success",
      durationMs: options.durationMs ?? DEFAULT_DURATION_MS,
    };
    setQueue((prev) => [...prev, item]);
  }, []);

  useEffect(() => {
    if (active || queue.length === 0) return;
    setActive(queue[0] ?? null);
    setQueue((prev) => prev.slice(1));
  }, [active, queue]);

  const value = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastHost item={active} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
