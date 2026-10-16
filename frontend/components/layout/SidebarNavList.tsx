"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { NavChildEntry, NavEntry, NavGroupEntry } from "@/lib/navigation/types";
import { findActiveChildInGroup, getActiveGroupIds, isNavRouteActive } from "@/lib/navigation/filterNav";
import { navText } from "@/lib/navigation/navText";
import { NavIcon } from "@/lib/navigation/navIcons";
import { useSidebarCollapse } from "./SidebarCollapseContext";
import { useNavGroupsExpanded } from "./NavGroupsExpandedContext";

interface SidebarNavListProps {
  items: NavEntry[];
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`sidebar-nav-chevron h-4 w-4 shrink-0 ${expanded ? "sidebar-nav-chevron--expanded" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function NavChildLink({
  child,
  groupLabel,
  collapsed,
}: {
  child: NavChildEntry;
  groupLabel: string;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const isActive = isNavRouteActive(pathname, child.href);

  return (
    <Link
      href={child.href}
      title={collapsed ? `${groupLabel} · ${navText(child.labelKey, child.label)}` : undefined}
      className={`nav-link sidebar-nav-link sidebar-nav-child-link ${
        isActive ? "nav-link-active" : "text-[var(--text-muted)]"
      }`}
      aria-current={isActive ? "page" : undefined}
    >
      <span className="sidebar-nav-child-bullet" aria-hidden="true" />
      <span className="sidebar-nav-label truncate">{navText(child.labelKey, child.label)}</span>
    </Link>
  );
}

function CollapsedGroupFlyout({
  group,
  open,
  onClose,
  anchorRef,
}: {
  group: NavGroupEntry;
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [top, setTop] = useState(0);

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    setTop(anchorRef.current.getBoundingClientRect().top);
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      onClose();
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="sidebar-nav-flyout"
      role="menu"
      aria-label={navText(group.labelKey, group.label)}
      style={{ top }}
    >
      <p className="sidebar-nav-flyout-title">{navText(group.labelKey, group.label)}</p>
      <ul className="space-y-0.5">
        {group.children.map((child) => {
          const isActive = isNavRouteActive(pathname, child.href);
          return (
            <li key={child.href} role="none">
              <Link
                href={child.href}
                role="menuitem"
                onClick={onClose}
                className={`nav-link sidebar-nav-link sidebar-nav-flyout-link ${
                  isActive ? "nav-link-active" : "text-[var(--text-muted)]"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {navText(child.labelKey, child.label)}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SidebarNavGroup({ group }: { group: NavGroupEntry }) {
  const pathname = usePathname();
  const { collapsed } = useSidebarCollapse();
  const { isExpanded, toggle, ensureExpanded } = useNavGroupsExpanded();
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [flyoutOpen, setFlyoutOpen] = useState(false);

  const activeChild = findActiveChildInGroup(group, pathname);
  const hasActiveChild = activeChild !== null;
  const userExpanded = isExpanded(group.id);
  const expanded = hasActiveChild || userExpanded;

  useEffect(() => {
    if (hasActiveChild) ensureExpanded([group.id]);
  }, [hasActiveChild, group.id, ensureExpanded]);

  function handleTriggerClick() {
    if (collapsed) {
      setFlyoutOpen((v) => !v);
      return;
    }
    if (hasActiveChild) return;
    toggle(group.id);
  }

  function handleTriggerKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleTriggerClick();
    }
  }

  return (
    <li className="sidebar-nav-group">
      <button
        ref={triggerRef}
        type="button"
        id={`${panelId}-trigger`}
        className={`nav-link sidebar-nav-link sidebar-nav-group-trigger w-full ${
          hasActiveChild ? "sidebar-nav-group-trigger--within" : "text-[var(--text-muted)]"
        }`}
        aria-expanded={collapsed ? flyoutOpen : expanded}
        aria-controls={`${panelId}-panel`}
        aria-label={collapsed ? navText(group.labelKey, group.label) : undefined}
        title={collapsed ? navText(group.labelKey, group.label) : undefined}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
      >
        <NavIcon href={group.iconHref} />
        <span className="sidebar-nav-label min-w-0 flex-1 truncate text-left">{navText(group.labelKey, group.label)}</span>
        <ChevronIcon expanded={collapsed ? flyoutOpen : expanded} />
      </button>

      {collapsed ? (
        <CollapsedGroupFlyout
          group={group}
          open={flyoutOpen}
          onClose={() => setFlyoutOpen(false)}
          anchorRef={triggerRef}
        />
      ) : (
        <div
          id={`${panelId}-panel`}
          role="region"
          aria-labelledby={`${panelId}-trigger`}
          className="sidebar-nav-group-children"
          data-expanded={expanded ? "true" : "false"}
        >
          <div className="sidebar-nav-group-children-inner">
            <ul className="sidebar-nav-child-list space-y-0.5" role="list">
              {group.children.map((child) => (
                <li key={child.href}>
                  <NavChildLink child={child} groupLabel={navText(group.labelKey, group.label)} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </li>
  );
}

export function SidebarNavList({ items }: SidebarNavListProps) {
  const pathname = usePathname();
  const { collapsed } = useSidebarCollapse();
  const { ensureExpanded } = useNavGroupsExpanded();

  useEffect(() => {
    const activeIds = getActiveGroupIds(items, pathname);
    if (activeIds.length > 0) ensureExpanded(activeIds);
  }, [items, pathname, ensureExpanded]);

  let lastSection: string | undefined;

  return (
    <ul className="space-y-0.5" role="list">
      {items.map((entry) => {
        const section = entry.section;
        const sectionLabel = navText(entry.sectionKey, section ?? "");
        const showSection = !collapsed && section && section !== lastSection;
        if (section) lastSection = section;

        if (entry.type === "group") {
          return (
            <React.Fragment key={entry.id}>
              {showSection ? (
                <li>
                  <p className="sidebar-section-heading" role="presentation">
                    {sectionLabel}
                  </p>
                </li>
              ) : null}
              <SidebarNavGroup group={entry} />
            </React.Fragment>
          );
        }

        const isActive = isNavRouteActive(pathname, entry.href);

        return (
          <li key={entry.href}>
            {showSection ? (
              <p className="sidebar-section-heading" role="presentation">
                {sectionLabel}
              </p>
            ) : null}
            <Link
              href={entry.href}
              title={collapsed ? navText(entry.labelKey, entry.label) : undefined}
              className={`nav-link sidebar-nav-link ${
                isActive ? "nav-link-active" : "text-[var(--text-muted)]"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <NavIcon href={entry.href} />
              <span className="sidebar-nav-label truncate">{navText(entry.labelKey, entry.label)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
