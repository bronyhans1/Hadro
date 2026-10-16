"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/lib/branding";
import { MARKETING_NAV, MARKETING_ROUTES } from "@/lib/marketing/siteConfig";
import { BrandLockup } from "@/components/brand/BrandMark";
import { MarketingLinkButton } from "./MarketingLinkButton";
import { MarketingThemeToggle } from "./MarketingThemeToggle";
import { LanguageSelector } from "@/components/i18n/LanguageSelector";
import { cn } from "@/lib/design-system/cn";
import { translate } from "@/lib/i18n";
import { marketingText } from "@/lib/marketing/text";

type Props = {
  /** When true, comingSoon nav items remain visible but non-navigating. */
  previewMode?: boolean;
};

function isNavActive(pathname: string, href: string): boolean {
  if (href === MARKETING_ROUTES.home) return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MarketingNav({ previewMode = false }: Props) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname() || "/";
  const requestAccessActive = isNavActive(pathname, MARKETING_ROUTES.requestAccess);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-[var(--mkt-duration)] ease-[var(--mkt-ease)]",
        scrolled
          ? "border-[var(--mkt-border)] bg-[var(--mkt-glass)] shadow-[var(--mkt-header-shadow)] backdrop-blur-xl"
          : "border-transparent bg-[var(--mkt-glass)]/80 backdrop-blur-md"
      )}
    >
      <div className="mkt-container flex h-[4.25rem] items-center justify-between gap-3">
        <Link
          href={MARKETING_ROUTES.home}
          className="inline-flex min-w-0 shrink-0 items-center overflow-visible py-1 pr-2"
          aria-label={marketingText("nav.homeLink", { values: { brand: BRAND.appName } })}
        >
          <BrandLockup
            size="header"
            priority
            showDescriptor
            wordmarkClassName="truncate text-[var(--mkt-ink)]"
            descriptorClassName="max-[359px]:hidden text-[var(--mkt-gray)]"
          />
        </Link>

        <nav
          className="hidden items-center gap-0.5 xl:flex"
          aria-label={marketingText("nav.marketing")}
        >
          {MARKETING_NAV.map((item) => {
            const disabled = item.comingSoon && !previewMode;
            const active = !disabled && isNavActive(pathname, item.href);
            if (disabled) {
              return (
                <span
                  key={item.href}
                  className="whitespace-nowrap rounded-lg px-2.5 py-2 text-[13px] font-medium text-[var(--mkt-gray)]"
                  title={marketingText("nav.comingSoon")}
                >
                  {item.label}
                </span>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-[var(--mkt-sky)] text-[var(--mkt-royal)]"
                    : "text-[var(--mkt-ink-soft)] hover:bg-[var(--mkt-sky)] hover:text-[var(--mkt-ink)]"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 xl:flex">
          <LanguageSelector />
          <MarketingThemeToggle />
          <MarketingLinkButton href={MARKETING_ROUTES.login} variant="ghost" size="md" className="whitespace-nowrap">
            {translate("common.signIn")}
          </MarketingLinkButton>
          <MarketingLinkButton
            href={MARKETING_ROUTES.requestAccess}
            size="md"
            className="whitespace-nowrap"
            aria-current={requestAccessActive ? "page" : undefined}
          >
            {marketingText("cta.requestAccess")}
          </MarketingLinkButton>
        </div>

        <div className="flex items-center gap-2 xl:hidden">
          <MarketingThemeToggle />
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--mkt-border)] text-[var(--mkt-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mkt-focus-ring)]"
            aria-expanded={open}
            aria-controls="mkt-mobile-nav"
            aria-label={open ? marketingText("nav.closeMenu") : marketingText("nav.openMenu")}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? marketingText("nav.closeMenu") : marketingText("nav.openMenu")}</span>
            <span aria-hidden className="relative flex h-4 w-5 flex-col justify-between">
              <span
                className={cn(
                  "block h-0.5 w-5 origin-center bg-current transition-transform duration-[var(--mkt-duration-fast)]",
                  open && "translate-y-[7px] rotate-45"
                )}
              />
              <span
                className={cn(
                  "block h-0.5 w-5 bg-current transition-opacity duration-[var(--mkt-duration-fast)]",
                  open && "opacity-0"
                )}
              />
              <span
                className={cn(
                  "block h-0.5 w-5 origin-center bg-current transition-transform duration-[var(--mkt-duration-fast)]",
                  open && "-translate-y-[7px] -rotate-45"
                )}
              />
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div id="mkt-mobile-nav" className="border-t border-[var(--mkt-border)] xl:hidden">
          <div className="mkt-container flex flex-col gap-1 py-4">
            {MARKETING_NAV.map((item) => {
              const disabled = item.comingSoon && !previewMode;
              const active = !disabled && isNavActive(pathname, item.href);
              if (disabled) {
                return (
                  <span key={item.href} className="px-2 py-2.5 text-sm text-[var(--mkt-gray)]">
                    {item.label}
                  </span>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-lg px-2 py-2.5 text-sm font-medium",
                    active
                      ? "bg-[var(--mkt-sky)] text-[var(--mkt-royal)]"
                      : "text-[var(--mkt-ink)] hover:bg-[var(--mkt-sky)]"
                  )}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            <LanguageSelector variant="list" className="mt-2 border-t border-[var(--mkt-border)] pt-3" />
            <div className="mt-3 flex flex-col gap-2">
              <MarketingLinkButton href={MARKETING_ROUTES.login} variant="secondary">
                {translate("common.signIn")}
              </MarketingLinkButton>
              <MarketingLinkButton
                href={MARKETING_ROUTES.requestAccess}
                aria-current={requestAccessActive ? "page" : undefined}
              >
                {marketingText("cta.requestAccess")}
              </MarketingLinkButton>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
