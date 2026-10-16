import type { AuditLog } from "@/lib/api/audit.api";
import { formatRoleLabel } from "@/lib/navigation/formatRoleLabel";
import type { UserListItem } from "@/lib/api/users.api";
import { getAuditActionLabel } from "@/lib/audit/auditActionLabels";
import { translate } from "@/lib/i18n";

const MANUAL_REASON_KEYS: Record<string, string> = {
  app_or_network_issue: "attendance.reasonAppOrNetwork",
  device_battery_dead: "attendance.reasonDeviceBatteryDead",
  phone_unavailable: "attendance.reasonPhoneUnavailable",
  missed_scan: "attendance.reasonMissedScan",
  supervisor_override: "attendance.reasonSupervisorOverride",
  other: "attendance.reasonOther",
};

export type PresentAuditLogOptions = {
  employeeDisplayById?: ReadonlyMap<string, string>;
};

export function buildAuditEmployeeDisplayLookup(users: readonly UserListItem[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const u of users) {
    const first = typeof u.first_name === "string" ? u.first_name.trim() : "";
    const last = typeof u.last_name === "string" ? u.last_name.trim() : "";
    const full = [first, last].filter(Boolean).join(" ");
    const label = full || (typeof u.email === "string" ? u.email.trim() : "") || u.id;
    m.set(u.id, label);
  }
  return m;
}

/** Alias for audit/dashboard callers (`buildAuditEmployeeDisplayLookup`). */
export const buildEmployeeDisplayById = buildAuditEmployeeDisplayLookup;

export function parseAuditMetadata(metadata: AuditLog["metadata"]): Record<string, unknown> | null {
  if (metadata === null || metadata === undefined) return null;
  if (typeof metadata === "string") {
    try {
      const parsed = JSON.parse(metadata);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  if (typeof metadata === "object") {
    return metadata as Record<string, unknown>;
  }
  return null;
}

function quoteIfText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (!v) return null;
  return `"${v}"`;
}

/** User-visible label for a manual attendance reason code. */
export function formatManualAttendanceReason(reason: unknown): string {
  if (typeof reason !== "string" || !reason.trim()) return "—";
  const key = reason.trim();
  const labelKey = MANUAL_REASON_KEYS[key];
  return labelKey
    ? translate(labelKey)
    : key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function isManualAttendanceAction(action: string): boolean {
  return action === "session.manual_clock_in" || action === "session.manual_clock_out";
}

export function employeeTargetFromMeta(
  meta: Record<string, unknown> | null,
  employeeDisplayById?: ReadonlyMap<string, string>
): string {
  if (!meta) return translate("audit.employee");
  const name = typeof meta.target_user_name === "string" ? meta.target_user_name.trim() : "";
  if (name) return name;
  const email = typeof meta.target_user_email === "string" ? meta.target_user_email.trim() : "";
  if (email) return email;
  const id = typeof meta.target_user_id === "string" ? meta.target_user_id.trim() : "";
  if (id) {
    const fromLookup = employeeDisplayById?.get(id);
    if (fromLookup) return fromLookup;
  }
  return translate("audit.employee");
}

function buildManualAttendanceDetail(meta: Record<string, unknown> | null): string | null {
  if (!meta) return null;
  const parts: string[] = [];
  parts.push(`Reason: ${formatManualAttendanceReason(meta.manual_reason)}`);
  const note = typeof meta.manual_note === "string" ? meta.manual_note.trim() : "";
  if (note) parts.push(`Note: ${note}`);
  return parts.join(" · ");
}

/**
 * Short, user-facing title for an audit row.
 * Prefer canonical business labels; never surface raw action keys.
 */
export function friendlyAuditActionTitle(action: string, meta: Record<string, unknown> | null): string {
  const role = typeof meta?.role === "string" ? meta.role.toLowerCase() : null;
  const name = quoteIfText(meta?.name);
  const base = getAuditActionLabel(action);

  switch (action) {
    case "user.create":
      if (role === "hr") return translate("audit.createdHr");
      if (role === "manager") return translate("audit.createdManager");
      if (role === "employee") return translate("audit.createdEmployee");
      return base;
    case "user.update":
      if (meta?.department_auto_cleared === true) {
        return translate("audit.clearedDepartment");
      }
      if (meta?.department_updated === true) return translate("audit.updatedDepartment");
      if (meta?.branch_updated === true) return translate("branches.auditUpdatedUserBranch");
      if (meta?.email_updated === true) return translate("audit.updatedEmail");
      if (meta?.first_name_updated === true || meta?.last_name_updated === true) {
        return translate("audit.updatedProfile");
      }
      return base;
    case "branch.create":
      return name ? translate("branches.auditCreatedNamed", { values: { name } }) : base;
    case "branch.update":
      if (meta?.attendance_updated === true) return translate("branches.auditAttendanceSettings");
      return name ? translate("branches.auditUpdatedNamed", { values: { name } }) : base;
    default:
      return base;
  }
}

/**
 * Human-readable target summary (no raw UUIDs in normal presentation).
 */
export function friendlyAuditTargetLabel(
  log: AuditLog,
  meta: Record<string, unknown> | null,
  employeeDisplayById?: ReadonlyMap<string, string>
): string {
  if (isManualAttendanceAction(log.action)) {
    const who = employeeTargetFromMeta(meta, employeeDisplayById);
    return who === translate("audit.employee")
      ? translate("audit.recordedEarlier")
      : translate("audit.employeeNamed", { values: { name: who } });
  }

  switch (log.entity_type) {
    case "work_session":
      return translate("audit.workSession");
    case "user":
      return translate("audit.userAccount");
    case "branch":
      return typeof meta?.name === "string" && meta.name.trim()
        ? translate("branches.auditTargetNamed", { values: { name: meta.name.trim() } })
        : translate("attendance.branch");
    case "department":
      return translate("attendance.department");
    case "company_policy":
      return translate("audit.companyPolicy");
    case "wage_rate":
      return translate("audit.wageRate");
    case "company_holiday":
      return translate("audit.companyHoliday");
    case "payroll_record":
      return translate("audit.payrollRecord");
    case "leave_request":
      return translate("audit.leaveRequest");
    case "leave_balance":
      return translate("audit.leaveBalance");
    case "manual_overtime":
      return translate("audit.manualOvertime");
    case "attendance_day_override":
      return translate("audit.attendanceDayOverride");
    case "company":
      return translate("profile.company");
    default:
      return log.entity_type
        ? log.entity_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : "—";
  }
}

/**
 * Secondary line for dashboard cards / audit details column (no JSON blobs).
 */
export function friendlyAuditDetailSummary(log: AuditLog, meta: Record<string, unknown> | null): string | null {
  if (isManualAttendanceAction(log.action)) {
    return buildManualAttendanceDetail(meta);
  }
  if (log.action === "user.create" && meta && typeof meta.role === "string") {
    return `Role: ${formatRoleLabel(meta.role)}`;
  }
  if (log.action === "branch.create" || log.action === "branch.update") {
    const n = typeof meta?.name === "string" ? meta.name.trim() : "";
    return n ? `Branch name: ${n}` : null;
  }
  return null;
}

/** Single-row presentation for dashboard and audit table columns. */
export function presentAuditLog(
  log: AuditLog,
  options?: PresentAuditLogOptions
): {
  actionLabel: string;
  targetLabel: string;
  detail: string | null;
} {
  const meta = parseAuditMetadata(log.metadata);
  const employeeDisplayById = options?.employeeDisplayById;
  return {
    actionLabel: friendlyAuditActionTitle(log.action, meta),
    targetLabel: friendlyAuditTargetLabel(log, meta, employeeDisplayById),
    detail: friendlyAuditDetailSummary(log, meta),
  };
}
