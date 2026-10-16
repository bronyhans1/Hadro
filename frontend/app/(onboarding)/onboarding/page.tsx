"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, KeyRound, Cake, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  needsFirstLoginOnboarding,
  onboardingMissingDob,
  onboardingMissingPassword,
} from "@/lib/auth/onboarding";
import { getDefaultHomeRoute } from "@/lib/auth/roles";
import * as authApi from "@/lib/api/auth.api";
import { safeApi } from "@/lib/api/safeApi";
import { isApiError } from "@/lib/types/api";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { DateInput, Input } from "@/components/ui/FormControls";
import { useToast } from "@/components/ui/ToastProvider";
import { useSuccessBanner } from "@/hooks/useSuccessBanner";
import { LoadingState } from "@/components/ui/LoadingState";
import { BRAND } from "@/lib/branding";
import { translate } from "@/lib/i18n";

type Step = "password" | "dob" | "success";

export default function OnboardingPage() {
  const router = useRouter();
  const toast = useToast();
  const success = useSuccessBanner();
  const { user, isLoading, refreshUser } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [dob, setDob] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [stepOverride, setStepOverride] = useState<Step | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!needsFirstLoginOnboarding(user)) {
      router.replace(getDefaultHomeRoute(user.roles));
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (user?.dateOfBirth) setDob(user.dateOfBirth);
  }, [user?.dateOfBirth]);

  const step: Step = useMemo(() => {
    if (stepOverride === "success") return "success";
    if (!user) return "password";
    if (onboardingMissingPassword(user)) return "password";
    if (onboardingMissingDob(user)) return "dob";
    return "success";
  }, [user, stepOverride]);

  async function submitPassword() {
    if (!user) return;
    setError(null);
    if (password.trim().length < 8) {
      setError(translate("auth.passwordMinLength"));
      return;
    }
    if (password !== confirm) {
      setError(translate("auth.passwordsDoNotMatch"));
      return;
    }
    if (!supabase) {
      setError(translate("auth.passwordAuthNotConfigured"));
      return;
    }
    setSaving(true);
    const { error: passErr } = await supabase.auth.updateUser({ password: password.trim() });
    if (passErr) {
      setError(passErr.message);
      setSaving(false);
      return;
    }
    const mark = await safeApi(authApi.markPasswordChanged());
    if (isApiError(mark)) {
      setError(mark.error ?? translate("auth.passwordUpdatedUnconfirmed"));
      setSaving(false);
      return;
    }
    await refreshUser();
    setPassword("");
    setConfirm("");
    setSaving(false);
    success.showSuccess({
      title: "Changes Saved",
      description: translate("auth.passwordUpdatedSuccess"),
    });
  }

  async function submitDob() {
    if (!user) return;
    setError(null);
    if (!dob.trim()) {
      setError("Date of birth is required.");
      return;
    }
    setSaving(true);
    const res = await safeApi(
      authApi.updateMyProfile({
        date_of_birth: dob.trim(),
      })
    );
    if (isApiError(res)) {
      setError(res.error ?? "Failed to save date of birth.");
      setSaving(false);
      return;
    }
    await refreshUser();
    setSaving(false);
    success.showSuccess({
      title: "Changes Saved",
      description: "Your date of birth has been saved successfully.",
    });
    setStepOverride("success");
  }

  function finish() {
    if (!user) return;
    router.replace(getDefaultHomeRoute(user.roles));
  }

  useEffect(() => {
    if (step !== "success" || !user) return;
    // Auto-advance shortly after success if both requirements already satisfied
    if (!needsFirstLoginOnboarding(user) || stepOverride === "success") {
      const t = window.setTimeout(() => {
        router.replace(getDefaultHomeRoute(user.roles));
      }, 1600);
      return () => window.clearTimeout(t);
    }
  }, [step, user, stepOverride, router]);

  if (isLoading || !user) {
    return <LoadingState message="Preparing your account…" className="min-h-screen" />;
  }

  const firstName = user.firstName?.trim() || user.email.split("@")[0];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4 py-10">
      <div
        className="rounded-2xl border p-6 shadow-lg sm:p-8"
        style={{
          borderColor: "var(--ds-color-border)",
          background: "var(--ds-color-surface)",
          boxShadow: "var(--ds-shadow-card)",
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
          {BRAND.appName}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          {step === "success" ? "You're all set" : `Welcome, ${firstName}`}
        </h1>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {step === "password"
            ? translate("auth.setPasswordBeforeContinuing")
            : step === "dob"
              ? "Add your date of birth to finish setting up your account."
              : "Your account is ready. Taking you to the dashboard…"}
        </p>

        <div className="mt-4">{success.banner}</div>

        <ol className="mt-6 flex gap-2" aria-label="Onboarding progress">
          {[
            { id: "password", label: translate("auth.password"), icon: KeyRound },
            { id: "dob", label: "Date of birth", icon: Cake },
            { id: "success", label: "Done", icon: ShieldCheck },
          ].map((s) => {
            const active = step === s.id;
            const done =
              (s.id === "password" && step !== "password") ||
              (s.id === "dob" && step === "success") ||
              (s.id === "success" && step === "success");
            const Icon = s.icon;
            return (
              <li
                key={s.id}
                className="flex flex-1 flex-col items-center gap-1 rounded-xl border px-2 py-2 text-center"
                style={{
                  borderColor: active || done ? "color-mix(in srgb, var(--ds-color-primary) 40%, var(--border-soft))" : "var(--border-soft)",
                  background: active
                    ? "color-mix(in srgb, var(--ds-color-primary) 10%, var(--surface))"
                    : "var(--surface-muted)",
                  color: active || done ? "var(--ds-color-primary)" : "var(--text-muted)",
                }}
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span className="ds-label [color:inherit] sm:text-xs">{s.label}</span>
              </li>
            );
          })}
        </ol>

        {error ? (
          <p
            className="mt-4 rounded-lg border px-3 py-2 text-sm"
            style={{
              borderColor: "var(--state-error-border)",
              background: "var(--state-error-bg)",
              color: "var(--state-error-text)",
            }}
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {step === "password" ? (
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void submitPassword();
            }}
          >
            <Input
              label={translate("auth.newPassword")}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hint={translate("auth.passwordMinHint")}
            />
            <Input
              label={translate("auth.confirmPassword")}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              {translate("auth.showPasswords")}
            </label>
            <Button type="submit" loading={saving} className="w-full">
              {translate("auth.savePasswordContinue")}
            </Button>
          </form>
        ) : null}

        {step === "dob" ? (
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void submitDob();
            }}
          >
            <DateInput
              label="Date of birth"
              required
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
            />
            <Button type="submit" loading={saving} className="w-full">
              Save date of birth
            </Button>
          </form>
        ) : null}

        {step === "success" ? (
          <div className="mt-8 flex flex-col items-center text-center">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{
                background: "var(--state-success-bg)",
                color: "var(--state-success-text)",
              }}
            >
              <CheckCircle2 className="h-8 w-8" aria-hidden />
            </span>
            <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
              Profile setup complete.
            </p>
            <Button type="button" className="mt-6 w-full" onClick={finish}>
              Go to dashboard
            </Button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
