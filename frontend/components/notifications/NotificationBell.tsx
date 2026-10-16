"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BellOff } from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useAuth } from "@/lib/auth/AuthContext";
import { isPlatformAdmin } from "@/lib/auth/roles";
import * as notificationsApi from "@/lib/api/notifications.api";
import { isApiError } from "@/lib/types/api";
import type { NotificationRow } from "@/lib/api/notifications.api";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { safeApi } from "@/lib/api/safeApi";
import { getActiveLocale, translate } from "@/lib/i18n";
import {
  badgePop,
  bellInteraction,
  dropdownAnimation,
  motionVariants,
  transitions,
} from "@/lib/motion";

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(getActiveLocale(), {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatUnreadBadge(count: number): string {
  if (count > 99) return "99+";
  return String(count);
}

export function NotificationBell() {
  const { user } = useAuth();
  const reduced = useReducedMotion();
  const enabled = !!user && !isPlatformAdmin(user.roles);

  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const lastListFetchAtRef = useRef(0);

  const refreshUnread = useCallback(async () => {
    if (!enabled) return;
    try {
      const countRes = await safeApi(notificationsApi.getUnreadCount());
      if (!isApiError(countRes)) setUnread(countRes.data.unread);
    } catch {
      // Session expiry is handled globally; ignore other poll failures.
    }
  }, [enabled]);

  const refreshList = useCallback(async () => {
    if (!enabled) return;
    try {
      const listRes = await safeApi(notificationsApi.listMyNotifications({ page: 1, limit: 15 }));
      if (!isApiError(listRes)) setRows(listRes.data.rows);
    } catch {
      // Session expiry is handled globally; ignore other poll failures.
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void refreshUnread();
    const t = setInterval(() => void refreshUnread(), 60_000);
    return () => clearInterval(t);
  }, [enabled, refreshUnread]);

  useEffect(() => {
    if (!enabled || !open) return;
    setLoading(true);
    const shouldRefreshList = Date.now() - lastListFetchAtRef.current > 30_000;
    const task = shouldRefreshList
      ? refreshList().then(() => {
          lastListFetchAtRef.current = Date.now();
        })
      : refreshUnread();
    void task.finally(() => setLoading(false));
  }, [enabled, open, refreshList, refreshUnread]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!enabled) return null;

  async function handleMarkRead(id: string) {
    await safeApi(notificationsApi.markNotificationRead(id));
    await Promise.all([refreshUnread(), refreshList()]);
    lastListFetchAtRef.current = Date.now();
  }

  async function handleMarkAll() {
    await safeApi(notificationsApi.markAllNotificationsRead());
    await Promise.all([refreshUnread(), refreshList()]);
    lastListFetchAtRef.current = Date.now();
  }

  return (
    <div className="relative" ref={wrapRef}>
      <m.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-[var(--nav-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
        whileHover={reduced ? undefined : bellInteraction.hover}
        whileTap={reduced ? undefined : bellInteraction.tap}
        transition={transitions.fast}
        aria-label={
          unread > 0
            ? translate("notifications.bellAriaUnread", { values: { count: unread } })
            : translate("notifications.title")
        }
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg
          className="h-5 w-5 transition-transform duration-200 group-hover:scale-105"
          style={{ color: "var(--text-primary)" }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        <AnimatePresence mode="popLayout">
          {unread > 0 ? (
          <m.span
            key={unread}
            className="absolute -right-0.5 -top-0.5 flex h-[22px] min-w-[22px] items-center justify-center rounded-full border-2 px-1 ds-caption font-bold leading-none shadow-sm"
            style={{
              background: "var(--ds-color-danger)",
              color: "var(--ds-color-text-inverse)",
              borderColor: "var(--ds-color-surface)",
              boxShadow: "var(--ds-shadow-card)",
            }}
            variants={motionVariants(reduced, badgePop)}
            initial="hidden"
            animate="visible"
            exit="exit"
            aria-hidden
          >
            {formatUnreadBadge(unread)}
          </m.span>
          ) : null}
        </AnimatePresence>
      </m.button>

      <AnimatePresence>
        {open ? (
        <m.div
          className="notification-panel absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden"
          role="region"
          aria-label={translate("notifications.title")}
          variants={motionVariants(reduced, dropdownAnimation)}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div
            className="flex items-center justify-between border-b px-4 py-3"
            style={{ borderColor: "var(--ds-color-border)" }}
          >
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--ds-color-text-primary)" }}>
                {translate("notifications.title")}
              </p>
              <p className="text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
                {translate("notifications.activitySubtitle")}
              </p>
            </div>
            {unread > 0 ? (
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => void handleMarkAll()}
                className="shrink-0"
              >
                {translate("notifications.markAllRead")}
              </Button>
            ) : null}
          </div>

          <div className="max-h-80 overflow-y-auto sidebar-nav-scroll">
            {loading && rows.length === 0 ? (
              <div className="space-y-3 p-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : rows.length === 0 ? (
              <EmptyState
                compact
                title={translate("notifications.noNotifications")}
                description={translate("notifications.emptyDescription")}
                icon={<BellOff className="h-5 w-5" />}
              />
            ) : (
              <ul>
                {rows.map((n) => (
                  <li
                    key={n.id}
                    className={`border-b px-4 py-3 last:border-b-0 ${!n.read_at ? "notification-item-unread" : ""}`}
                    style={{ borderColor: "var(--ds-color-border)" }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "var(--ds-color-text-primary)" }}>
                          {n.title}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--ds-color-text-secondary)" }}>
                          {n.body}
                        </p>
                        <p className="mt-1.5 ds-caption tabular-nums">
                          {formatWhen(n.created_at)}
                        </p>
                      </div>
                      {!n.read_at ? (
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          onClick={() => void handleMarkRead(n.id)}
                          className="shrink-0"
                        >
                          {translate("notifications.read")}
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
