import type { LucideIcon } from "lucide-react";
import { translate } from "@/lib/i18n";
import {
  Activity,
  Bell,
  Building2,
  CalendarDays,
  Cog,
  KeyRound,
  Landmark,
  Network,
  Package,
  Shield,
  Users,
  Wallet,
} from "lucide-react";

export type AuditCategoryId =
  | "company"
  | "authentication"
  | "users"
  | "branches"
  | "departments"
  | "attendance"
  | "leave"
  | "payroll"
  | "notifications"
  | "settings"
  | "provisioning"
  | "system";

export type AuditCategory = {
  id: AuditCategoryId;
  label: string;
  icon: LucideIcon;
};

export const AUDIT_CATEGORIES: readonly AuditCategory[] = [
  { id: "company", label: "Companies", icon: Building2 },
  { id: "authentication", label: "Authentication", icon: KeyRound },
  { id: "users", label: "Users", icon: Users },
  { id: "branches", label: "Branches", icon: Landmark },
  { id: "departments", label: "Departments", icon: Network },
  { id: "attendance", label: "Attendance", icon: Activity },
  { id: "leave", label: "Leave Management", icon: CalendarDays },
  { id: "payroll", label: "Payroll", icon: Wallet },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "Settings", icon: Cog },
  { id: "provisioning", label: "Provisioning", icon: Package },
  { id: "system", label: "System", icon: Shield },
] as const;

const CATEGORY_BY_ID = new Map(AUDIT_CATEGORIES.map((c) => [c.id, c]));

const CATEGORY_LABEL_KEYS: Record<AuditCategoryId, string> = {
  company: "navigation.companies",
  authentication: "audit.authentication",
  users: "audit.users",
  branches: "navigation.branches",
  departments: "navigation.departments",
  attendance: "navigation.attendance",
  leave: "audit.leaveManagement",
  payroll: "navigation.payroll",
  notifications: "navigation.notifications",
  settings: "navigation.settings",
  provisioning: "audit.provisioning",
  system: "navigation.sections.system",
};

export function getAuditCategoryMeta(id: AuditCategoryId): AuditCategory {
  const meta = CATEGORY_BY_ID.get(id) ?? AUDIT_CATEGORIES[AUDIT_CATEGORIES.length - 1]!;
  return { ...meta, label: translate(CATEGORY_LABEL_KEYS[id] ?? "navigation.sections.system") };
}

/**
 * Map an audit action / entity to an investigation category.
 */
export function categorizeAuditEvent(action: string, entityType?: string | null): AuditCategoryId {
  const a = (action ?? "").toLowerCase();
  const e = (entityType ?? "").toLowerCase();
  const blob = `${a} ${e}`;

  if (a.startsWith("platform.company") || a.includes("provision")) return "provisioning";
  if (a.startsWith("platform.")) return "system";
  if (blob.includes("auth") || blob.includes("login") || blob.includes("password") || blob.includes("session_token")) {
    return "authentication";
  }
  if (a.startsWith("session.") || e === "work_session" || blob.includes("attendance") || blob.includes("clock")) {
    return "attendance";
  }
  if (a.startsWith("leave.") || e.includes("leave")) return "leave";
  if (a.startsWith("payroll.") || e.includes("payroll") || e === "wage_rate") return "payroll";
  if (a.startsWith("notification.") || e.includes("notification")) return "notifications";
  if (
    a.startsWith("branch.") ||
    e === "branch" ||
    blob.includes("branch_limit")
  ) {
    return "branches";
  }
  if (a.startsWith("department.") || e === "department") return "departments";
  if (a.startsWith("user.") || e === "user") return "users";
  if (
    e === "company_policy" ||
    e === "company_holiday" ||
    blob.includes("support") ||
    blob.includes("setting") ||
    blob.includes("policy")
  ) {
    return "settings";
  }
  if (e === "company" || a.includes("company")) return "company";
  return "system";
}
