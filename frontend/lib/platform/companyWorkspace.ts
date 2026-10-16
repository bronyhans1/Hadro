import type { PlatformCompanyListItem, PlatformAuditLog } from "@/lib/api/platform.api";
import { getAuditActionLabel } from "@/lib/audit/auditActionLabels";
import { translate } from "@/lib/i18n";

export type CompanyWorkspaceTabId =
  | "overview"
  | "users"
  | "branches"
  | "departments"
  | "activity"
  | "audit"
  | "settings"
  | "danger";

export const COMPANY_WORKSPACE_TABS: readonly {
  id: CompanyWorkspaceTabId;
  label: string;
}[] = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "branches", label: "Branches" },
  { id: "departments", label: "Departments" },
  { id: "activity", label: "Activity" },
  { id: "audit", label: "Audit" },
  { id: "settings", label: "Settings" },
  { id: "danger", label: "Danger Zone" },
] as const;

export function companyWorkspaceTabLabel(id: CompanyWorkspaceTabId): string {
  switch (id) {
    case "overview":
      return translate("navigation.overview");
    case "users":
      return translate("audit.users");
    case "branches":
      return translate("navigation.branches");
    case "departments":
      return translate("navigation.departments");
    case "activity":
      return translate("platform.activity");
    case "audit":
      return translate("platform.auditTab");
    case "settings":
      return translate("navigation.settings");
    case "danger":
      return translate("platform.dangerZone");
  }
}
export function parseCompanyWorkspaceTab(value: string | null | undefined): CompanyWorkspaceTabId {
  const match = COMPANY_WORKSPACE_TABS.find((t) => t.id === value);
  return match?.id ?? "overview";
}

export function branchUsageLabel(company: PlatformCompanyListItem): string {
  const limit = company.branch_limit;
  return `${company.branches_count} / ${limit === null ? translate("branches.unlimited") : limit}`;
}

export function companyStatusBadgeVariant(status: PlatformCompanyListItem["status"]) {
  if (status === "active") return "success" as const;
  if (status === "inactive") return "neutral" as const;
  return "warning" as const;
}

export function companyStatusLabel(status: PlatformCompanyListItem["status"]) {
  if (status === "active") return translate("profile.accountStatus.active");
  if (status === "inactive") return translate("profile.accountStatus.inactive");
  return translate("profile.accountStatus.suspended");
}

/** SaaS-provider lifecycle view (mapped from existing company.status). */
export type TenantLifecycle = "active" | "suspended" | "archived" | "pending_activation";

export function mapStatusToLifecycle(status: PlatformCompanyListItem["status"]): TenantLifecycle {
  if (status === "active") return "active";
  if (status === "suspended") return "suspended";
  return "archived";
}

export function lifecycleLabel(lifecycle: TenantLifecycle): string {
  switch (lifecycle) {
    case "active":
      return translate("profile.accountStatus.active");
    case "suspended":
      return translate("profile.accountStatus.suspended");
    case "archived":
      return translate("platform.archived");
    case "pending_activation":
      return translate("platform.pendingActivation");
  }
}

export function lifecycleBadgeVariant(lifecycle: TenantLifecycle) {
  if (lifecycle === "active") return "success" as const;
  if (lifecycle === "suspended") return "warning" as const;
  if (lifecycle === "pending_activation") return "info" as const;
  return "neutral" as const;
}

export function platformStatusLabel(status: PlatformCompanyListItem["status"]): string {
  if (status === "active") return translate("platform.operational");
  if (status === "suspended") return translate("platform.restricted");
  return translate("platform.archived");
}

export type CompanyTimelineItem = {
  id: string;
  label: string;
  at: string | null;
  source: "derived" | "audit";
};

/**
 * Build a tenant lifecycle timeline from known audit actions + company created date.
 */
export function buildCompanyTimeline(
  company: PlatformCompanyListItem,
  logsNewestFirst: PlatformAuditLog[]
): CompanyTimelineItem[] {
  const oldestFirst = [...logsNewestFirst].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const findFirst = (predicate: (log: PlatformAuditLog) => boolean) =>
    oldestFirst.find(predicate) ?? null;

  const provisioned = findFirst(
    (l) =>
      l.action === "platform.company_create" ||
      l.action === "platform.company_provision" ||
      l.action.includes("provision")
  );

  const activated = findFirst((l) => l.action === "platform.company_status_update");
  const branchCreated = findFirst((l) => l.action === "branch.create");
  const departmentCreated = findFirst((l) => l.action === "department.create");
  const policyUpdated = findFirst(
    (l) => l.action === "company_policy_updated" || l.action.includes("policy")
  );
  const latest = logsNewestFirst[0] ?? null;

  return [
    {
      id: "provisioned",
      label: translate("platform.provisioned"),
      at: provisioned?.created_at ?? company.created_at ?? null,
      source: provisioned ? "audit" : "derived",
    },
    {
      id: "activated",
      label: translate("platform.activated"),
      at:
        company.status === "active"
          ? activated?.created_at ?? company.created_at ?? null
          : activated?.created_at ?? null,
      source: activated ? "audit" : "derived",
    },
    {
      id: "branch",
      label: translate("branches.branchCreatedTimeline"),
      at: branchCreated?.created_at ?? null,
      source: branchCreated ? "audit" : "derived",
    },
    {
      id: "department",
      label: translate("audit.departmentCreated"),
      at: departmentCreated?.created_at ?? null,
      source: departmentCreated ? "audit" : "derived",
    },
    {
      id: "policy",
      label: translate("audit.policyUpdatedShort"),
      at: policyUpdated?.created_at ?? null,
      source: policyUpdated ? "audit" : "derived",
    },
    {
      id: "latest",
      label: latest
        ? translate("audit.latestActivityNamed", { values: { action: getAuditActionLabel(latest.action) } })
        : translate("audit.latestActivity"),
      at: latest?.created_at ?? null,
      source: latest ? "audit" : "derived",
    },
  ];
}
