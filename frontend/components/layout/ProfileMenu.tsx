"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useAuth } from "@/lib/auth/AuthContext";
import { isPlatformAdmin } from "@/lib/auth/roles";
import { formatRolesList } from "@/lib/navigation/formatRoleLabel";
import { AvatarPhoto } from "@/components/ui/AvatarPhoto";
import { CompanyLogoMark } from "@/components/company/CompanyLogoMark";
import { dropdownAnimation, motionVariants } from "@/lib/motion";
import { navText } from "@/lib/navigation/navText";

interface ProfileMenuProps {
  onOpenProfile: () => void;
  onSignOut: () => void;
  settingsHref: string;
}

export function ProfileMenu({ onOpenProfile, onSignOut, settingsHref }: ProfileMenuProps) {
  const { user } = useAuth();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!user) return null;

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.email;
  const roleLabel = formatRolesList(user.roles);
  const isPlatform = isPlatformAdmin(user.roles);
  const companyName = isPlatform ? navText("common.platformConsole", "Platform Console") : user.companyName?.trim() || "—";
  const branchName = isPlatform ? "—" : user.branch?.name?.trim() || navText("common.noBranchAssigned", "No branch assigned");
  const initial = (user.firstName?.[0] ?? user.email[0] ?? "U").toUpperCase();

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-w-0 max-w-[12rem] items-center gap-2 rounded-lg border px-2 py-1.5 transition-all duration-150 hover:bg-[var(--nav-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] sm:max-w-[14rem] sm:px-2.5"
        style={{ borderColor: "var(--border-soft)", background: "var(--surface-muted)" }}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={navText("common.userMenu", "User menu")}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--ds-color-primary-subtle)] text-xs font-semibold text-[var(--ds-color-primary)]">
          {user.profilePhotoUrl ? (
            <AvatarPhoto
              src={user.profilePhotoUrl}
              alt=""
              size={32}
              className="h-full w-full object-cover"
            />
          ) : (
            initial
          )}
        </div>
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {displayName}
          </span>
          <span className="block truncate text-xs" style={{ color: "var(--text-muted)" }}>
            {roleLabel}
          </span>
        </span>
        <svg
          className={`hidden h-4 w-4 shrink-0 sm:block ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--text-muted)", transition: "transform var(--ds-duration-fast)" }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {open ? (
        <m.div
          className="profile-menu-panel"
          role="menu"
          aria-label={navText("common.profileMenu", "Profile menu")}
          variants={motionVariants(reduced, dropdownAnimation)}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="border-b px-4 py-3" style={{ borderColor: "var(--ds-color-border)" }}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--ds-color-primary-subtle)] text-sm font-semibold text-[var(--ds-color-primary)]">
                {user.profilePhotoUrl ? (
                  <AvatarPhoto
                    src={user.profilePhotoUrl}
                    alt=""
                    size={40}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initial
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold" style={{ color: "var(--ds-color-text-primary)" }}>
                  {displayName}
                </p>
                <p className="truncate text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
                  {roleLabel}
                </p>
              </div>
            </div>
            <div className="mt-3 grid gap-2 text-xs">
              <div>
                <span className="font-semibold uppercase tracking-wide" style={{ color: "var(--ds-color-text-muted)" }}>
                  {navText("common.company", "Company")}
                </span>
                <div className="mt-1 flex items-center gap-2">
                  {!isPlatform ? (
                    <CompanyLogoMark name={companyName} logoUrl={user.companyLogoUrl} size="sm" />
                  ) : null}
                  <p className="truncate font-medium" style={{ color: "var(--ds-color-text-primary)" }}>
                    {companyName}
                  </p>
                </div>
              </div>
              {!isPlatform ? (
                <div>
                  <span className="font-semibold uppercase tracking-wide" style={{ color: "var(--ds-color-text-muted)" }}>
                    {navText("common.branch", "Branch")}
                  </span>
                  <p className="truncate font-medium" style={{ color: "var(--ds-color-text-primary)" }}>
                    {branchName}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="p-1.5">
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--nav-hover)]"
              style={{ color: "var(--ds-color-text-primary)" }}
              onClick={() => {
                setOpen(false);
                onOpenProfile();
              }}
            >
              {navText("navigation.profile", "Profile")}
            </button>
            <Link
              href={settingsHref}
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-[var(--nav-hover)]"
              style={{ color: "var(--ds-color-text-primary)" }}
              onClick={() => setOpen(false)}
            >
              {navText("navigation.settings", "Settings")}
            </Link>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--nav-hover)]"
              style={{ color: "var(--ds-color-danger)" }}
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
            >
              {navText("navigation.signOut", "Sign Out")}
            </button>
          </div>
        </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
