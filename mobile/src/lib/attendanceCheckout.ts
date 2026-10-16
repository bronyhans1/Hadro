import { isRemoteAttendanceSession } from "@/lib/sessionAttendance";

export type CheckoutRoute = "/attendance/remote-check-out" | "/attendance/check-out";

/** Route for ending the current session — remote sessions never use onsite GPS checkout. */
export function checkoutRouteForSession(
  session: { attendance_mode?: string | null } | null | undefined
): CheckoutRoute {
  return isRemoteAttendanceSession(session)
    ? "/attendance/remote-check-out"
    : "/attendance/check-out";
}
