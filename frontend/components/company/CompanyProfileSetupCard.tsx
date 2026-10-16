"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Building2, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import * as companyProfileApi from "@/lib/api/companyProfile.api";
import type { CompanyProfile } from "@/lib/api/companyProfile.api";
import { safeApi } from "@/lib/api/safeApi";
import { isApiError } from "@/lib/types/api";
import { canEditPayrollSchedulePolicy } from "@/lib/auth/roles";
import { useAuth } from "@/lib/auth/AuthContext";
import { translate } from "@/lib/i18n";

/**
 * Dismissible dashboard card prompting admins to complete company profile.
 */
export function CompanyProfileSetupCard() {
  const { user } = useAuth();
  const canEdit = canEditPayrollSchedulePolicy(user?.roles);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [dismissing, setDismissing] = useState(false);

  const load = useCallback(async () => {
    if (!canEdit) return;
    const res = await safeApi(companyProfileApi.getCompanyProfile());
    if (!isApiError(res)) setProfile(res.data ?? null);
  }, [canEdit]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!canEdit || !profile) return null;
  if (profile.completion_percent >= 100) return null;
  if (profile.profile_setup_dismissed_at) return null;

  async function dismiss() {
    setDismissing(true);
    const res = await safeApi(companyProfileApi.dismissCompanyProfileSetup());
    setDismissing(false);
    if (!isApiError(res)) setProfile(res.data ?? null);
  }

  return (
    <Card className="relative border-[color:var(--ds-color-primary-border)] bg-[var(--ds-color-primary-subtle)]/40">
      <button
        type="button"
        className="absolute right-3 top-3 rounded-md p-1 text-theme-muted hover:bg-[var(--ds-color-nav-hover)]"
        aria-label={translate("profile.dismissCompanySetup")}
        disabled={dismissing}
        onClick={() => void dismiss()}
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--ds-color-surface)] text-[var(--ds-color-primary)] ring-1 ring-[color:var(--ds-color-border)]">
          <Building2 className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 pr-8">
          <p className="text-sm font-semibold text-theme">{translate("profile.completeCompanyProfile")}</p>
          <p className="mt-1 text-xs text-theme-muted">
            {translate("profile.companyProfileHint", { values: { percent: profile.completion_percent } })}
          </p>
          <ul className="mt-3 grid gap-1 text-xs text-theme sm:grid-cols-2">
            {[
              ["logo_url", translate("profile.uploadLogo")],
              ["country", translate("profile.country")],
              ["region", translate("profile.region")],
              ["city", translate("profile.city")],
              ["street_address", translate("profile.streetAddress")],
              ["industry", translate("platform.industry")],
              ["business_phone", translate("profile.businessPhone")],
              ["website", translate("profile.website")],
            ].map(([key, label]) => {
              const done = !profile.missing_fields.includes(key);
              return (
                <li key={key} className={done ? "text-theme-muted line-through" : ""}>
                  {done ? "✓" : "○"} {label}
                </li>
              );
            })}
          </ul>
          <div className="mt-4">
            <Link href="/company-profile">
              <Button type="button" size="sm">
                {translate("profile.completeProfile")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
