"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchableNavItem } from "@/lib/navigation/types";
import { navText } from "@/lib/navigation/navText";
import { translate } from "@/lib/i18n";
import { NavIcon } from "@/lib/navigation/navIcons";
import { Search } from "lucide-react";

interface GlobalSearchProps {
  items: SearchableNavItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase();
}

function matchesItem(item: SearchableNavItem, query: string): boolean {
  if (!query) return true;
  const label = navText(item.labelKey, item.label);
  const section = item.section ? navText(item.sectionKey, item.section) : "";
  const haystack = [label, item.label, section, item.section, ...(item.keywords ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query) || label.toLowerCase().includes(query) || item.label.toLowerCase().includes(query);
}

export function GlobalSearch({ items, open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = normalizeQuery(query);
    return items.filter((item) => matchesItem(item, q)).slice(0, 12);
  }, [items, query]);

  const close = useCallback(() => {
    onOpenChange(false);
    setQuery("");
    setActiveIndex(0);
  }, [onOpenChange]);

  const navigate = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router]
  );

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      // Autofill / IME / password-manager events may omit a string `key`.
      if (typeof e.key !== "string") return;
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && results[activeIndex]) {
        e.preventDefault();
        navigate(results[activeIndex].href);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, results, activeIndex, close, navigate]);

  if (!open) return null;

  return (
    <div
      className="command-palette-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="command-palette-panel"
        role="dialog"
        aria-modal="true"
        aria-label={navText("common.globalSearch", "Global search")}
      >
        <div
          className="flex items-center gap-2 border-b px-3"
          style={{ borderColor: "var(--ds-color-border)" }}
        >
          <Search
            className="h-4 w-4 shrink-0"
            style={{ color: "var(--ds-color-text-muted)" }}
            aria-hidden
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={translate("common.searchModules")}
            className="h-12 w-full bg-transparent text-sm outline-none ds-focus-ring rounded"
            style={{ color: "var(--ds-color-text-primary)" }}
            aria-label={navText("common.search", "Search")}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls="global-search-results"
            aria-activedescendant={
              results.length > 0 ? `global-search-option-${activeIndex}` : undefined
            }
            autoComplete="off"
          />
          <kbd className="app-header-kbd">Esc</kbd>
        </div>

        <div
          id="global-search-results"
          className="max-h-80 overflow-y-auto p-2"
          role="listbox"
          aria-label={navText("common.searchResults", "Search results")}
        >
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm" style={{ color: "var(--ds-color-text-muted)" }}>
              No matching modules. Employee and payroll search will be added in a later phase.
            </p>
          ) : (
            <ul role="presentation">
              {results.map((item, index) => (
                <li
                  id={`global-search-option-${index}`}
                  key={item.href}
                  role="option"
                  aria-selected={index === activeIndex}
                >
                  <button
                    type="button"
                    onClick={() => navigate(item.href)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors"
                    style={{
                      background:
                        index === activeIndex ? "var(--ds-color-primary-muted)" : "transparent",
                      color: "var(--ds-color-text-primary)",
                    }}
                  >
                    <NavIcon href={item.href} className="h-4 w-4" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{navText(item.labelKey, item.label)}</span>
                      {item.section ? (
                        <span className="block truncate text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
                          {navText(item.sectionKey, item.section)}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          className="border-t px-3 py-2 text-xs"
          style={{ borderColor: "var(--ds-color-border)", color: "var(--ds-color-text-muted)" }}
        >
          {navText("common.searchHint", "Navigate with ↑↓ · Enter to open · Esc to close")}
        </div>
      </div>
    </div>
  );
}

/** Registers Ctrl/Cmd+K to open global search. */
export function useGlobalSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Autofill / IME / password-manager events may omit a string `key`.
      if (typeof e.key !== "string") return;
      const isK = e.key.toLowerCase() === "k";
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || !isK) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;
      e.preventDefault();
      onOpen();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onOpen]);
}

interface GlobalSearchTriggerProps {
  onClick: () => void;
}

export function GlobalSearchTrigger({ onClick }: GlobalSearchTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="app-header-search-trigger ds-focus-ring"
      aria-label={navText("common.openGlobalSearch", "Open global search (Ctrl+K)")}
    >
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <span className="truncate">{navText("common.searchEllipsis", "Search…")}</span>
      <span className="app-header-kbd">
        <span>Ctrl</span>
        <span>K</span>
      </span>
    </button>
  );
}
