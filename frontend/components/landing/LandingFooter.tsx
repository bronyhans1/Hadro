"use client";

import Link from "next/link";
import { BRAND } from "@/lib/branding";
import { MARKETING } from "@/lib/marketing/siteConfig";

const SOCIAL_LINKS = [
  { key: "instagram", label: "Instagram", href: MARKETING.social.instagram },
  { key: "tiktok", label: "TikTok", href: MARKETING.social.tiktok },
  { key: "linkedin", label: "LinkedIn", href: MARKETING.social.linkedin },
  { key: "x", label: "X", href: MARKETING.social.x },
  { key: "youtube", label: "YouTube", href: MARKETING.social.youtube },
] as const;

export function LandingFooter() {
  return (
    <footer className="mt-auto border-t" style={{ borderColor: "var(--border-soft)" }}>
      <div className="landing-footer-surface mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm font-semibold text-theme">HADRO</p>
            <p className="mt-2 text-sm leading-relaxed text-theme-muted">
              {BRAND.descriptor} for attendance, leave, payroll visibility, and operational oversight.
            </p>
            <p className="mt-4 text-xs text-theme-muted">{BRAND.versionLabel}</p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-theme-muted">Navigate</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href="#features" className="text-theme-muted hover:text-theme">
                  Features
                </a>
              </li>
              <li>
                <a href="#industries" className="text-theme-muted hover:text-theme">
                  Industries
                </a>
              </li>
              <li>
                <a href="#get-access" className="text-theme-muted hover:text-theme">
                  Request access
                </a>
              </li>
              <li>
                <Link href="/login" className="text-theme-muted hover:text-theme">
                  Sign in
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-theme-muted">Legal & contact</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href={MARKETING.legal.privacy} className="text-theme-muted hover:text-theme">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href={MARKETING.legal.terms} className="text-theme-muted hover:text-theme">
                  Terms
                </Link>
              </li>
              <li>
                <a href={`mailto:${MARKETING.contactEmail}`} className="text-theme-muted hover:text-theme">
                  {MARKETING.contactEmail}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-theme-muted">Download & social</p>
            <div className="mt-3 flex flex-col gap-2">
              <a
                href={MARKETING.appStoreUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold text-theme transition-colors hover:bg-[var(--nav-hover)]"
                style={{ borderColor: "var(--border-soft)" }}
              >
                Download on the App Store
              </a>
              <a
                href={MARKETING.playStoreUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold text-theme transition-colors hover:bg-[var(--nav-hover)]"
                style={{ borderColor: "var(--border-soft)" }}
              >
                Get it on Google Play
              </a>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2 text-xs">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.key}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-theme-muted hover:text-theme"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div
          className="mt-10 flex flex-col gap-2 border-t pt-6 text-sm text-theme-muted sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: "var(--border-soft)" }}
        >
          <span>© {new Date().getFullYear()} {BRAND.companyName}. All rights reserved.</span>
          <span>{BRAND.versionLabel}</span>
        </div>
      </div>
    </footer>
  );
}
