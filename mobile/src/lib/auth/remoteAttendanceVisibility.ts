import type { AuthUser } from "@/types/auth";

/** True when employee may see/use remote clock-in (not clocked in yet). */
export function isRemoteClockInVisible(
  user: AuthUser | null | undefined,
  options?: { hasActiveSession?: boolean }
): boolean {
  if (!user) return false;
  if (options?.hasActiveSession) return false;
  return user.effectiveRemoteAttendanceEnabled === true;
}
