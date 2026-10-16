"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import * as platformApi from "@/lib/api/platform.api";
import type { PlatformNotification } from "@/lib/api/onboarding.api";
import { isApiError } from "@/lib/types/api";
import { safeApi } from "@/lib/api/safeApi";
import { getActiveLocale, translate } from "@/lib/i18n";

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

/** Platform-admin notification bell — onboarding and platform alerts. */
export function PlatformNotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [rows, setRows] = useState<PlatformNotification[]>([]);

  const refresh = useCallback(async () => {
    const [countRes, listRes] = await Promise.all([
      safeApi(platformApi.getPlatformUnreadCount()),
      safeApi(platformApi.getPlatformNotifications({ page: 1, limit: 10 })),
    ]);
    if (!isApiError(countRes)) setUnread(countRes.data?.count ?? 0);
    if (!isApiError(listRes)) setRows(listRes.data?.rows ?? []);
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 60_000);
    return () => clearInterval(t);
  }, [refresh]);

  async function markRead(id: string) {
    await safeApi(platformApi.markPlatformNotificationRead(id));
    await refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="app-header-icon-btn ds-focus-ring"
        aria-label={translate("notifications.platformAria")}
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) void refresh();
        }}
      >
        <Bell className="h-5 w-5" aria-hidden />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--ds-color-danger)] px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label={translate("notifications.closePanel")}
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border p-2 shadow-lg"
            style={{ borderColor: "var(--border-soft)", background: "var(--surface)" }}
          >
            <div className="flex items-center justify-between px-2 py-1">
              <p className="text-sm font-semibold">{translate("notifications.platformAlerts")}</p>
              <Link
                href="/platform/onboarding"
                className="text-xs font-semibold text-[var(--ds-color-primary)]"
                onClick={() => setOpen(false)}
              >
                {translate("notifications.onboardingRequestsLink")}
              </Link>
            </div>
            <ul className="max-h-72 overflow-y-auto">
              {rows.length === 0 ? (
                <li className="px-2 py-6 text-center text-sm text-theme-muted">{translate("notifications.noneYet")}</li>
              ) : (
                rows.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      className="w-full rounded-lg px-2 py-2 text-left transition-colors hover:bg-[var(--nav-hover)]"
                      onClick={() => {
                        void markRead(n.id);
                        setOpen(false);
                      }}
                    >
                      <p className="text-sm font-semibold">{n.title}</p>
                      <p className="mt-0.5 text-xs text-theme-muted">{n.body}</p>
                      <p className="mt-1 text-[10px] text-theme-muted">{formatWhen(n.created_at)}</p>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}
