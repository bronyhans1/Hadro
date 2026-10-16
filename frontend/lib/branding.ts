import { RELEASE, VERSION_LABEL } from "./release";

/**
 * Official HADRO brand hierarchy:
 * - appName: product / platform (HADRO)
 * - companyName: corporate (HADRO Technologies)
 * - legalName: legal entity (HADRO Technologies Ltd.)
 * - descriptor: Intelligent Workforce Management (marketing / SEO)
 * - compactDescriptor: Intelligent Workforce (application UI)
 */
export const BRAND = {
  appName: RELEASE.productName,
  companyName: "HADRO Technologies",
  legalName: "HADRO Technologies Ltd.",
  descriptor: "Intelligent Workforce Management",
  compactDescriptor: "Intelligent Workforce",
  /** Compact marketing eyebrow: HADRO • INTELLIGENT WORKFORCE */
  compactEyebrow: "HADRO • Intelligent Workforce",
  /** Optional category name for marketing / store discoverability */
  categoryName: "HADRO Workforce",
  /** Official support mailbox (hadrotech.com). Product website remains hadro.africa. */
  supportEmail: "support@hadrotech.com",
  siteUrl: "https://hadro.africa",
  version: RELEASE.version,
  versionLabel: VERSION_LABEL,
} as const;

/** Official HADRO UI palette (dark system). Light theme is the counterpart in CSS tokens. */
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

/** Relative routes on the web app; mobile opens absolute URLs from `LEGAL_LINKS` in mobile branding. */
export const LEGAL_ROUTES = {
  terms: "/terms",
  privacy: "/privacy",
} as const;
