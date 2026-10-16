"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EmployeeAvatar } from "@/components/employees/EmployeeAvatar";
import { accountStatusBadge } from "@/lib/employees/employeeBadges";
import { employeeFullName, employeeRoleLabel } from "@/lib/employees/employeeUtils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { LoadingState } from "@/components/ui/LoadingState";
import * as usersApi from "@/lib/api/users.api";
import type { UserListItem } from "@/lib/api/users.api";
import { isApiError } from "@/lib/types/api";
import { safeApi } from "@/lib/api/safeApi";
import { translate } from "@/lib/i18n";

interface AttendanceEmployeePreviewDrawerProps {
  open: boolean;
  userId: string | null;
  usersById: ReadonlyMap<string, UserListItem>;
  onClose: () => void;
}

export function AttendanceEmployeePreviewDrawer({
  open,
  userId,
  usersById,
  onClose,
}: AttendanceEmployeePreviewDrawerProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserListItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !userId) {
      setUser(null);
      setError(null);
      return;
    }

    const cached = usersById.get(userId);
    if (cached) {
      setUser(cached);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      const res = await safeApi(usersApi.getUserById(userId));
      if (cancelled) return;
      if (isApiError(res)) {
        setError(res.error);
        setUser(null);
      } else {
        setUser(res.data);
        setError(null);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, userId, usersById]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={translate("attendance.employeeProfile")}
      description={translate("attendance.previewFromOverview")}
      size="md"
    >
      {loading ? (
        <LoadingState message={translate("attendance.loadingEmployee")} className="min-h-[140px]" />
      ) : error ? (
        <p className="text-sm" style={{ color: "var(--ds-color-danger-text)" }} role="alert">
          {error}
        </p>
      ) : user ? (
        <div className="space-y-5">
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: "var(--ds-color-border)", background: "var(--ds-color-surface-muted)" }}
          >
            <div className="flex items-center gap-3">
              <EmployeeAvatar user={user} size="lg" />
              <div className="min-w-0">
                <p className="text-base font-semibold" style={{ color: "var(--ds-color-text-primary)" }}>
                  {employeeFullName(user)}
                </p>
                <p className="text-sm" style={{ color: "var(--ds-color-text-muted)" }}>
                  {employeeRoleLabel(user)}
                </p>
              </div>
              <div className="ml-auto">{accountStatusBadge(user.status)}</div>
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              ["Email", user.email],
              [translate("attendance.branch"), user.branch?.name ?? "—"],
              [translate("attendance.department"), user.department?.name ?? "—"],
              ["Phone", user.phone_number ?? "—"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border p-3"
                style={{ borderColor: "var(--ds-color-border)" }}
              >
                <dt className="ds-label">{label}</dt>
                <dd className="mt-1 text-sm" style={{ color: "var(--ds-color-text-primary)" }}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => router.push("/employees")}
          >
            Open full employee profile
          </Button>
        </div>
      ) : (
        <p className="text-sm" style={{ color: "var(--ds-color-text-muted)" }}>
          Employee not found.
        </p>
      )}
    </Drawer>
  );
}
