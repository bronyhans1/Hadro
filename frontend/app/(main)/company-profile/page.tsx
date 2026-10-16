"use client";

import { useCallback, useEffect, useState } from "react";
import { MainContent } from "@/components/layout/MainContent";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { CompanyLogoUploader } from "@/components/company/CompanyLogoUploader";
import { useAuth } from "@/lib/auth/AuthContext";
import { canEditPayrollSchedulePolicy } from "@/lib/auth/roles";
import * as companyProfileApi from "@/lib/api/companyProfile.api";
import type { CompanyProfile } from "@/lib/api/companyProfile.api";
import { safeApi } from "@/lib/api/safeApi";
import { isApiError } from "@/lib/types/api";
import { useToast } from "@/components/ui/ToastProvider";
import { useSuccessBanner } from "@/hooks/useSuccessBanner";
import { translate } from "@/lib/i18n";

export default function CompanyProfilePage() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const success = useSuccessBanner();
  const canEdit = canEditPayrollSchedulePolicy(user?.roles);

  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [taxNumber, setTaxNumber] = useState("");

  const applyProfile = useCallback((p: CompanyProfile) => {
    setProfile(p);
    setName(p.name ?? "");
    setLogoUrl(p.logo_url);
    setIndustry(p.industry ?? "");
    setCountry(p.country ?? "");
    setRegion(p.region ?? "");
    setCity(p.city ?? "");
    setStreetAddress(p.street_address ?? "");
    setPostalCode(p.postal_code ?? "");
    setBusinessPhone(p.business_phone ?? "");
    setWebsite(p.website ?? "");
    setRegistrationNumber(p.registration_number ?? "");
    setTaxNumber(p.tax_number ?? "");
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await safeApi(companyProfileApi.getCompanyProfile());
    setLoading(false);
    if (isApiError(res)) {
      setError(res.error ?? translate("profile.failedLoadCompany"));
      return;
    }
    if (res.data) applyProfile(res.data);
  }, [applyProfile]);

  useEffect(() => {
    void load();
  }, [load]);

  async function persistLogoUrl(nextUrl: string | null) {
    const res = await safeApi(companyProfileApi.updateCompanyProfile({ logo_url: nextUrl }));
    if (isApiError(res)) {
      throw new Error(res.error ?? translate("profile.failedSaveLogo"));
    }
    if (res.data) applyProfile(res.data);
    else setLogoUrl(nextUrl);
    await refreshUser();
    success.showSuccess({
      title: translate("leave.changesSaved"),
      description: nextUrl ? translate("profile.logoUpdated") : translate("profile.logoRemoved"),
    });
  }

  async function save() {
    if (!canEdit) return;
    setSaving(true);
    const res = await safeApi(
      companyProfileApi.updateCompanyProfile({
        name: name.trim(),
        logo_url: logoUrl,
        industry: industry.trim() || null,
        country: country.trim() || null,
        region: region.trim() || null,
        city: city.trim() || null,
        street_address: streetAddress.trim() || null,
        postal_code: postalCode.trim() || null,
        business_phone: businessPhone.trim() || null,
        website: website.trim() || null,
        registration_number: registrationNumber.trim() || null,
        tax_number: taxNumber.trim() || null,
      })
    );
    setSaving(false);
    if (isApiError(res)) {
      toast.error(res.error ?? translate("profile.failedSaveCompany"));
      return;
    }
    if (res.data) applyProfile(res.data);
    await refreshUser();
    success.showSuccess({
      title: translate("leave.changesSaved"),
      description: translate("profile.companySaved"),
    });
  }

  if (loading && !profile) {
    return (
      <MainContent title={translate("navigation.companyProfile")} subtitle={translate("profile.companyIdentitySubtitle")}>
        <LoadingState message={translate("profile.loadingCompany")} className="min-h-[200px]" />
      </MainContent>
    );
  }

  if (error && !profile) {
    return (
      <MainContent title={translate("navigation.companyProfile")}>
        <ErrorState message={error} />
      </MainContent>
    );
  }

  return (
    <MainContent
      title={translate("navigation.companyProfile")}
      subtitle={translate("profile.manageOrganization")}
      actions={
        canEdit ? (
          <Button type="button" loading={saving} onClick={() => void save()}>
            {translate("settings.saveChanges")}
          </Button>
        ) : null
      }
    >
      <div className="space-y-6">
        {success.banner}
        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              {user?.companyId ? (
                <CompanyLogoUploader
                  companyId={user.companyId}
                  companyName={name || profile?.name || translate("common.company")}
                  logoUrl={logoUrl}
                  initials={profile?.initials}
                  canEdit={canEdit}
                  persistLogoUrl={persistLogoUrl}
                />
              ) : null}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-theme-muted">{translate("profile.profileCompletion")}</p>
              <p className="text-lg font-semibold text-theme">
                {profile?.completion_percent ?? 0}%
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="company-name"
              label={translate("profile.companyName")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit}
              required
            />
            <Input
              id="company-industry"
              label={translate("platform.industry")}
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              disabled={!canEdit}
              placeholder={translate("profile.industryExample")}
            />
            <Input
              id="company-country"
              label={translate("profile.country")}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={!canEdit}
            />
            <Input
              id="company-region"
              label={translate("profile.region")}
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              disabled={!canEdit}
            />
            <Input
              id="company-city"
              label={translate("profile.city")}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={!canEdit}
            />
            <Input
              id="company-postal"
              label={translate("profile.postalCode")}
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              disabled={!canEdit}
            />
            <div className="sm:col-span-2">
              <Input
                id="company-street"
                label={translate("profile.streetAddress")}
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <Input
              id="company-phone"
              label={translate("profile.businessPhone")}
              value={businessPhone}
              onChange={(e) => setBusinessPhone(e.target.value)}
              disabled={!canEdit}
            />
            <Input
              id="company-website"
              label={translate("profile.website")}
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              disabled={!canEdit}
              placeholder="https://"
            />
            <Input
              id="company-reg"
              label={translate("profile.registrationNumber")}
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              disabled={!canEdit}
            />
            <Input
              id="company-tax"
              label={translate("profile.taxNumber")}
              value={taxNumber}
              onChange={(e) => setTaxNumber(e.target.value)}
              disabled={!canEdit}
            />
            <div className="sm:col-span-2">
              <p className="text-xs text-theme-muted">
                {translate("settings.businessTimezone")}{" "}
                <span className="font-medium text-theme">
                  {profile?.business_timezone ?? user?.businessTimeZone ?? "—"}
                </span>{" "}
                {translate("settings.managedInSettings")}
              </p>
            </div>
          </div>
          {!canEdit ? (
            <p className="mt-4 text-xs text-theme-muted">{translate("profile.onlyAdminHrEdit")}</p>
          ) : null}
        </Card>
      </div>
    </MainContent>
  );
}
