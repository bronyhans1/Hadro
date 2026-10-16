"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MainContent } from "@/components/layout/MainContent";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonForm } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/auth/AuthContext";
import { isPlatformAdmin } from "@/lib/auth/roles";
import * as platformApi from "@/lib/api/platform.api";
import { isApiError } from "@/lib/types/api";
import { useToast } from "@/components/ui/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { safeApi } from "@/lib/api/safeApi";
import { toUserFacingApiError } from "@/lib/api/userFacingError";
import { translate } from "@/lib/i18n";

export default function PlatformProvisionCompanyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const canProvision = isPlatformAdmin(user?.roles);

  const [companyName, setCompanyName] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [branchLimit, setBranchLimit] = useState<string>("");

  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return (
      !!companyName.trim() &&
      !!adminFirstName.trim() &&
      !!adminLastName.trim() &&
      !!adminEmail.trim() &&
      temporaryPassword.length >= 6
    );
  }, [companyName, adminFirstName, adminLastName, adminEmail, temporaryPassword]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!canProvision) {
      setError(translate("platform.platformAdminOnly"));
      return;
    }
    if (!canSubmit) {
      setError(
        translate("platform.fillRequiredFields")
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await safeApi(platformApi.provisionCompany({
        company_name: companyName.trim(),
        company_code: companyCode.trim() ? companyCode.trim() : null,
        admin_first_name: adminFirstName.trim(),
        admin_last_name: adminLastName.trim(),
        admin_email: adminEmail.trim(),
        temporary_password: temporaryPassword,
        branch_limit: branchLimit.trim() ? Number(branchLimit.trim()) : null,
      }));

      if (isApiError(res)) {
        setError(toUserFacingApiError(res.error, translate("platform.failedProvisionCompany")));
        toast.error(toUserFacingApiError(res.error, translate("platform.failedProvisionCompany")));
        return;
      }

      toast.success(translate("platform.companyCreated"));
      router.replace("/platform/companies");
    } catch (e) {
      const msg = e instanceof Error ? toUserFacingApiError(e.message, translate("platform.failedProvisionCompany")) : translate("platform.failedProvisionCompany");
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (!canProvision) {
    return (
      <MainContent
        title={translate("navigation.provisionCompany")}
        subtitle={translate("platform.provisionSubtitle")}
      >
        <ErrorState message={translate("platform.platformAdminOnly")} />
      </MainContent>
    );
  }

  if (submitting) {
    return (
      <MainContent
        title={translate("navigation.provisionCompany")}
        subtitle={translate("platform.provisionSubtitle")}
      >
        <div className="mx-auto w-full max-w-2xl">
          <Card title={translate("platform.companyAndAdministrator")}>
            <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
              Creating the organization and administrator account…
            </p>
            <SkeletonForm fields={6} />
          </Card>
        </div>
      </MainContent>
    );
  }

  return (
    <MainContent
      title={translate("navigation.provisionCompany")}
      subtitle={translate("platform.provisionSubtitle")}
      actions={
        <Link href="/platform/companies">
          <Button type="button" variant="secondary">
            View Companies
          </Button>
        </Link>
      }
    >
      <div className="mx-auto w-full max-w-2xl">
        <Card title={translate("platform.companyAndAdministrator")}>
          {error ? <div className="alert-error mb-4 px-3 py-2">{error}</div> : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="company_name"
              label={translate("platform.companyNameLabel")}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              placeholder="e.g. Example Company Ltd"
            />

            <Input
              id="company_code"
              label={translate("platform.companyCode")}
              hint={translate("platform.companyCodeHint")}
              value={companyCode}
              onChange={(e) => setCompanyCode(e.target.value)}
              placeholder="e.g. cqin-001"
            />

            <Input
              id="branch_limit"
              label={translate("platform.branchLimit")}
              hint={translate("platform.branchLimitHint")}
              type="number"
              min={0}
              inputMode="numeric"
              value={branchLimit}
              onChange={(e) => setBranchLimit(e.target.value)}
              placeholder={translate("platform.leaveBlankUnlimited")}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                id="admin_first_name"
                label={translate("platform.administratorFirstName")}
                value={adminFirstName}
                onChange={(e) => setAdminFirstName(e.target.value)}
                required
                placeholder="Brony"
              />
              <Input
                id="admin_last_name"
                label={translate("platform.administratorLastName")}
                value={adminLastName}
                onChange={(e) => setAdminLastName(e.target.value)}
                required
                placeholder="Hans"
              />
            </div>

            <Input
              id="admin_email"
              label={translate("platform.administratorEmailLabel")}
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              required
              placeholder="admin@company.com"
            />

            <Input
              id="temporary_password"
              label={translate("platform.temporaryPassword")}
              type="password"
              hint={translate("platform.temporaryPasswordHint")}
              value={temporaryPassword}
              onChange={(e) => setTemporaryPassword(e.target.value)}
              required
              placeholder={translate("platform.atLeast6")}
            />

            <div
              className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end"
              style={{ borderColor: "var(--border-soft)" }}
            >
              <Link href="/platform/companies" className="sm:mr-auto">
                <Button type="button" variant="secondary" className="w-full sm:w-auto">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" loading={submitting} disabled={!canSubmit} className="w-full sm:w-auto">
                Provision Company
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </MainContent>
  );
}
