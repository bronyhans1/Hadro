"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { LoadingState } from "@/components/ui/LoadingState";
import { CompanyLogoUploader } from "@/components/company/CompanyLogoUploader";
import * as platformApi from "@/lib/api/platform.api";
import type { CompanyProfile, CompanyProfileUpdate } from "@/lib/api/companyProfile.api";
import { safeApi } from "@/lib/api/safeApi";
import { isApiError } from "@/lib/types/api";
import { useToast } from "@/components/ui/ToastProvider";
import { useSuccessBanner } from "@/hooks/useSuccessBanner";
import { translate } from "@/lib/i18n";
import { toUserFacingApiError } from "@/lib/api/userFacingError";

type Props = {
  companyId: string;
  companyNameFallback: string;
  /** Optional: refresh companies directory after logo change (parent may remount list). */
  onProfileUpdated?: (profile: CompanyProfile) => void;
};

/**
 * Platform Admin editor for tenant company profile (assist customers).
 * Logo storage path matches tenant portal: company-logos/<company_id>/logo.<ext>
 */
export function PlatformCompanyProfileEditor({
  companyId,
  companyNameFallback,
  onProfileUpdated,
}: Props) {
  const toast = useToast();
  const success = useSuccessBanner();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const apply = useCallback(
    (p: CompanyProfile) => {
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
      onProfileUpdated?.(p);
    },
    [onProfileUpdated]
  );

  const load = useCallback(async () => {
    setLoading(true);
    const res = await safeApi(platformApi.getCompanyProfileForPlatform(companyId));
    setLoading(false);
    if (isApiError(res)) {
      toast.error(toUserFacingApiError(res.error, translate("profile.failedLoadCompany")));
      return;
    }
    if (res.data) apply(res.data);
  }, [apply, companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void load();
  }, [load]);

  async function persistLogoUrl(nextUrl: string | null) {
    const res = await safeApi(
      platformApi.updateCompanyProfileForPlatform(companyId, { logo_url: nextUrl })
    );
    if (isApiError(res)) {
      throw new Error(toUserFacingApiError(res.error, translate("profile.failedSaveLogo")));
    }
    if (res.data) apply(res.data);
    else setLogoUrl(nextUrl);
    success.showSuccess({
      title: translate("leave.changesSaved"),
      description: nextUrl ? translate("profile.logoUpdated") : translate("profile.logoRemoved"),
    });
  }

  async function save() {
    setSaving(true);
    const body: CompanyProfileUpdate = {
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
    };
    const res = await safeApi(platformApi.updateCompanyProfileForPlatform(companyId, body));
    setSaving(false);
    if (isApiError(res)) {
      toast.error(toUserFacingApiError(res.error, translate("profile.failedSaveCompany")));
      return;
    }
    if (res.data) apply(res.data);
    success.showSuccess({
      title: translate("leave.changesSaved"),
      description: translate("profile.companySaved"),
    });
  }

  if (loading && !profile) {
    return (
      <Card title={translate("navigation.companyProfile")}>
        <LoadingState message={translate("profile.loadingCompany")} className="min-h-[120px]" />
      </Card>
    );
  }

  return (
    <Card title={translate("navigation.companyProfile")}>
      <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
        {translate("profile.companyIdentitySubtitle")}
        {profile ? (
          <>
            {" "}
            {translate("profile.profileCompletion")}: <strong>{profile.completion_percent}%</strong>
          </>
        ) : null}
      </p>

      <div className="mb-4">{success.banner}</div>

      <div className="mb-4">
        <CompanyLogoUploader
          companyId={companyId}
          companyName={name || companyNameFallback}
          logoUrl={logoUrl}
          initials={profile?.initials}
          canEdit
          persistLogoUrl={persistLogoUrl}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input label={translate("profile.companyName")} value={name} onChange={(e) => setName(e.target.value)} />
        <Input label={translate("platform.industry")} value={industry} onChange={(e) => setIndustry(e.target.value)} />
        <Input label={translate("profile.country")} value={country} onChange={(e) => setCountry(e.target.value)} />
        <Input
          label={translate("profile.region")}
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        />
        <Input label={translate("profile.city")} value={city} onChange={(e) => setCity(e.target.value)} />
        <Input label={translate("profile.postalCode")} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
        <div className="sm:col-span-2">
          <Input
            label={translate("profile.streetAddress")}
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
          />
        </div>
        <Input
          label={translate("profile.businessPhone")}
          value={businessPhone}
          onChange={(e) => setBusinessPhone(e.target.value)}
        />
        <Input label={translate("profile.website")} value={website} onChange={(e) => setWebsite(e.target.value)} />
        <Input
          label={translate("profile.registrationNumber")}
          value={registrationNumber}
          onChange={(e) => setRegistrationNumber(e.target.value)}
        />
        <Input label={translate("profile.taxNumber")} value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} />
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="button" loading={saving} onClick={() => void save()}>
          {translate("profile.saveProfile")}
        </Button>
      </div>
    </Card>
  );
}
