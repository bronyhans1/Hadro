"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatRolesList } from "@/lib/navigation/formatRoleLabel";
import * as authApi from "@/lib/api/auth.api";
import { isApiError } from "@/lib/types/api";
import { supabase } from "@/lib/supabase";
import { VERSION_LABEL } from "@/lib/release";
import { AvatarPhoto } from "@/components/ui/AvatarPhoto";
import { CompanyLogoMark } from "@/components/company/CompanyLogoMark";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { translate, LOCALE_META, SUPPORTED_LOCALES, isLocale, rememberAccountLocale } from "@/lib/i18n";
import { browserLocaleSession } from "@/lib/i18n/storage";
import { useLocale } from "@/components/providers/LocaleProvider";
import { DateInput, Input, Select } from "@/components/ui/FormControls";
import { useToast } from "@/components/ui/ToastProvider";
import { useSuccessBanner } from "@/hooks/useSuccessBanner";
import { safeApi } from "@/lib/api/safeApi";
import { toUserFacingApiError } from "@/lib/api/userFacingError";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ProfileDrawer({ open, onClose }: Props) {
  const { user, refreshUser } = useAuth();
  const { locale, setPreference: setLocalePreference } = useLocale();
  const toast = useToast();
  const success = useSuccessBanner();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [themePreference, setThemePreference] = useState<"light" | "dark" | "system">("system");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setPhoneNumber(user.phoneNumber ?? "");
    setDateOfBirth(user.dateOfBirth ?? "");
    setGender(user.gender ?? "");
    setPhotoUrl(user.profilePhotoUrl ?? "");
    setThemePreference(user.themePreference ?? "system");
    setPassword("");
    setPhotoFileName(null);
    setError(null);
  }, [user, open]);

  const roleLabel = useMemo(
    () => (user?.roles?.length ? formatRolesList(user.roles, ", ") : "—"),
    [user?.roles]
  );
  const isPlatformAdmin = !!user?.roles?.includes("PLATFORM_ADMIN");
  const checklist = useMemo(() => {
    if (!user) {
      return { items: [], completed: 0, total: 1 };
    }
    const c = user.profileCompletion;
    const requiredDone = !c.missingRequiredFields.includes("password");
    const dobDone = !c.missingRequiredFields.includes("date_of_birth");
    const phoneDone = !c.recommendedMissingFields.includes("phone_number");
    const genderDone = !c.recommendedMissingFields.includes("gender");
    const photoDone = !c.recommendedMissingFields.includes("profile_photo_url");
    const items = [
      { key: "password", label: translate("profile.passwordUpdated"), required: true, done: requiredDone },
      { key: "dob", label: translate("profile.dobProvided"), required: true, done: dobDone },
      { key: "phone", label: translate("profile.telephoneAdded"), required: false, done: phoneDone },
      { key: "gender", label: translate("profile.genderAdded"), required: false, done: genderDone },
      { key: "photo", label: translate("profile.photoAdded"), required: false, done: photoDone },
    ];
    const completed = items.filter((i) => i.done).length;
    return { items, completed, total: items.length };
  }, [user]);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = themePreference === "dark" || (themePreference === "system" && systemDark);
    root.classList.toggle("dark", dark);
    localStorage.setItem("hadro_theme_pref", themePreference);
  }, [themePreference, open]);

  if (!user) return null;

  async function handlePhotoUpload(file: File) {
    if (!user) return;
    if (!supabase) {
      setError(translate("profile.photoNotConfigured"));
      return;
    }
    setUploadingPhoto(true);
    setError(null);
    const extension = file.name.split(".").pop() || "jpg";
    const path = `profile-photos/${user.userId}-${Date.now()}.${extension}`;
    const { error: upErr } = await supabase.storage
      .from("profile-photos")
      .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
    if (upErr) {
      setUploadingPhoto(false);
      setError(upErr.message);
      return;
    }
    const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
    setPhotoUrl(data.publicUrl);
    setUploadingPhoto(false);
  }

  async function saveProfile() {
    setSaving(true);
    setError(null);
    const res = await safeApi(authApi.updateMyProfile({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone_number: phoneNumber.trim() || null,
      date_of_birth: dateOfBirth.trim() || null,
      gender: (gender || null) as "male" | "female" | "other" | "prefer_not_to_say" | null,
      profile_photo_url: photoUrl.trim() || null,
      theme_preference: themePreference,
    }));
    if (isApiError(res)) {
      setError(toUserFacingApiError(res.error, translate("profile.failedUpdate")));
      setSaving(false);
      return;
    }

    let passwordChanged = false;
    if (password.trim()) {
      if (!supabase) {
        setError(translate("settings.passwordSupabaseMissing"));
        setSaving(false);
        return;
      }
      const { error: passErr } = await supabase.auth.updateUser({ password: password.trim() });
      if (passErr) {
        setError(passErr.message);
        setSaving(false);
        return;
      }
      await safeApi(authApi.markPasswordChanged());
      passwordChanged = true;
    }

    await refreshUser();
    setPassword("");
    setSaving(false);
    if (passwordChanged) {
      success.showSuccess({
        title: translate("leave.changesSaved"),
        description: translate("auth.passwordUpdatedSuccess"),
      });
    } else {
      success.showSuccess({
        title: translate("leave.changesSaved"),
        description: translate("profile.profileSaved"),
      });
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={translate("profile.myProfile")}
      description={translate("profile.updateDetails")}
      size="md"
    >
        <div
          className="mb-4 rounded-xl border p-4"
          style={{ borderColor: "var(--border-soft)", background: "var(--surface-muted)" }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[var(--ds-color-primary-subtle)] text-[var(--ds-color-primary)]">
              {photoUrl ? (
                <AvatarPhoto
                  src={photoUrl}
                  alt={translate("profile.profileAlt")}
                  size={48}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-base font-semibold">
                  {(firstName?.[0] ?? user.email[0] ?? "U").toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium" style={{ color: "var(--text-primary)" }}>
                {[firstName, lastName].filter(Boolean).join(" ").trim() || user.email}
              </p>
              <p className="truncate text-sm" style={{ color: "var(--text-muted)" }}>{roleLabel}</p>
            </div>
          </div>
          <div className="mt-3 space-y-1 text-xs" style={{ color: "var(--text-muted)" }}>
            <p>{translate("profile.emailLine", { values: { email: user.email } })}</p>
            {isPlatformAdmin ? (
              <>
                <p>{translate("profile.scopePlatform")}</p>
                <p>{translate("profile.accessPlatformAdmin")}</p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <CompanyLogoMark
                    name={user.companyName || translate("profile.company")}
                    logoUrl={user.companyLogoUrl}
                    size="sm"
                  />
                  <p>{translate("profile.companyLine", { values: { name: user.companyName || "—" } })}</p>
                </div>
                <p>{translate("attendance.branch")}: {user.branch?.name ?? "—"}</p>
                <p>{translate("attendance.department")}: {user.department?.name ?? "—"}</p>
              </>
            )}
          </div>
        </div>

        {error ? (
          <p
            className="mb-3 rounded-lg border px-3 py-2 text-sm font-medium"
            style={{
              borderColor: "var(--state-error-border)",
              background: "var(--state-error-bg)",
              color: "var(--state-error-text)",
            }}
          >
            {error}
          </p>
        ) : null}
        <div className="mb-3">{success.banner}</div>

        <div className="mb-4 rounded-xl border p-3" style={{ borderColor: "var(--border-soft)", background: "var(--surface-muted)" }}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{translate("profile.profileCompletion")}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {checklist.completed}/{checklist.total}
            </p>
          </div>
          <div className="mb-3 h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--border-soft)" }}>
            <div
              className="h-full rounded bg-primary-600 transition-all duration-300"
              style={{ width: `${(checklist.completed / checklist.total) * 100}%` }}
            />
          </div>
          <ul className="space-y-1.5">
            {checklist.items.map((item) => (
              <li key={item.key} className="flex items-center justify-between text-xs">
                <span style={{ color: item.done ? "var(--text-primary)" : "var(--text-muted)" }}>
                  {item.done ? "✓" : "○"} {item.label}
                </span>
                {!item.done ? (
                  item.required ? (
                    <Badge variant="warning">{translate("profile.required")}</Badge>
                  ) : (
                    <Badge variant="neutral">{translate("profile.recommended")}</Badge>
                  )
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <Input label={translate("profile.firstName")} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <Input label={translate("profile.lastName")} value={lastName} onChange={(e) => setLastName(e.target.value)} />
          <Input label={translate("profile.telephone")} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
          <DateInput
            label={translate("profile.dateOfBirth")}
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />
          <Select
            label={translate("profile.genderLabel")}
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">{translate("profile.preferNotToSaySentence")}</option>
            <option value="male">{translate("profile.gender.male")}</option>
            <option value="female">{translate("profile.gender.female")}</option>
            <option value="other">{translate("profile.gender.other")}</option>
            <option value="prefer_not_to_say">{translate("profile.preferNotToSaySentence")}</option>
          </Select>
          <div>
            <p id="profile-photo-caption" className="mb-1 block text-sm font-medium" style={{ color: "var(--text-muted)" }}>
              {translate("profile.uploadPhoto")}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={photoInputRef}
                id="profile-photo-input"
                type="file"
                accept="image/*"
                className="sr-only"
                tabIndex={-1}
                aria-labelledby="profile-photo-caption"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setPhotoFileName(file.name);
                  void handlePhotoUpload(file);
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                aria-describedby="profile-photo-status"
                onClick={() => photoInputRef.current?.click()}
              >
                {translate("profile.chooseFile")}
              </Button>
              <span id="profile-photo-status" className="text-sm" style={{ color: "var(--text-muted)" }}>
                {photoFileName ?? translate("profile.noFileChosen")}
              </span>
            </div>
            {uploadingPhoto ? (
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{translate("profile.uploadingPhoto")}</p>
            ) : null}
          </div>
          <Select
            label={translate("settings.language")}
            value={locale}
            onChange={(e) => {
              const next = e.target.value;
              if (!isLocale(next)) return;
              void (async () => {
                await setLocalePreference(next);
                await rememberAccountLocale(browserLocaleSession, next);
                const res = await authApi.updateMyProfile({ language: next });
                if (isApiError(res)) {
                  setError(toUserFacingApiError(res.error, translate("settings.failedSaveLanguage")));
                  return;
                }
                await refreshUser();
              })();
            }}
          >
            {SUPPORTED_LOCALES.map((code) => (
              <option key={code} value={code}>
                {LOCALE_META[code].nativeName}
              </option>
            ))}
          </Select>
          <Select
            label={translate("settings.themePreference")}
            value={themePreference}
            onChange={(e) => setThemePreference(e.target.value as "light" | "dark" | "system")}
          >
            <option value="light">{translate("settings.light")}</option>
            <option value="dark">{translate("settings.dark")}</option>
            <option value="system">{translate("settings.system")}</option>
          </Select>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: "var(--text-muted)" }}>{translate("auth.newPassword")}</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pr-16"
                placeholder={translate("settings.leaveBlankKeepCurrent")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-2 my-auto h-7 rounded-lg px-2 text-xs font-medium transition-colors duration-150 hover:bg-[var(--nav-hover)]"
                style={{ color: "var(--text-muted)" }}
              >
                {showPassword ? translate("auth.hide") : translate("auth.show")}
              </button>
            </div>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              {translate("settings.passwordClearsFlag")}
            </p>
          </div>
          <Button
            type="button"
            onClick={saveProfile}
            loading={saving}
            size="lg"
            className="w-full"
          >
            {saving ? translate("leave.saving") : translate("profile.saveProfile")}
          </Button>
          <p className="pt-2 text-center ds-caption">
            {VERSION_LABEL}
          </p>
        </div>
    </Drawer>
  );
}
