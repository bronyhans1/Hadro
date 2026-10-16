"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { ChevronDown } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useAuth } from "@/lib/auth/AuthContext";
import { updateMyProfile } from "@/lib/api/auth.api";
import { useToast } from "@/components/ui/ToastProvider";
import { cn } from "@/lib/design-system/cn";
import { LOCALE_META, SUPPORTED_LOCALES, rememberAccountLocale, rememberGuestLocale, translate, type Locale } from "@/lib/i18n";
import { browserLocaleSession } from "@/lib/i18n/storage";

type Props = {
  /** Compact header control, or the full list used inside the mobile menu. */
  variant?: "compact" | "list";
  className?: string;
};

/**
 * Language names come from locale metadata, not the translation catalog,
 * so the list stays readable while other locales still fall back to English.
 */
export function LanguageSelector({ variant = "compact", className }: Props) {
  const { locale, setPreference } = useLocale();
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const currentName = LOCALE_META[locale].nativeName;

  useEffect(() => {
    if (!open || variant !== "compact") return;
    const index = SUPPORTED_LOCALES.indexOf(locale);
    setActiveIndex(index >= 0 ? index : 0);
    listRef.current?.focus();
  }, [open, variant, locale]);

  useEffect(() => {
    if (!open || variant !== "compact") return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (listRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, variant]);

  async function choose(next: Locale) {
    await setPreference(next);
    setOpen(false);
    if (variant === "compact") buttonRef.current?.focus();
    if (!user) {
      await rememberGuestLocale(browserLocaleSession, next);
      return;
    }
    await rememberAccountLocale(browserLocaleSession, next);
    const res = await updateMyProfile({ language: next });
    if (!res.success) {
      toast.error(translate("settings.failedSaveLanguage"));
      return;
    }
    await refreshUser();
  }

  function onListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % SUPPORTED_LOCALES.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + SUPPORTED_LOCALES.length) % SUPPORTED_LOCALES.length);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(SUPPORTED_LOCALES.length - 1);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const next = SUPPORTED_LOCALES[activeIndex];
      if (next) void choose(next);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    }
  }

  if (variant === "list") {
    return (
      <div className={className}>
        <p id={`${listId}-label`} className="px-2 text-xs font-bold uppercase tracking-wide text-[var(--mkt-gray)]">
          {translate("settings.language")}
        </p>
        <ul
          role="listbox"
          aria-labelledby={`${listId}-label`}
          aria-activedescendant={`${listId}-${locale}`}
          className="mt-2 grid grid-cols-2 gap-1"
        >
          {SUPPORTED_LOCALES.map((code) => {
            const selected = code === locale;
            const name = LOCALE_META[code].nativeName;
            return (
              <li key={code} role="presentation">
                <button
                  type="button"
                  id={`${listId}-${code}`}
                  role="option"
                  aria-selected={selected}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-start text-sm font-medium",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mkt-focus-ring)]",
                    selected
                      ? "bg-[var(--mkt-sky)] text-[var(--mkt-ink)]"
                      : "text-[var(--mkt-ink)] hover:bg-[var(--mkt-sky)]"
                  )}
                  onClick={() => void choose(code)}
                >
                  <span className="inline-block w-4 shrink-0" aria-hidden>
                    {selected ? "✓" : ""}
                  </span>
                  <span>{name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        className={cn(
          "inline-flex h-10 shrink-0 items-center gap-0.5 whitespace-nowrap rounded-[var(--mkt-radius-md)] border border-[var(--mkt-border)] bg-[var(--mkt-surface)] px-2 text-[13px] font-semibold uppercase tracking-wide text-[var(--mkt-ink)] shadow-[var(--mkt-shadow-soft)]",
          "hover:border-[var(--mkt-royal)]/25 hover:bg-[var(--mkt-sky)]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mkt-focus-ring)]"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={translate("settings.currentLanguage", { values: { language: currentName } })}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span>{locale.toUpperCase()}</span>
        <ChevronDown className="h-3 w-3 shrink-0" aria-hidden strokeWidth={2} />
      </button>
      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label={translate("settings.selectLanguage")}
          aria-activedescendant={`${listId}-${SUPPORTED_LOCALES[activeIndex]}`}
          onKeyDown={onListKeyDown}
          className="absolute end-0 top-full z-50 mt-2 min-w-[12rem] rounded-[var(--mkt-radius-md)] border border-[var(--mkt-border)] bg-[var(--mkt-surface)] p-1 shadow-[var(--mkt-shadow-soft)] outline-none"
        >
          {SUPPORTED_LOCALES.map((code, index) => {
            const selected = code === locale;
            const name = LOCALE_META[code].nativeName;
            return (
              <li key={code} role="presentation">
                <button
                  type="button"
                  id={`${listId}-${code}`}
                  role="option"
                  aria-selected={selected}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-start text-sm",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mkt-focus-ring)]",
                    index === activeIndex && "bg-[var(--mkt-sky)]",
                    selected ? "font-semibold text-[var(--mkt-ink)]" : "font-medium text-[var(--mkt-ink-soft)]"
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => void choose(code)}
                >
                  <span className="inline-block w-4 shrink-0" aria-hidden>
                    {selected ? "✓" : ""}
                  </span>
                  <span className="w-6 shrink-0 font-semibold">{code.toUpperCase()}</span>
                  <span>{name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
