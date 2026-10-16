"use client";

import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { cn } from "@/lib/design-system/cn";
import { modalAnimation, modalBackdrop, modalPresence, motionVariants } from "@/lib/motion";
import { navText } from "@/lib/navigation/navText";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export function Modal({ open, onClose, title, children, footer, size = "md" }: ModalProps) {
  const reduced = useReducedMotion();
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
      const top = dialogs[dialogs.length - 1];
      // Modal root owns role=dialog — only close when this instance is topmost
      if (top && rootRef.current && top !== rootRef.current) return;
      onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <m.div
          ref={rootRef}
          className="fixed inset-0 z-[55] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          variants={modalPresence}
          initial={false}
          animate="visible"
          exit="exit"
        >
          <m.div
            className="absolute inset-0"
            style={{ background: "var(--ds-color-overlay)" }}
            variants={motionVariants(reduced, modalBackdrop)}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            aria-hidden="true"
          />
          <m.div
            className={cn(
              "relative flex max-h-[min(90vh,880px)] w-full flex-col overflow-hidden rounded-xl border",
              sizeClasses[size]
            )}
            style={{
              borderColor: "var(--ds-color-border)",
              background: "var(--ds-color-surface)",
              boxShadow: "var(--ds-shadow-modal)",
            }}
            variants={motionVariants(reduced, modalAnimation)}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div
              className="flex shrink-0 items-center justify-between gap-3 border-b px-5 py-4"
              style={{ borderColor: "var(--ds-color-border)" }}
            >
              <h2 id={titleId} className="ds-h2 text-lg">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="ds-focus-ring rounded-lg p-1.5 transition-colors hover:bg-[var(--ds-color-nav-hover)]"
                style={{
                  color: "var(--ds-color-text-muted)",
                  transitionDuration: "var(--ds-duration-fast)",
                }}
                aria-label={navText("common.close", "Close")}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer ? (
              <div
                className="flex shrink-0 items-center justify-end gap-2 border-t px-5 py-3.5"
                style={{ borderColor: "var(--ds-color-border)" }}
              >
                {footer}
              </div>
            ) : null}
          </m.div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
