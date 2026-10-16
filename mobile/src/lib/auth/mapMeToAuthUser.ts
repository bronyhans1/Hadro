import type { AuthUser } from "@/types/auth";
import { normalizeRolesForApp } from "@/lib/auth/roles";
import { normalizeZoneForIntl } from "@/lib/formatDateTime";
import type { MeResponse } from "@/types/me";

function readTruthyFlag(record: Record<string, unknown> | null | undefined, ...keys: string[]): boolean {
  if (!record) return false;
  for (const key of keys) {
    const value = record[key];
    if (value === true || value === 1 || value === "true" || value === "1") return true;
  }
  return false;
}

/** Accepts unwrapped MeResponse or `{ success: true, data: MeResponse }`. */
export function unwrapMeResponse(raw: unknown): MeResponse | null {
  if (!raw || typeof raw !== "object") return null;
  const outer = raw as Record<string, unknown>;

  if (outer.success === false) return null;

  if (outer.success === true && outer.data && typeof outer.data === "object") {
    const inner = outer.data as Record<string, unknown>;
    if (typeof inner.id === "string" && inner.id.trim()) {
      return inner as unknown as MeResponse;
    }
    return null;
  }

  if (typeof outer.id === "string" && outer.id.trim()) {
    return outer as unknown as MeResponse;
  }

  return null;
}

export function resolveRemoteAttendanceFlags(me: MeResponse): {
  remoteAttendanceAllowed: boolean;
  companyRemoteAttendanceEnabled: boolean;
  effectiveRemoteAttendanceEnabled: boolean;
} {
  const root = me as unknown as Record<string, unknown>;
  const company = (me.company ?? null) as unknown as Record<string, unknown> | null;

  const remoteAttendanceAllowed = readTruthyFlag(
    root,
    "remote_attendance_allowed",
    "remoteAttendanceAllowed"
  );
  const companyRemoteAttendanceEnabled = readTruthyFlag(
    company,
    "remote_attendance_enabled",
    "remoteAttendanceEnabled"
  );
  const effectiveFromApi = readTruthyFlag(
    root,
    "effective_remote_attendance_enabled",
    "effectiveRemoteAttendanceEnabled"
  );
  const effectiveRemoteAttendanceEnabled =
    effectiveFromApi || (companyRemoteAttendanceEnabled && remoteAttendanceAllowed);

  return {
    remoteAttendanceAllowed,
    companyRemoteAttendanceEnabled,
    effectiveRemoteAttendanceEnabled,
  };
}

export function mapMeToAuthUser(me: MeResponse): AuthUser {
  const branchFromRow =
    me.branch && typeof me.branch.id === "string" && me.branch.id.trim()
      ? {
          id: me.branch.id.trim(),
          name:
            typeof me.branch.name === "string" && me.branch.name.trim()
              ? me.branch.name.trim()
              : "",
        }
      : null;

  const legacyBranchRaw = me.company?.branch_name;
  const legacyBranchName =
    typeof legacyBranchRaw === "string" && legacyBranchRaw.trim()
      ? legacyBranchRaw.trim()
      : null;

  const branchName = branchFromRow?.name || legacyBranchName || null;
  const remote = resolveRemoteAttendanceFlags(me);

  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.log("[auth/me] remote flags", {
      remote_attendance_allowed: me.remote_attendance_allowed,
      effective_remote_attendance_enabled: me.effective_remote_attendance_enabled,
      company_remote_attendance_enabled: me.company?.remote_attendance_enabled,
      mapped: remote,
    });
  }

  return {
    userId: me.id,
    email: me.email,
    companyId: me.company?.id ?? "",
    roles: normalizeRolesForApp(me.roles),
    firstName: (me.first_name ?? "").trim(),
    lastName: (me.last_name ?? "").trim(),
    companyName: (me.company?.name ?? "").trim(),
    payrollEnabled: me.company?.payroll_enabled !== false,
    accountStatus: me.status ?? "active",
    companyAccountStatus: me.company?.status ?? "active",
    businessTimeZone: normalizeZoneForIntl(
      typeof me.company?.business_timezone === "string" ? me.company.business_timezone : "Africa/Accra"
    ),
    branchId: branchFromRow?.id ?? null,
    branchName,
    dateOfBirth: me.date_of_birth ?? null,
    gender: me.gender ?? null,
    phoneNumber: me.phone_number ?? null,
    profilePhotoUrl: me.profile_photo_url ?? null,
    mustChangePassword: !!me.must_change_password,
    themePreference: me.theme_preference ?? "system",
    language: me.language ?? null,
    department: me.department ?? null,
    profileCompletion: {
      requiredComplete: !!me.profile_completion?.required_complete,
      missingRequiredFields: me.profile_completion?.missing_required_fields ?? [],
      recommendedMissingFields: me.profile_completion?.recommended_missing_fields ?? [],
    },
    remoteAttendanceAllowed: remote.remoteAttendanceAllowed,
    companyRemoteAttendanceEnabled: remote.companyRemoteAttendanceEnabled,
    effectiveRemoteAttendanceEnabled: remote.effectiveRemoteAttendanceEnabled,
  };
}
