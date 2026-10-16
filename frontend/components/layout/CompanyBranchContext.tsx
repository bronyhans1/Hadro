"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { isPlatformAdmin } from "@/lib/auth/roles";
import { CompanyLogoMark } from "@/components/company/CompanyLogoMark";
import { navText } from "@/lib/navigation/navText";

export function CompanyBranchContext() {
  const { user } = useAuth();

  if (!user || isPlatformAdmin(user.roles)) {
    return (
      <div className="org-context" aria-label={navText("common.platformContext", "Platform context")}>
        <div className="org-context-block">
          <p className="org-context-label">{navText("common.environment", "Environment")}</p>
          <p className="org-context-value">{navText("common.platformConsole", "Platform Console")}</p>
        </div>
      </div>
    );
  }

  const companyName = user.companyName?.trim() || "—";
  const branchName = user.branch?.name?.trim() || navText("common.noBranchAssigned", "No branch assigned");

  return (
    <div className="org-context" aria-label={navText("common.companyBranchContext", "Company and branch context")}>
      <div className="org-context-block flex min-w-0 items-center gap-2">
        <CompanyLogoMark name={companyName} logoUrl={user.companyLogoUrl} size="sm" />
        <div className="min-w-0">
          <p className="org-context-label">{navText("common.company", "Company")}</p>
          <p className="org-context-value" title={companyName}>
            {companyName}
          </p>
        </div>
      </div>
      <div className="org-context-block">
        <p className="org-context-label">{navText("common.branch", "Branch")}</p>
        <p className="org-context-value" title={branchName}>
          {branchName}
        </p>
      </div>
    </div>
  );
}
