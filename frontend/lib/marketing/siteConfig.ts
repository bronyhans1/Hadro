import { BRAND, LEGAL_ROUTES } from "@/lib/branding";
import { translate } from "@/lib/i18n";
import { marketingText } from "@/lib/marketing/text";

/** Central marketing / distribution configuration — update placeholders here. */
export const MARKETING = {
  siteUrl: BRAND.siteUrl,
  contactEmail: BRAND.supportEmail,
  /** Replace with live App Store URL when published. */
  appStoreUrl: "https://apps.apple.com/app/hadro/id0000000000",
  /** Replace with live Play Store URL when published. */
  playStoreUrl: "https://play.google.com/store/apps/details?id=com.hadro.mobile",
  social: {
    instagram: "https://instagram.com/hadro",
    tiktok: "https://tiktok.com/@hadro",
    linkedin: "https://linkedin.com/company/hadro",
    x: "https://x.com/hadro",
    youtube: "https://youtube.com/@hadro",
  },
  legal: LEGAL_ROUTES,
} as const;

/**
 * Public marketing information architecture.
 * Routes are reserved for staged page delivery; Stage 0 only establishes the map.
 */
export const MARKETING_ROUTES = {
  home: "/",
  why: "/why-hadro",
  features: "/features",
  solutions: "/solutions",
  mobile: "/mobile",
  security: "/security",
  faq: "/faq",
  about: "/about",
  contact: "/contact",
  requestAccess: "/request-access",
  support: "/support",
  privacy: LEGAL_ROUTES.privacy,
  terms: LEGAL_ROUTES.terms,
  login: "/login",
  /** Stage 0 review surface only — not part of public IA. */
  foundationPreview: "/marketing/foundation",
} as const;

export type MarketingNavItem = {
  href: string;
  label: string;
  /** When true, link is reserved for a later stage and may be disabled in nav. */
  comingSoon?: boolean;
};

/** Primary marketing navigation. */
export const MARKETING_NAV: MarketingNavItem[] = [
  { href: MARKETING_ROUTES.home, get label() { return translate("navigation.home"); } },
  { href: MARKETING_ROUTES.why, get label() { return marketingText("nav.why"); } },
  { href: MARKETING_ROUTES.features, get label() { return marketingText("nav.features"); } },
  { href: MARKETING_ROUTES.solutions, get label() { return marketingText("nav.solutions"); } },
  { href: MARKETING_ROUTES.mobile, get label() { return marketingText("nav.mobile"); } },
  { href: MARKETING_ROUTES.security, get label() { return marketingText("nav.security"); } },
  { href: MARKETING_ROUTES.faq, get label() { return marketingText("nav.faqs"); } },
  { href: MARKETING_ROUTES.about, get label() { return marketingText("nav.about"); } },
];

export const LANDING_INDUSTRIES = [
  { id: "schools", get label() { return marketingText("industries.schools"); }, imageKey: "schools" },
  { id: "hospitals", get label() { return marketingText("industries.hospitals"); }, imageKey: "hospitals" },
  { id: "factories", get label() { return marketingText("industries.factories"); }, imageKey: "factories" },
  { id: "warehouses", get label() { return marketingText("industries.warehouses"); }, imageKey: "warehouses" },
  { id: "construction", get label() { return marketingText("industries.construction"); }, imageKey: "construction" },
  { id: "hotels", get label() { return marketingText("industries.hotels"); }, imageKey: "hotels" },
  { id: "retail", get label() { return marketingText("industries.retail"); }, imageKey: "retail" },
  { id: "offices", get label() { return marketingText("industries.offices"); }, imageKey: "offices" },
  { id: "logistics", get label() { return marketingText("industries.logistics"); }, imageKey: "logistics" },
  { id: "government", get label() { return marketingText("industries.government"); }, imageKey: "government" },
] as const;

export const SIGNATURE_CAPABILITIES = [
  {
    id: "gps-attendance",
    get title() { return marketingText("signature.gpsTitle"); },
    get problem() { return marketingText("signature.gpsProblem"); },
    get solution() { return marketingText("signature.gpsSolution"); },
    get benefit() { return marketingText("signature.gpsBenefit"); },
  },
  {
    id: "remote-workforce",
    get title() { return marketingText("signature.remoteTitle"); },
    get problem() { return marketingText("signature.remoteProblem"); },
    get solution() { return marketingText("signature.remoteSolution"); },
    get benefit() { return marketingText("signature.remoteBenefit"); },
  },
  {
    id: "qr-attendance",
    get title() { return marketingText("signature.qrTitle"); },
    get problem() { return marketingText("signature.qrProblem"); },
    get solution() { return marketingText("signature.qrSolution"); },
    get benefit() { return marketingText("signature.qrBenefit"); },
  },
  {
    id: "live-earnings",
    get title() { return marketingText("signature.earningsTitle"); },
    get problem() { return marketingText("signature.earningsProblem"); },
    get solution() { return marketingText("signature.earningsSolution"); },
    get benefit() { return marketingText("signature.earningsBenefit"); },
  },
  {
    id: "multi-branch",
    get title() { return marketingText("signature.multiTitle"); },
    get problem() { return marketingText("signature.multiProblem"); },
    get solution() { return marketingText("signature.multiSolution"); },
    get benefit() { return marketingText("signature.multiBenefit"); },
  },
  {
    id: "self-service",
    get title() { return marketingText("signature.selfTitle"); },
    get problem() { return marketingText("signature.selfProblem"); },
    get solution() { return marketingText("signature.selfSolution"); },
    get benefit() { return marketingText("signature.selfBenefit"); },
  },
  {
    id: "realtime-dashboard",
    get title() { return marketingText("signature.dashboardTitle"); },
    get problem() { return marketingText("signature.dashboardProblem"); },
    get solution() { return marketingText("signature.dashboardSolution"); },
    get benefit() { return marketingText("signature.dashboardBenefit"); },
  },
] as const;

export const LANDING_FEATURES = [
  {
    get title() { return marketingText("features.attendanceTitle"); },
    get body() { return marketingText("features.attendanceBody"); },
    screenshotKey: "attendance",
  },
  {
    get title() { return marketingText("features.remoteTitle"); },
    get body() { return marketingText("features.remoteBody"); },
    screenshotKey: "remote",
  },
  {
    get title() { return marketingText("features.payrollTitle"); },
    get body() { return marketingText("features.payrollBody"); },
    screenshotKey: "payroll",
  },
  {
    get title() { return marketingText("features.leaveTitle"); },
    get body() { return marketingText("features.leaveBody"); },
    screenshotKey: "leave",
  },
  {
    get title() { return marketingText("features.reportsTitle"); },
    get body() { return marketingText("features.reportsBody"); },
    screenshotKey: "reports",
  },
] as const;

/** @deprecated Public form no longer collects industry — kept for admin/legacy display. */
export const ONBOARDING_INDUSTRIES = [
  "Schools",
  "Hospitals",
  "Factories",
  "Warehouses",
  "Construction",
  "Hotels",
  "Retail",
  "Offices",
  "Logistics",
  "Government",
  "Other",
] as const;

/** Employee count ranges for public Request Access qualification. */
export const EMPLOYEE_COUNT_OPTIONS = [
  "1–10",
  "11–25",
  "26–50",
  "51–100",
  "101–250",
  "251–500",
  "501–1000",
  "1000+",
] as const;

/** @deprecated Use MARKETING_IMAGES from `@/lib/marketing/assets` instead. */
export function marketingPlaceholderPath(key: string): string {
  return `/marketing/placeholders/${key}.svg`;
}

export function industrySolutionPath(industryId: string): string {
  return `${MARKETING_ROUTES.solutions}/${industryId}`;
}
