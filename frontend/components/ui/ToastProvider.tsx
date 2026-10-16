"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, Info, TriangleAlert, X } from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { motionVariants, toastAnimation } from "@/lib/motion";
import { navText } from "@/lib/navigation/navText";

type ToastKind = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  /** Minor actions only (copy, toggle, quick prefs). Major saves should use SuccessBanner. */
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4500;

function toastColors(kind: ToastKind): { bg: string; border: string; text: string; icon: string } {
  if (kind === "success") {
    return {
      bg: "var(--ds-color-success-subtle)",
      border: "var(--ds-color-success-border)",
      text: "var(--ds-color-text-primary)",
      icon: "var(--ds-color-success-text)",
    };
  }
  if (kind === "warning") {
    return {
      bg: "var(--ds-color-warning-subtle)",
      border: "var(--ds-color-warning-border)",
      text: "var(--ds-color-text-primary)",
      icon: "var(--ds-color-warning-text)",
    };
  }
  if (kind === "info") {
    return {
      bg: "var(--ds-color-primary-subtle)",
      border: "color-mix(in srgb, var(--ds-color-primary) 40%, var(--ds-color-border))",
      text: "var(--ds-color-text-primary)",
      icon: "var(--ds-color-primary)",
    };
  }
  return {
    bg: "var(--ds-color-danger-subtle)",
    border: "var(--ds-color-danger-border)",
    text: "var(--ds-color-text-primary)",
    icon: "var(--ds-color-danger-text)",
  };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const reduced = useReducedMotion();

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev, { id, kind, message }]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (message: string) => push("success", message),
      error: (message: string) => {
        // Session expiry redirects to Login; never surface technical auth errors as toasts.
        if (
          /unauthorized|invalid\s+token|token\s+expired|session\s+expired|authentication\s+failed/i.test(
            message
          )
        ) {
          return;
        }
        push("error", message);
      },
      warning: (message: string) => push("warning", message),
      info: (message: string) => push("info", message),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Viewport-fixed: visible without scrolling (minor actions). */}
      <div
        className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex w-full flex-col items-center gap-2 px-3 sm:inset-x-auto sm:right-4 sm:top-4 sm:items-end sm:px-0 sm:max-w-sm"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const colors = toastColors(toast.kind);
            const Icon =
              toast.kind === "success"
                ? CheckCircle2
                : toast.kind === "warning"
                  ? TriangleAlert
                  : toast.kind === "info"
                    ? Info
                    : CircleAlert;
            return (
              <m.div
                key={toast.id}
                className="pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm shadow-lg backdrop-blur-[2px] sm:w-auto"
                style={{
                  background: colors.bg,
                  borderColor: colors.border,
                  color: colors.text,
                  boxShadow: "var(--shadow-soft)",
                }}
                variants={motionVariants(reduced, toastAnimation)}
                initial="hidden"
                animate="visible"
                exit="exit"
                role="status"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: colors.icon }} aria-hidden />
                <span className="min-w-0 flex-1">{toast.message}</span>
                <button
                  type="button"
                  className="shrink-0 rounded-md p-0.5 opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
                  aria-label={navText("common.dismissNotification", "Dismiss notification")}
                  onClick={() => dismiss(toast.id)}
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </m.div>
            );
          })}
        </AnimatePresence>
      </div>
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
