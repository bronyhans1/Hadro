"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "hadro-nav-groups-expanded";

interface NavGroupsExpandedContextValue {
  hydrated: boolean;
  isExpanded: (id: string) => boolean;
  toggle: (id: string) => void;
  ensureExpanded: (ids: string[]) => void;
}

const NavGroupsExpandedContext = createContext<NavGroupsExpandedContextValue | null>(null);

function readStored(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function persistExpanded(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    /* ignore */
  }
}

export function NavGroupsExpandedProvider({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setExpanded(readStored());
    setHydrated(true);
  }, []);

  const isExpanded = useCallback((id: string) => expanded.has(id), [expanded]);

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      persistExpanded(next);
      return next;
    });
  }, []);

  const ensureExpanded = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setExpanded((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const id of ids) {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      }
      if (!changed) return prev;
      persistExpanded(next);
      return next;
    });
  }, []);

  return (
    <NavGroupsExpandedContext.Provider value={{ hydrated, isExpanded, toggle, ensureExpanded }}>
      {children}
    </NavGroupsExpandedContext.Provider>
  );
}

export function useNavGroupsExpanded() {
  const ctx = useContext(NavGroupsExpandedContext);
  if (!ctx) {
    return {
      hydrated: true,
      isExpanded: () => false,
      toggle: () => {},
      ensureExpanded: () => {},
    };
  }
  return ctx;
}
