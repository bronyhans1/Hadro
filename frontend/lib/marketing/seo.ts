import type { Metadata } from "next";
import { BRAND } from "@/lib/branding";
import { LANDING_INDUSTRIES, MARKETING, MARKETING_ROUTES } from "@/lib/marketing/siteConfig";
import {
  ABOUT_PAGE,
  CONTACT_PAGE,
  FEATURES_PAGE,
  MOBILE_PAGE,
  SECURITY_PAGE,
  SUPPORT_PAGE,
  WHY_PAGE,
} from "@/lib/marketing/stage4Content";
import { FAQ_PAGE } from "@/lib/marketing/faqContent";
import { INDUSTRY_SOLUTIONS, SOLUTIONS_HUB } from "@/lib/marketing/solutionsContent";
import { marketingText } from "@/lib/marketing/text";

const SITE_URL = MARKETING.siteUrl.replace(/\/$/, "");
const DEFAULT_OG_IMAGE = "/og-image.png";

export type MarketingSeoInput = {
  title: string;
  description: string;
  path: string;
  /** Override Open Graph / Twitter image. */
  image?: string;
  noIndex?: boolean;
};

/** Build absolute URL for a marketing path. */
export function marketingAbsoluteUrl(path: string): string {
  if (!path || path === "/") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Shared metadata builder for public marketing pages.
 * Includes unique title/description, canonical, Open Graph, and Twitter cards.
 */
export function createMarketingMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  noIndex = false,
}: MarketingSeoInput): Metadata {
  const url = marketingAbsoluteUrl(path);
  const fullTitle = title.includes(BRAND.appName) ? title : `${title} · ${BRAND.appName}`;

  return {
    title: {
      absolute: fullTitle,
    },
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: BRAND.appName,
      type: "website",
      locale: "en_US",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${BRAND.appName} — ${title}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

/** Homepage SEO (applied via root layout defaults + home-specific absolute fields). */
export const HOME_SEO = {
  get title() {
    return marketingText("seo.homeTitle", { values: { brand: BRAND.appName } });
  },
  get description() {
    return marketingText("seo.homeDescription");
  },
  path: MARKETING_ROUTES.home,
};

/** Central SEO copy for Stage 4 + Solutions marketing routes. */
export const MARKETING_SEO = {
  home: HOME_SEO,
  why: {
    get title() { return marketingText("why.eyebrow"); },
    get description() { return WHY_PAGE.description; },
    path: MARKETING_ROUTES.why,
  },
  features: {
    get title() { return marketingText("features.eyebrow"); },
    get description() { return FEATURES_PAGE.description; },
    path: MARKETING_ROUTES.features,
  },
  solutions: {
    get title() { return marketingText("solutions.eyebrow"); },
    get description() { return SOLUTIONS_HUB.description; },
    path: MARKETING_ROUTES.solutions,
  },
  mobile: {
    get title() { return marketingText("seo.mobileTitle"); },
    get description() { return MOBILE_PAGE.description; },
    path: MARKETING_ROUTES.mobile,
  },
  security: {
    get title() { return marketingText("security.eyebrow"); },
    get description() { return SECURITY_PAGE.description; },
    path: MARKETING_ROUTES.security,
  },
  faq: {
    get title() { return marketingText("faq.eyebrow"); },
    get description() { return FAQ_PAGE.description; },
    path: MARKETING_ROUTES.faq,
  },
  about: {
    get title() { return marketingText("about.eyebrow"); },
    get description() { return ABOUT_PAGE.description; },
    path: MARKETING_ROUTES.about,
  },
  contact: {
    get title() { return marketingText("contact.eyebrow"); },
    get description() { return CONTACT_PAGE.description; },
    path: MARKETING_ROUTES.contact,
  },
  support: {
    get title() { return marketingText("support.eyebrow"); },
    get description() { return SUPPORT_PAGE.description; },
    path: MARKETING_ROUTES.support,
  },
  requestAccess: {
    get title() { return marketingText("cta.requestAccessTitle"); },
    get description() { return marketingText("requestAccess.seoDescription"); },
    path: MARKETING_ROUTES.requestAccess,
  },
  foundationPreview: {
    title: "Marketing Foundation Preview",
    description: "Internal marketing foundation review surface — not a public marketing page.",
    path: MARKETING_ROUTES.foundationPreview,
    noIndex: true,
  },
} as const;

export function industrySeo(industryId: string): MarketingSeoInput | null {
  const solution = INDUSTRY_SOLUTIONS[industryId as keyof typeof INDUSTRY_SOLUTIONS];
  if (!solution) return null;
  return {
    title: marketingText("solutions.seoTitle", { values: { label: solution.label } }),
    description: solution.summary,
    path: `${MARKETING_ROUTES.solutions}/${solution.id}`,
  };
}

/** Public paths included in sitemap.xml. */
export function listMarketingSitemapPaths(): string[] {
  const staticPaths = [
    MARKETING_ROUTES.home,
    MARKETING_ROUTES.why,
    MARKETING_ROUTES.features,
    MARKETING_ROUTES.solutions,
    MARKETING_ROUTES.mobile,
    MARKETING_ROUTES.security,
    MARKETING_ROUTES.faq,
    MARKETING_ROUTES.about,
    MARKETING_ROUTES.contact,
    MARKETING_ROUTES.support,
    MARKETING_ROUTES.requestAccess,
    MARKETING.legal.privacy,
    MARKETING.legal.terms,
  ];
  const industryPaths = LANDING_INDUSTRIES.map(
    (item) => `${MARKETING_ROUTES.solutions}/${item.id}`
  );
  return [...staticPaths, ...industryPaths];
}
