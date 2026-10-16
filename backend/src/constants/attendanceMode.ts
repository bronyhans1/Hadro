export const AttendanceMode = {
  ONSITE: "onsite",
  REMOTE: "remote",
} as const;

export type AttendanceModeValue =
  (typeof AttendanceMode)[keyof typeof AttendanceMode];

export function normalizeAttendanceMode(raw: unknown): AttendanceModeValue {
  if (raw === AttendanceMode.REMOTE) return AttendanceMode.REMOTE;
  return AttendanceMode.ONSITE;
}

export function isRemoteAttendanceMode(raw: unknown): boolean {
  return normalizeAttendanceMode(raw) === AttendanceMode.REMOTE;
}
