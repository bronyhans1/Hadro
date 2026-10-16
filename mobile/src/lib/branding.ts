const legalOrigin = (
  process.env.EXPO_PUBLIC_LEGAL_SITE_ORIGIN ?? "https://hadro.africa"
).replace(/\/+$/, "");

export const LEGAL_LINKS = {
  terms: `${legalOrigin}/terms`,
  privacy: `${legalOrigin}/privacy`,
} as const;

import { RELEASE, VERSION_LABEL } from "./release";

export const BRAND = {
  appName: RELEASE.productName,
  companyName: "HADRO Technologies",
  legalName: "HADRO Technologies Ltd.",
  descriptor: "Intelligent Workforce Management",
  compactDescriptor: "Intelligent Workforce",
  compactEyebrow: "HADRO • Intelligent Workforce",
  categoryName: "HADRO Workforce",
  /** Official support mailbox (hadrotech.com). Product website remains hadro.africa. */
  supportEmail: "support@hadrotech.com",
  siteUrl: "https://hadro.africa",
  version: RELEASE.version,
  versionLabel: VERSION_LABEL,
} as const;

/** Official HADRO UI palette (dark system). Light theme is the counterpart in theme.tsx. */
export const PALETTE = {
  background: "#0F0F0F",
  surface: "#1C1C1C",
  elevated: "#242424",
  border: "#2A2A2A",
  textPrimary: "#F5F5F5",
  textSecondary: "#A3A3A3",
  muted: "#737373",
  accent: "#F4A300",
} as const;
