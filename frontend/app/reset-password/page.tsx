"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BRAND } from "@/lib/branding";
import { translate } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { BrandLockup } from "@/components/brand/BrandMark";

const MIN_PASSWORD = 8;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const markSessionReady = useCallback(() => {
    setSessionReady(true);
    setInitializing(false);
    setInitError(null);
  }, []);

  const markInitFailed = useCallback((message: string) => {
    setSessionReady(false);
    setInitializing(false);
    setInitError(message);
  }, []);

  useEffect(() => {
    const sb = supabase;
    if (!sb) {
      markInitFailed(translate("auth.resetUnavailable"));
      return;
    }

    let cancelled = false;
    let settled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const settleReady = () => {
      if (cancelled || settled) return;
      settled = true;
      if (timeoutId) clearTimeout(timeoutId);
      markSessionReady();
    };

    const settleError = (message: string) => {
      if (cancelled || settled) return;
      settled = true;
      if (timeoutId) clearTimeout(timeoutId);
      markInitFailed(message);
    };

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event, session) => {
      if (cancelled || settled) return;
      if (
        session &&
        (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION")
      ) {
        settleReady();
      }
    });

    void (async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (code) {
          const { error: codeErr } = await sb.auth.exchangeCodeForSession(code);
          if (codeErr) {
            settleError(codeErr.message);
            return;
          }
          window.history.replaceState({}, "", `${url.origin}${url.pathname}${url.hash}`);
        }

        const {
          data: { session },
        } = await sb.auth.getSession();
        if (cancelled) return;
        if (session) {
          settleReady();
          return;
        }

        timeoutId = setTimeout(async () => {
          if (cancelled || settled) return;
          const {
            data: { session: later },
          } = await sb.auth.getSession();
          if (later) settleReady();
          else
            settleError(translate("auth.resetLinkInvalid"));
        }, 5000);
      } catch (e) {
        if (!cancelled && !settled) {
          settleError(e instanceof Error ? e.message : translate("auth.couldNotVerifyReset"));
        }
      }
    })();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [markInitFailed, markSessionReady]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!supabase) {
      setError(translate("auth.supabaseNotConfigured"));
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(translate("auth.passwordMinLength"));
      return;
    }
    if (password !== confirmPassword) {
      setError(translate("auth.passwordsDoNotMatch"));
      return;
    }
    setSubmitting(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password: password.trim() });
    setSubmitting(false);
    if (updateErr) {
      setError(updateErr.message);
      return;
    }
    await supabase.auth.signOut();
    setSuccess(true);
    router.replace("/login?reset=success");
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center overflow-x-clip px-3 py-8 sm:px-4 sm:py-12"
      style={{ background: "var(--app-bg)" }}
    >
      <div className="w-full min-w-0 max-w-md">
        <div
          className="rounded-2xl border p-5 sm:p-8"
          style={{ borderColor: "var(--border-soft)", background: "var(--surface)", boxShadow: "var(--shadow-soft)" }}
        >
          <div className="mb-6 text-center">
            <div className="mb-5 flex justify-center">
              <BrandLockup
                size="auth"
                layout="stacked"
                priority
                alt={`${BRAND.appName} logo`}
                wordmarkClassName="text-[1.25rem] text-[var(--text-primary)]"
              />
            </div>
            <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
              {translate("auth.setNewPassword")}
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              {translate("auth.chooseStrongPassword")}
            </p>
          </div>

          {success ? (
            <p className="text-center text-sm text-[var(--ds-color-success-text)]">
              {translate("auth.redirectingToSignIn")}
            </p>
          ) : initializing ? (
            <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
              {translate("auth.verifyingResetLink")}
            </p>
          ) : initError ? (
            <div className="space-y-4">
              <div className="alert-error px-3 py-2">{initError}</div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.push("/login")}
              >
                {translate("auth.backToSignIn")}
              </Button>
            </div>
          ) : sessionReady ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="alert-error px-3 py-2">{error}</div>
              )}
              <div>
                <label htmlFor="new-password" className="mb-1 block text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  {translate("auth.newPassword")}
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    minLength={MIN_PASSWORD}
                    className="input-field pr-20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-2 my-auto h-7 rounded px-2 text-xs font-medium hover:bg-black/5 ds-focus-ring"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {showPassword ? translate("auth.hide") : translate("auth.show")}
                  </button>
                </div>
              </div>
              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-1 block text-sm font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  {translate("auth.confirmPassword")}
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    minLength={MIN_PASSWORD}
                    className="input-field pr-20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute inset-y-0 right-2 my-auto h-7 rounded px-2 text-xs font-medium hover:bg-black/5 ds-focus-ring"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {showConfirm ? translate("auth.hide") : translate("auth.show")}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                loading={submitting}
                size="lg"
                className="w-full"
              >
                {submitting ? translate("auth.updatingPassword") : translate("auth.updatePassword")}
              </Button>
            </form>
          ) : null}

          <div
            className="mt-6 flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-0"
            style={{ color: "var(--text-muted)" }}
          >
            <Button
              type="button"
              variant="link"
              className="mx-auto sm:mx-0"
              onClick={() => router.push("/login")}
            >
              {translate("auth.backToSignIn")}
            </Button>
            <span className="text-center sm:text-right" style={{ opacity: 0.7 }}>
              {BRAND.versionLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
