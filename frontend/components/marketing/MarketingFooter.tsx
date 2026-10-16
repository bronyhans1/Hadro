"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/lib/branding";
import { MARKETING, MARKETING_NAV, MARKETING_ROUTES } from "@/lib/marketing/siteConfig";
import { StoreBadges } from "./StoreBadges";
import { cn } from "@/lib/design-system/cn";
import { marketingText } from "@/lib/marketing/text";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type IconProps = { className?: string };

function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.73a8.19 8.19 0 0 0 4.76 1.52V6.8a4.84 4.84 0 0 1-1-.11z" />
    </svg>
  );
}

function LinkedInIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8.5h4V23h-4V8.5zM8.5 8.5h3.8v2h.05c.53-1 1.82-2.05 3.75-2.05 4.01 0 4.75 2.64 4.75 6.07V23h-4v-6.6c0-1.57-.03-3.6-2.2-3.6-2.2 0-2.54 1.72-2.54 3.49V23h-4V8.5z" />
    </svg>
  );
}

function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function YouTubeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.56A3.02 3.02 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.14C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.56a3.02 3.02 0 0 0 2.12-2.14A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z" />
    </svg>
  );
}

const SOCIAL = [
  { labelKey: "footer.instagram", href: MARKETING.social.instagram, Icon: InstagramIcon },
  { labelKey: "footer.tiktok", href: MARKETING.social.tiktok, Icon: TikTokIcon },
  { labelKey: "footer.linkedin", href: MARKETING.social.linkedin, Icon: LinkedInIcon },
  { labelKey: "footer.x", href: MARKETING.social.x, Icon: XIcon },
  { labelKey: "footer.youtube", href: MARKETING.social.youtube, Icon: YouTubeIcon },
] as const;

export function MarketingFooter() {
  const pathname = usePathname() || "/";

  return (
    <footer className="relative z-[2] mt-auto border-t border-[var(--mkt-border)] bg-[var(--mkt-surface)]">
      <div className="mkt-container py-10 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm font-semibold text-[var(--mkt-ink)]">{BRAND.appName}</p>
            <p className="mkt-body mt-3 text-sm">
              {marketingText("footer.blurb")}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--mkt-gray)]">{marketingText("footer.navigate")}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {MARKETING_NAV.map((item) => {
                const active = !item.comingSoon && isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    {item.comingSoon ? (
                      <span className="text-[var(--mkt-gray)]">{item.label}</span>
                    ) : (
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "hover:text-[var(--mkt-ink)]",
                          active ? "font-semibold text-[var(--mkt-royal)]" : "text-[var(--mkt-ink-soft)]"
                        )}
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                );
              })}
              <li>
                <Link
                  href={MARKETING_ROUTES.requestAccess}
                  aria-current={isActive(pathname, MARKETING_ROUTES.requestAccess) ? "page" : undefined}
                  className={cn(
                    "hover:text-[var(--mkt-ink)]",
                    isActive(pathname, MARKETING_ROUTES.requestAccess)
                      ? "font-semibold text-[var(--mkt-royal)]"
                      : "text-[var(--mkt-ink-soft)]"
                  )}
                >
                  {marketingText("cta.requestAccess")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--mkt-gray)]">{marketingText("footer.legalContact")}</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href={MARKETING.legal.privacy} className="text-[var(--mkt-ink-soft)] hover:text-[var(--mkt-ink)]">
                  {marketingText("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link href={MARKETING.legal.terms} className="text-[var(--mkt-ink-soft)] hover:text-[var(--mkt-ink)]">
                  {marketingText("footer.terms")}
                </Link>
              </li>
              <li>
                <Link
                  href={MARKETING_ROUTES.contact}
                  aria-current={isActive(pathname, MARKETING_ROUTES.contact) ? "page" : undefined}
                  className={cn(
                    "hover:text-[var(--mkt-ink)]",
                    isActive(pathname, MARKETING_ROUTES.contact)
                      ? "font-semibold text-[var(--mkt-royal)]"
                      : "text-[var(--mkt-ink-soft)]"
                  )}
                >
                  {marketingText("cta.contact")}
                </Link>
              </li>
              <li>
                <Link
                  href={MARKETING_ROUTES.support}
                  aria-current={isActive(pathname, MARKETING_ROUTES.support) ? "page" : undefined}
                  className={cn(
                    "hover:text-[var(--mkt-ink)]",
                    isActive(pathname, MARKETING_ROUTES.support)
                      ? "font-semibold text-[var(--mkt-royal)]"
                      : "text-[var(--mkt-ink-soft)]"
                  )}
                >
                  {marketingText("cta.support")}
                </Link>
              </li>
              <li>
                <a href={`mailto:${MARKETING.contactEmail}`} className="text-[var(--mkt-ink-soft)] hover:text-[var(--mkt-ink)]">
                  {MARKETING.contactEmail}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--mkt-gray)]">{marketingText("footer.downloadSocial")}</p>
            <div className="mt-4">
              <StoreBadges layout="row" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2" aria-label={marketingText("footer.social")}>
              {SOCIAL.map(({ labelKey, href, Icon }) => (
                <a
                  key={labelKey}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={marketingText(labelKey)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--mkt-radius-md)] border border-[var(--mkt-border)] bg-[var(--mkt-surface)] text-[var(--mkt-ink-soft)] transition-[color,background-color,border-color,transform] duration-[var(--mkt-duration-fast)] ease-[var(--mkt-ease)] hover:border-[var(--mkt-royal)]/30 hover:bg-[var(--mkt-sky)] hover:text-[var(--mkt-royal)] hover:scale-[1.04]"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-[var(--mkt-border)] pt-6 text-sm text-[var(--mkt-gray)]">
          <span>
            © {new Date().getFullYear()} {BRAND.companyName}. {marketingText("footer.rights")}
          </span>
        </div>
      </div>
    </footer>
  );
}
