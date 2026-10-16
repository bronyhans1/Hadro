import { PALETTE } from "@/lib/branding";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { getPersistentItem, setPersistentItem } from "@/lib/persistentStorage";

export type ThemePreference = "light" | "dark" | "system";

type ThemeMode = "light" | "dark";

export interface ThemePalette {
  background: string;
  surface: string;
  /** Nested panels / elevated chips sitting on surface */
  surfaceMuted: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  /** Success accents (checklist, positive states) */
  success: string;
  /** Warning / in-progress (leave pending, active session) */
  warning: string;
  /** Error text */
  danger: string;
  /** Subtle danger / warning surfaces */
  surfaceDanger: string;
  surfaceWarning: string;
  /** Filled primary button label */
  onPrimary: string;
  /** Text/icons on camera / dark overlays */
  onOverlay: string;
  /** Semi-opaque scrim over camera */
  overlayScrim: string;
  /** Status chips — backgrounds + text (leave + attendance) */
  toneSuccessBg: string;
  toneSuccessText: string;
  toneDangerBg: string;
  toneDangerText: string;
  toneWarningBg: string;
  toneWarningText: string;
  toneNeutralBg: string;
  toneNeutralText: string;
  /** Secondary actions (outlined buttons) */
  secondaryBorder: string;
  /** Tab bar / chrome */
  tabBar: string;
  /** iOS/Android shadow (neutral) */
  shadow: string;
  /** Legible shadow for light text on imagery (e.g. camera hint) */
  hintShadow: string;
}

interface ThemeContextValue {
  preference: ThemePreference;
  mode: ThemeMode;
  colors: ThemePalette;
  setPreference: (v: ThemePreference) => Promise<void>;
}

const KEY = "hadro_theme_pref";

const LIGHT: ThemePalette = {
  background: "#f3f3f2",
  surface: "#ffffff",
  surfaceMuted: "#f7f7f6",
  text: "#1c1c1c",
  muted: "#6b6b6b",
  border: "#e4e4e3",
  primary: PALETTE.accent,
  success: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
  surfaceDanger: "#fef2f2",
  surfaceWarning: "#fffbeb",
  onPrimary: "#1c1c1c",
  onOverlay: "#ffffff",
  overlayScrim: "rgba(28, 28, 28, 0.55)",
  toneSuccessBg: "#ecfdf5",
  toneSuccessText: "#166534",
  toneDangerBg: "#fef2f2",
  toneDangerText: "#991b1b",
  toneWarningBg: "#fffbeb",
  toneWarningText: "#92400e",
  toneNeutralBg: "#f5f5f4",
  toneNeutralText: "#3a3a3a",
  secondaryBorder: "#f5d78a",
  tabBar: "#fcfcfc",
  shadow: "#1c1c1c",
  hintShadow: "rgba(0, 0, 0, 0.72)",
};

const DARK: ThemePalette = {
  background: PALETTE.background,
  surface: PALETTE.surface,
  surfaceMuted: PALETTE.elevated,
  text: PALETTE.textPrimary,
  muted: PALETTE.muted,
  border: PALETTE.border,
  primary: PALETTE.accent,
  success: "#4ade80",
  warning: "#fbbf24",
  danger: "#f87171",
  surfaceDanger: "#1f1315",
  surfaceWarning: "#1a1508",
  onPrimary: PALETTE.background,
  onOverlay: PALETTE.textPrimary,
  overlayScrim: "rgba(15, 15, 15, 0.72)",
  toneSuccessBg: "#064e3b",
  toneSuccessText: "#6ee7b7",
  toneDangerBg: "#450a0a",
  toneDangerText: "#fca5a5",
  toneWarningBg: "#78350f",
  toneWarningText: "#fde68a",
  toneNeutralBg: PALETTE.elevated,
  toneNeutralText: PALETTE.textSecondary,
  secondaryBorder: "#5c4a1a",
  tabBar: PALETTE.surface,
  shadow: "#000000",
  hintShadow: "rgba(0, 0, 0, 0.78)",
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    (async () => {
      const saved = await getPersistentItem(KEY);
      if (saved === "light" || saved === "dark" || saved === "system") {
        setPreferenceState(saved);
      }
    })();
  }, []);

  const mode: ThemeMode =
    preference === "system" ? (system === "dark" ? "dark" : "light") : preference;
  const colors = mode === "dark" ? DARK : LIGHT;

  async function setPreference(v: ThemePreference) {
    setPreferenceState(v);
    await setPersistentItem(KEY, v);
  }

  const value = useMemo(
    () => ({ preference, mode, colors, setPreference }),
    [preference, mode, colors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemePrefs(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemePrefs must be used inside ThemeProvider");
  return ctx;
}
