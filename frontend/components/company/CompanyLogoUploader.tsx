"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CompanyLogoMark } from "@/components/company/CompanyLogoMark";
import { Button } from "@/components/ui/Button";
import {
  COMPANY_LOGO_ACCEPT,
  uploadCompanyLogo,
  validateCompanyLogoFile,
} from "@/lib/storage/companyAssets";
import { translate } from "@/lib/i18n";

type Props = {
  companyId: string;
  companyName: string;
  logoUrl: string | null;
  initials?: string | null;
  /** When false, show mark only (employees / read-only). */
  canEdit: boolean;
  /**
   * Persist logo URL to company profile (PATCH). Called after successful storage upload
   * or when clearing the logo. Parent should refresh auth/header after resolve.
   */
  persistLogoUrl: (logoUrl: string | null) => Promise<void>;
};

/**
 * Company logo picker with validation, local preview, and immediate persist after confirm.
 * Storage path is always `company-logos/<company_id>/logo.<ext>` (shared tenant + platform).
 */
export function CompanyLogoUploader({
  companyId,
  companyName,
  logoUrl,
  initials,
  canEdit,
  persistLogoUrl,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  function clearPending() {
    setPendingFile(null);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onFileChosen(file: File | undefined) {
    if (!file) return;
    const result = validateCompanyLogoFile(file);
    if (!result.ok) {
      setLocalError(result.error);
      setPendingFile(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setLocalError(null);
    setPendingFile(file);
  }

  async function confirmUpload() {
    if (!pendingFile || !canEdit) return;
    setBusy(true);
    setLocalError(null);
    const uploaded = await uploadCompanyLogo(companyId, pendingFile);
    if (!uploaded.ok) {
      setBusy(false);
      setLocalError(uploaded.error);
      return;
    }
    try {
      await persistLogoUrl(uploaded.publicUrl);
      clearPending();
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : translate("profile.failedSaveLogo"));
    } finally {
      setBusy(false);
    }
  }

  async function removeSavedLogo() {
    if (!canEdit) return;
    setBusy(true);
    setLocalError(null);
    try {
      await persistLogoUrl(null);
      clearPending();
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : translate("profile.failedRemoveLogo"));
    } finally {
      setBusy(false);
    }
  }

  const displayUrl = previewUrl ?? logoUrl;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <CompanyLogoMark
        name={companyName}
        logoUrl={displayUrl}
        initials={initials}
        size="lg"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-theme">{translate("profile.companyLogo")}</p>
        <p className="mt-0.5 text-xs text-theme-muted">
          {translate("profile.companyLogoHelp")}
        </p>
        <p className="mt-2 text-xs text-theme-muted">
          {translate("profile.companyLogoSpec")}
        </p>

        {canEdit ? (
          <div className="mt-3 space-y-2">
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept={COMPANY_LOGO_ACCEPT}
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                onFileChosen(e.target.files?.[0]);
              }}
            />

            {pendingFile ? (
              <div
                className="rounded-lg border p-3"
                style={{ borderColor: "var(--border-soft)", background: "var(--surface-muted)" }}
              >
                <p className="text-xs font-medium text-theme">{translate("profile.logoNotSaved")}</p>
                <p className="mt-0.5 truncate text-xs text-theme-muted">{pendingFile.name}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    loading={busy}
                    onClick={() => void confirmUpload()}
                  >
                    {translate("profile.uploadLogo")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => inputRef.current?.click()}
                  >
                    {translate("profile.chooseAnother")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={clearPending}
                  >
                    {translate("common.cancel")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={clearPending}
                  >
                    {translate("payroll.remove")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => inputRef.current?.click()}
                >
                  {logoUrl ? translate("profile.replaceLogo") : translate("profile.chooseLogo")}
                </Button>
                {logoUrl ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    loading={busy}
                    onClick={() => void removeSavedLogo()}
                  >
                    {translate("profile.removeLogo")}
                  </Button>
                ) : null}
              </div>
            )}

            {localError ? (
              <p className="text-xs font-medium" style={{ color: "var(--state-error)" }}>
                {localError}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
