"use client";

import { useEffect, useState } from "react";
import { MainContent } from "@/components/layout/MainContent";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { SkeletonForm } from "@/components/ui/Skeleton";
import * as platformApi from "@/lib/api/platform.api";
import { isApiError } from "@/lib/types/api";
import { safeApi } from "@/lib/api/safeApi";
import { useSuccessBanner } from "@/hooks/useSuccessBanner";
import { translate } from "@/lib/i18n";

export default function PlatformSettingsPage() {
  const success = useSuccessBanner();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supportEmail, setSupportEmail] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [supportWhatsAppUrl, setSupportWhatsAppUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await safeApi(platformApi.getSupportSettings());
        if (cancelled) return;
        if (isApiError(res)) {
          setError(res.error ?? translate("settings.failedLoadSupport"));
          return;
        }
        const d = res.data;
        setSupportEmail(d?.support_email ?? "");
        setSupportPhone(d?.support_phone ?? "");
        setSupportWhatsAppUrl(d?.support_whatsapp_url ?? "");
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : translate("settings.failedLoadSupport"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    success.clearSuccess();
    const res = await safeApi(
      platformApi.updateSupportSettings({
        support_email: supportEmail.trim() || null,
        support_phone: supportPhone.trim() || null,
        support_whatsapp_url: supportWhatsAppUrl.trim() || null,
      })
    );
    setSaving(false);
    if (isApiError(res)) {
      setError(res.error ?? translate("settings.failedSaveSupport"));
      return;
    }
    success.showSuccess({
      title: translate("leave.changesSaved"),
      description: translate("settings.supportSaved"),
    });
  }

  return (
    <MainContent
      title={translate("navigation.systemSettings")}
      subtitle={translate("settings.platformSubtitle")}
    >
      <Card title={translate("settings.supportContacts")}>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {translate("settings.supportContactsHelp")}
        </p>

        {error ? <div className="alert-error mt-3 px-3 py-2">{error}</div> : null}
        <div className="mt-3">{success.banner}</div>

        {loading ? (
          <SkeletonForm fields={3} className="mt-4 max-w-lg" />
        ) : (
          <div className="mt-4 grid max-w-lg gap-4">
            <Input
              id="support_email"
              label={translate("settings.supportEmail")}
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder={translate("settings.supportEmailPlaceholder")}
            />
            <Input
              id="support_phone"
              label={translate("settings.supportPhone")}
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
              placeholder={translate("settings.supportPhonePlaceholder")}
            />
            <Input
              id="support_whatsapp_url"
              label={translate("settings.whatsappUrl")}
              hint={translate("settings.whatsappHint")}
              value={supportWhatsAppUrl}
              onChange={(e) => setSupportWhatsAppUrl(e.target.value)}
              placeholder={translate("settings.whatsappPlaceholder")}
            />
            <div className="pt-1">
              <Button type="button" onClick={() => void save()} loading={saving}>
                {translate("settings.saveSupportSettings")}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </MainContent>
  );
}
