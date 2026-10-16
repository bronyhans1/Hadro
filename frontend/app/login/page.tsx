"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { getDefaultHomeRoute } from "@/lib/auth/roles";
import { needsFirstLoginOnboarding } from "@/lib/auth/onboarding";
import { supabase } from "@/lib/supabase";
import { BRAND } from "@/lib/branding";
import { translate } from "@/lib/i18n";
import * as authApi from "@/lib/api/auth.api";
import { isApiError } from "@/lib/types/api";
import { Button } from "@/components/ui/Button";
import { BrandMark } from "@/components/brand/BrandMark";
import { WorkspaceTransitionLoader } from "@/components/auth/WorkspaceTransitionLoader";
import { SESSION_EXPIRED_REASON } from "@/lib/auth/sessionExpiry";

function useSyncHtmlThemeFromStorage() {
  useEffect(() => {
    const root = document.documentElement;
    function apply() {
      const raw = localStorage.getItem("hadro_theme_pref");
      const pref = raw === "light" || raw === "dark" || raw === "system" ? raw : "system";
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const dark = pref === "dark" || (pref === "system" && systemDark);
      root.classList.toggle("dark", dark);
    }
    apply();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
}

function LoginLegalFooter() {
  const year = new Date().getFullYear();
  return (
    <footer
      className="w-full max-w-lg shrink-0 px-2 pb-6 pt-3 text-center text-xs leading-snug sm:mx-auto sm:max-w-xl sm:px-4"
      style={{ color: "var(--text-muted)" }}
    >
      <p>{translate("auth.webCopyright")} {year}</p>
      <p className="mt-2 text-pretty">
        {translate("auth.agreePrefix")}{" "}
        <Link
          href="/terms"
          className="text-[var(--ds-color-primary)] underline-offset-2 transition-colors duration-150 hover:underline"
        >
          {translate("auth.termsOfService")}
        </Link>{" "}
        {translate("auth.and")}{" "}
        <Link
          href="/privacy"
          className="text-[var(--ds-color-primary)] underline-offset-2 transition-colors duration-150 hover:underline"
        >
          {translate("auth.privacyPolicy")}
        </Link>
        .
      </p>
    </footer>
  );
}

export default function LoginPage() {
  useSyncHtmlThemeFromStorage();
  const router = useRouter();
  const { login, user, isLoading, accountAccessBlocked, clearAccountAccessBlocked } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    if (q.get("reset") === "success") {
      setInfo(translate("auth.passwordUpdatedSignIn"));
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (q.get("reason") === SESSION_EXPIRED_REASON) {
      setSessionExpiredNotice(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      if (needsFirstLoginOnboarding(user)) {
        router.replace("/onboarding");
      } else {
        router.replace(getDefaultHomeRoute(user.roles));
      }
    }
  }, [user, isLoading, router]);

  /* Session bootstrap or post-auth navigation: full-screen HADRO transition (no login chrome). */
  if (isLoading || user) {
    return <WorkspaceTransitionLoader />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSessionExpiredNotice(false);
    clearAccountAccessBlocked();
    setSubmitting(true);
    const result = await login(email.trim(), password);
    setSubmitting(false);
    if (result.ok && result.roles?.length) {
      router.replace(result.needsOnboarding ? "/onboarding" : getDefaultHomeRoute(result.roles));
    } else if (!result.ok && !result.accessBlocked) {
      setError(result.error ?? translate("auth.loginFailed"));
    }
    /** When `result.accessBlocked`, only `accountAccessBlocked` from context is shown (single message). */
  }

  async function handleForgotPassword() {
    setError(null);
    setInfo(null);
    const normalized = email.trim();
    if (!normalized) {
      setError(translate("auth.forgotEmailFirst"));
      return;
    }
    if (!supabase) {
      setError(translate("auth.resetUnavailable"));
      return;
    }
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(normalized, {
      redirectTo,
    });
    if (resetErr) {
      setError(resetErr.message);
      return;
    }
    setInfo(translate("auth.resetLinkSent"));
  }

  return (
    <div className="login-page-shell flex min-h-screen flex-col overflow-x-clip px-3 sm:px-4">
      <div className="login-art-layer login-art-layer--light dark:hidden" aria-hidden />
      <div className="login-art-layer login-art-layer--dark hidden dark:block" aria-hidden />
      <div className="login-page-content flex w-full min-w-0 flex-1 items-center justify-center py-6 sm:py-8">
        <div className="w-full min-w-0 max-w-md">
          <div
            className="rounded-2xl border p-5 sm:p-8"
            style={{ borderColor: "var(--border-soft)", background: "var(--surface)", boxShadow: "var(--shadow-soft)" }}
          >
            <div className="mb-6 text-center">
              <div className="mb-4 flex justify-center">
                <BrandMark
                  size="login"
                  fit="contain"
                  priority
                  alt={`${BRAND.appName} logo`}
                />
              </div>
              <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>{translate("auth.welcomeBack")}</h1>
              <p className="mt-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
                {translate("auth.signInToContinue")}
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {sessionExpiredNotice && (
                <div
                  className="rounded-lg border px-3 py-2 text-sm"
                  style={{
                    borderColor: "var(--state-warning-border, var(--state-error-border))",
                    background: "var(--state-warning-bg, var(--state-error-bg))",
                    color: "var(--state-warning-text, var(--state-error-text))",
                  }}
                  role="status"
                >
                  <p className="font-semibold">{translate("auth.sessionExpiredTitle")}</p>
                  <p className="mt-1 leading-snug opacity-90">
                    {translate("auth.sessionExpiredBody")}
                  </p>
                </div>
              )}
              {(accountAccessBlocked?.message || error) && (
                <div
                  className="rounded-lg border px-3 py-2 text-sm font-medium"
                  style={{
                    borderColor: "var(--state-error-border)",
                    background: "var(--state-error-bg)",
                    color: "var(--state-error-text)",
                  }}
                  role="alert"
                >
                  {accountAccessBlocked?.message ?? error}
                </div>
              )}
              {info && (
                <div
                  className="rounded-lg border px-3 py-2 text-sm font-medium"
                  style={{
                    borderColor: "var(--state-success-border)",
                    background: "var(--state-success-bg)",
                    color: "var(--state-success-text)",
                  }}
                >
                  {info}
                </div>
              )}
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  {translate("auth.email")}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="input-field"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                    {translate("auth.password")}
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="input-field pr-20"
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
                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={handleForgotPassword}
                    className="text-xs"
                  >
                    {translate("auth.forgotPassword")}
                  </Button>
                </div>
              </div>
              <Button
                type="submit"
                size="lg"
                loading={submitting}
                className="w-full"
              >
                {submitting ? translate("auth.signingIn") : translate("auth.signIn")}
              </Button>
            </form>

            <div
              className="mt-6 flex flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-2"
              style={{ color: "var(--text-muted)" }}
            >
              <a
                href={`mailto:${BRAND.supportEmail}`}
                className="break-words text-center font-medium text-[var(--ds-color-primary)] transition-colors duration-150 hover:underline sm:text-left"
              >
                {translate("auth.needHelp")}
              </a>
              <span className="text-center sm:text-right" style={{ opacity: 0.7 }}>
                {BRAND.versionLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
      <LoginLegalFooter />
    </div>
  );
}
