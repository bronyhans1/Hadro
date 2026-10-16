"use client";

import { useCallback, useEffect, useState } from "react";
import {
  applyMarketingTheme,
  marketingThemeLabel,
  nextMarketingTheme,
  persistMarketingTheme,
  readMarketingThemePreference,
  resolveMarketingDark,
  type MarketingThemePreference,
} from "@/lib/marketing/theme";

/**
 * Syncs html.dark from the shared preference key and exposes theme controls.
 * Default preference is system until the visitor chooses light/dark.
 */
export function useMarketingThemeSync() {
  const [preference, setPreference] = useState<MarketingThemePreference>("system");
  const [resolvedDark, setResolvedDark] = useState(false);
  const [ready, setReady] = useState(false);

  const sync = useCallback(() => {
    const pref = readMarketingThemePreference();
    applyMarketingTheme(pref);
    setPreference(pref);
    setResolvedDark(resolveMarketingDark(pref));
    setReady(true);
  }, []);

  useEffect(() => {
    sync();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => sync();
    mq.addEventListener("change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      mq.removeEventListener("change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [sync]);

  const cycleTheme = useCallback(() => {
    const next = nextMarketingTheme(readMarketingThemePreference());
    persistMarketingTheme(next);
    setPreference(next);
    setResolvedDark(resolveMarketingDark(next));
  }, []);

  return {
    preference,
    resolvedDark,
    ready,
    cycleTheme,
    label: marketingThemeLabel(preference),
  };
}
