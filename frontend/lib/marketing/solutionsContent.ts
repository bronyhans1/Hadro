import { LANDING_INDUSTRIES } from "./siteConfig";
import { marketingText } from "@/lib/marketing/text";

export type IndustryId = (typeof LANDING_INDUSTRIES)[number]["id"];

export type SolutionPoint = {
  title: string;
  body: string;
};

/**
 * Central catalog of recommendable product features for industry pages.
 * Keep labels stable — industry mappings reference these ids.
 */
export const RECOMMENDED_FEATURE_CATALOG = {
  "gps-attendance": {
    id: "gps-attendance",
    get title() { return marketingText("recommended.gpsTitle"); },
    get body() { return marketingText("recommended.gpsBody"); },
  },
  "qr-attendance": {
    id: "qr-attendance",
    get title() { return marketingText("recommended.qrTitle"); },
    get body() { return marketingText("recommended.qrBody"); },
  },
  "shift-management": {
    id: "shift-management",
    get title() { return marketingText("recommended.shiftTitle"); },
    get body() { return marketingText("recommended.shiftBody"); },
  },
  "live-earnings": {
    id: "live-earnings",
    get title() { return marketingText("recommended.earningsTitle"); },
    get body() { return marketingText("recommended.earningsBody"); },
  },
  "multi-branch": {
    id: "multi-branch",
    get title() { return marketingText("recommended.multiTitle"); },
    get body() { return marketingText("recommended.multiBody"); },
  },
  "self-service": {
    id: "self-service",
    get title() { return marketingText("recommended.selfTitle"); },
    get body() { return marketingText("recommended.selfBody"); },
  },
  "leave-management": {
    id: "leave-management",
    get title() { return marketingText("recommended.leaveTitle"); },
    get body() { return marketingText("recommended.leaveBody"); },
  },
  reports: {
    id: "reports",
    get title() { return marketingText("recommended.reportsTitle"); },
    get body() { return marketingText("recommended.reportsBody"); },
  },
  announcements: {
    id: "announcements",
    get title() { return marketingText("recommended.announcementsTitle"); },
    get body() { return marketingText("recommended.announcementsBody"); },
  },
  "mobile-app": {
    id: "mobile-app",
    get title() { return marketingText("recommended.mobileTitle"); },
    get body() { return marketingText("recommended.mobileBody"); },
  },
  "realtime-dashboard": {
    id: "realtime-dashboard",
    get title() { return marketingText("recommended.dashboardTitle"); },
    get body() { return marketingText("recommended.dashboardBody"); },
  },
  "remote-workforce": {
    id: "remote-workforce",
    get title() { return marketingText("recommended.remoteTitle"); },
    get body() { return marketingText("recommended.remoteBody"); },
  },
} as const;

export type RecommendedFeatureId = keyof typeof RECOMMENDED_FEATURE_CATALOG;

export type IndustrySolution = {
  id: IndustryId;
  label: string;
  /** Short line for hub cards / listings. */
  summary: string;
  headline: string;
  description: string;
  challenges: SolutionPoint[];
  solutions: SolutionPoint[];
  /**
   * Most relevant HADRO capabilities for this industry.
   * Rendered as the Recommended Features section — maintain here only.
   */
  recommendedFeatureIds: RecommendedFeatureId[];
  benefits: SolutionPoint[];
  ctaTitle: string;
  ctaDescription: string;
};

export const SOLUTIONS_HUB = {
  get eyebrow() { return marketingText("solutions.eyebrow"); },
  get title() { return marketingText("solutions.title"); },
  get description() { return marketingText("solutions.description"); },
};

export const INDUSTRY_SOLUTIONS: Record<IndustryId, IndustrySolution> = {
  schools: {
    id: "schools",
    get label() { return marketingText("industryPages.schools.label"); },
    get summary() { return marketingText("industryPages.schools.summary"); },
    get headline() { return marketingText("industryPages.schools.headline"); },
    get description() { return marketingText("industryPages.schools.description"); },
    challenges: [
      {
        get title() { return marketingText("industryPages.schools.challenges.0.title"); },
        get body() { return marketingText("industryPages.schools.challenges.0.body"); },
      },
      {
        get title() { return marketingText("industryPages.schools.challenges.1.title"); },
        get body() { return marketingText("industryPages.schools.challenges.1.body"); },
      },
      {
        get title() { return marketingText("industryPages.schools.challenges.2.title"); },
        get body() { return marketingText("industryPages.schools.challenges.2.body"); },
      },
    ],
    solutions: [
      {
        get title() { return marketingText("industryPages.schools.solutions.0.title"); },
        get body() { return marketingText("industryPages.schools.solutions.0.body"); },
      },
      {
        get title() { return marketingText("industryPages.schools.solutions.1.title"); },
        get body() { return marketingText("industryPages.schools.solutions.1.body"); },
      },
      {
        get title() { return marketingText("industryPages.schools.solutions.2.title"); },
        get body() { return marketingText("industryPages.schools.solutions.2.body"); },
      },
    ],
    recommendedFeatureIds: ["qr-attendance", "leave-management", "reports", "announcements"],
    benefits: [
      {
        get title() { return marketingText("industryPages.schools.benefits.0.title"); },
        get body() { return marketingText("industryPages.schools.benefits.0.body"); },
      },
      {
        get title() { return marketingText("industryPages.schools.benefits.1.title"); },
        get body() { return marketingText("industryPages.schools.benefits.1.body"); },
      },
      {
        get title() { return marketingText("industryPages.schools.benefits.2.title"); },
        get body() { return marketingText("industryPages.schools.benefits.2.body"); },
      },
    ],
    get ctaTitle() { return marketingText("industryPages.schools.ctaTitle"); },
    get ctaDescription() { return marketingText("industryPages.schools.ctaDescription"); },
  },
  hospitals: {
    id: "hospitals",
    get label() { return marketingText("industryPages.hospitals.label"); },
    get summary() { return marketingText("industryPages.hospitals.summary"); },
    get headline() { return marketingText("industryPages.hospitals.headline"); },
    get description() { return marketingText("industryPages.hospitals.description"); },
    challenges: [
      {
        get title() { return marketingText("industryPages.hospitals.challenges.0.title"); },
        get body() { return marketingText("industryPages.hospitals.challenges.0.body"); },
      },
      {
        get title() { return marketingText("industryPages.hospitals.challenges.1.title"); },
        get body() { return marketingText("industryPages.hospitals.challenges.1.body"); },
      },
      {
        get title() { return marketingText("industryPages.hospitals.challenges.2.title"); },
        get body() { return marketingText("industryPages.hospitals.challenges.2.body"); },
      },
    ],
    solutions: [
      {
        get title() { return marketingText("industryPages.hospitals.solutions.0.title"); },
        get body() { return marketingText("industryPages.hospitals.solutions.0.body"); },
      },
      {
        get title() { return marketingText("industryPages.hospitals.solutions.1.title"); },
        get body() { return marketingText("industryPages.hospitals.solutions.1.body"); },
      },
      {
        get title() { return marketingText("industryPages.hospitals.solutions.2.title"); },
        get body() { return marketingText("industryPages.hospitals.solutions.2.body"); },
      },
    ],
    recommendedFeatureIds: [
      "gps-attendance",
      "shift-management",
      "live-earnings",
      "realtime-dashboard",
      "self-service",
    ],
    benefits: [
      {
        get title() { return marketingText("industryPages.hospitals.benefits.0.title"); },
        get body() { return marketingText("industryPages.hospitals.benefits.0.body"); },
      },
      {
        get title() { return marketingText("industryPages.hospitals.benefits.1.title"); },
        get body() { return marketingText("industryPages.hospitals.benefits.1.body"); },
      },
      {
        get title() { return marketingText("industryPages.hospitals.benefits.2.title"); },
        get body() { return marketingText("industryPages.hospitals.benefits.2.body"); },
      },
    ],
    get ctaTitle() { return marketingText("industryPages.hospitals.ctaTitle"); },
    get ctaDescription() { return marketingText("industryPages.hospitals.ctaDescription"); },
  },
  factories: {
    id: "factories",
    get label() { return marketingText("industryPages.factories.label"); },
    get summary() { return marketingText("industryPages.factories.summary"); },
    get headline() { return marketingText("industryPages.factories.headline"); },
    get description() { return marketingText("industryPages.factories.description"); },
    challenges: [
      {
        get title() { return marketingText("industryPages.factories.challenges.0.title"); },
        get body() { return marketingText("industryPages.factories.challenges.0.body"); },
      },
      {
        get title() { return marketingText("industryPages.factories.challenges.1.title"); },
        get body() { return marketingText("industryPages.factories.challenges.1.body"); },
      },
      {
        get title() { return marketingText("industryPages.factories.challenges.2.title"); },
        get body() { return marketingText("industryPages.factories.challenges.2.body"); },
      },
    ],
    solutions: [
      {
        get title() { return marketingText("industryPages.factories.solutions.0.title"); },
        get body() { return marketingText("industryPages.factories.solutions.0.body"); },
      },
      {
        get title() { return marketingText("industryPages.factories.solutions.1.title"); },
        get body() { return marketingText("industryPages.factories.solutions.1.body"); },
      },
      {
        get title() { return marketingText("industryPages.factories.solutions.2.title"); },
        get body() { return marketingText("industryPages.factories.solutions.2.body"); },
      },
    ],
    recommendedFeatureIds: [
      "qr-attendance",
      "shift-management",
      "live-earnings",
      "multi-branch",
      "realtime-dashboard",
    ],
    benefits: [
      {
        get title() { return marketingText("industryPages.factories.benefits.0.title"); },
        get body() { return marketingText("industryPages.factories.benefits.0.body"); },
      },
      {
        get title() { return marketingText("industryPages.factories.benefits.1.title"); },
        get body() { return marketingText("industryPages.factories.benefits.1.body"); },
      },
      {
        get title() { return marketingText("industryPages.factories.benefits.2.title"); },
        get body() { return marketingText("industryPages.factories.benefits.2.body"); },
      },
    ],
    get ctaTitle() { return marketingText("industryPages.factories.ctaTitle"); },
    get ctaDescription() { return marketingText("industryPages.factories.ctaDescription"); },
  },
  warehouses: {
    id: "warehouses",
    get label() { return marketingText("industryPages.warehouses.label"); },
    get summary() { return marketingText("industryPages.warehouses.summary"); },
    get headline() { return marketingText("industryPages.warehouses.headline"); },
    get description() { return marketingText("industryPages.warehouses.description"); },
    challenges: [
      {
        get title() { return marketingText("industryPages.warehouses.challenges.0.title"); },
        get body() { return marketingText("industryPages.warehouses.challenges.0.body"); },
      },
      {
        get title() { return marketingText("industryPages.warehouses.challenges.1.title"); },
        get body() { return marketingText("industryPages.warehouses.challenges.1.body"); },
      },
      {
        get title() { return marketingText("industryPages.warehouses.challenges.2.title"); },
        get body() { return marketingText("industryPages.warehouses.challenges.2.body"); },
      },
    ],
    solutions: [
      {
        get title() { return marketingText("industryPages.warehouses.solutions.0.title"); },
        get body() { return marketingText("industryPages.warehouses.solutions.0.body"); },
      },
      {
        get title() { return marketingText("industryPages.warehouses.solutions.1.title"); },
        get body() { return marketingText("industryPages.warehouses.solutions.1.body"); },
      },
      {
        get title() { return marketingText("industryPages.warehouses.solutions.2.title"); },
        get body() { return marketingText("industryPages.warehouses.solutions.2.body"); },
      },
    ],
    recommendedFeatureIds: [
      "qr-attendance",
      "gps-attendance",
      "remote-workforce",
      "multi-branch",
      "realtime-dashboard",
    ],
    benefits: [
      {
        get title() { return marketingText("industryPages.warehouses.benefits.0.title"); },
        get body() { return marketingText("industryPages.warehouses.benefits.0.body"); },
      },
      {
        get title() { return marketingText("industryPages.warehouses.benefits.1.title"); },
        get body() { return marketingText("industryPages.warehouses.benefits.1.body"); },
      },
      {
        get title() { return marketingText("industryPages.warehouses.benefits.2.title"); },
        get body() { return marketingText("industryPages.warehouses.benefits.2.body"); },
      },
    ],
    get ctaTitle() { return marketingText("industryPages.warehouses.ctaTitle"); },
    get ctaDescription() { return marketingText("industryPages.warehouses.ctaDescription"); },
  },
  construction: {
    id: "construction",
    get label() { return marketingText("industryPages.construction.label"); },
    get summary() { return marketingText("industryPages.construction.summary"); },
    get headline() { return marketingText("industryPages.construction.headline"); },
    get description() { return marketingText("industryPages.construction.description"); },
    challenges: [
      {
        get title() { return marketingText("industryPages.construction.challenges.0.title"); },
        get body() { return marketingText("industryPages.construction.challenges.0.body"); },
      },
      {
        get title() { return marketingText("industryPages.construction.challenges.1.title"); },
        get body() { return marketingText("industryPages.construction.challenges.1.body"); },
      },
      {
        get title() { return marketingText("industryPages.construction.challenges.2.title"); },
        get body() { return marketingText("industryPages.construction.challenges.2.body"); },
      },
    ],
    solutions: [
      {
        get title() { return marketingText("industryPages.construction.solutions.0.title"); },
        get body() { return marketingText("industryPages.construction.solutions.0.body"); },
      },
      {
        get title() { return marketingText("industryPages.construction.solutions.1.title"); },
        get body() { return marketingText("industryPages.construction.solutions.1.body"); },
      },
      {
        get title() { return marketingText("industryPages.construction.solutions.2.title"); },
        get body() { return marketingText("industryPages.construction.solutions.2.body"); },
      },
    ],
    recommendedFeatureIds: ["gps-attendance", "remote-workforce", "mobile-app", "realtime-dashboard"],
    benefits: [
      {
        get title() { return marketingText("industryPages.construction.benefits.0.title"); },
        get body() { return marketingText("industryPages.construction.benefits.0.body"); },
      },
      {
        get title() { return marketingText("industryPages.construction.benefits.1.title"); },
        get body() { return marketingText("industryPages.construction.benefits.1.body"); },
      },
      {
        get title() { return marketingText("industryPages.construction.benefits.2.title"); },
        get body() { return marketingText("industryPages.construction.benefits.2.body"); },
      },
    ],
    get ctaTitle() { return marketingText("industryPages.construction.ctaTitle"); },
    get ctaDescription() { return marketingText("industryPages.construction.ctaDescription"); },
  },
  hotels: {
    id: "hotels",
    get label() { return marketingText("industryPages.hotels.label"); },
    get summary() { return marketingText("industryPages.hotels.summary"); },
    get headline() { return marketingText("industryPages.hotels.headline"); },
    get description() { return marketingText("industryPages.hotels.description"); },
    challenges: [
      {
        get title() { return marketingText("industryPages.hotels.challenges.0.title"); },
        get body() { return marketingText("industryPages.hotels.challenges.0.body"); },
      },
      {
        get title() { return marketingText("industryPages.hotels.challenges.1.title"); },
        get body() { return marketingText("industryPages.hotels.challenges.1.body"); },
      },
      {
        get title() { return marketingText("industryPages.hotels.challenges.2.title"); },
        get body() { return marketingText("industryPages.hotels.challenges.2.body"); },
      },
    ],
    solutions: [
      {
        get title() { return marketingText("industryPages.hotels.solutions.0.title"); },
        get body() { return marketingText("industryPages.hotels.solutions.0.body"); },
      },
      {
        get title() { return marketingText("industryPages.hotels.solutions.1.title"); },
        get body() { return marketingText("industryPages.hotels.solutions.1.body"); },
      },
      {
        get title() { return marketingText("industryPages.hotels.solutions.2.title"); },
        get body() { return marketingText("industryPages.hotels.solutions.2.body"); },
      },
    ],
    recommendedFeatureIds: [
      "gps-attendance",
      "shift-management",
      "live-earnings",
      "multi-branch",
      "self-service",
    ],
    benefits: [
      {
        get title() { return marketingText("industryPages.hotels.benefits.0.title"); },
        get body() { return marketingText("industryPages.hotels.benefits.0.body"); },
      },
      {
        get title() { return marketingText("industryPages.hotels.benefits.1.title"); },
        get body() { return marketingText("industryPages.hotels.benefits.1.body"); },
      },
      {
        get title() { return marketingText("industryPages.hotels.benefits.2.title"); },
        get body() { return marketingText("industryPages.hotels.benefits.2.body"); },
      },
    ],
    get ctaTitle() { return marketingText("industryPages.hotels.ctaTitle"); },
    get ctaDescription() { return marketingText("industryPages.hotels.ctaDescription"); },
  },
  retail: {
    id: "retail",
    get label() { return marketingText("industryPages.retail.label"); },
    get summary() { return marketingText("industryPages.retail.summary"); },
    get headline() { return marketingText("industryPages.retail.headline"); },
    get description() { return marketingText("industryPages.retail.description"); },
    challenges: [
      {
        get title() { return marketingText("industryPages.retail.challenges.0.title"); },
        get body() { return marketingText("industryPages.retail.challenges.0.body"); },
      },
      {
        get title() { return marketingText("industryPages.retail.challenges.1.title"); },
        get body() { return marketingText("industryPages.retail.challenges.1.body"); },
      },
      {
        get title() { return marketingText("industryPages.retail.challenges.2.title"); },
        get body() { return marketingText("industryPages.retail.challenges.2.body"); },
      },
    ],
    solutions: [
      {
        get title() { return marketingText("industryPages.retail.solutions.0.title"); },
        get body() { return marketingText("industryPages.retail.solutions.0.body"); },
      },
      {
        get title() { return marketingText("industryPages.retail.solutions.1.title"); },
        get body() { return marketingText("industryPages.retail.solutions.1.body"); },
      },
      {
        get title() { return marketingText("industryPages.retail.solutions.2.title"); },
        get body() { return marketingText("industryPages.retail.solutions.2.body"); },
      },
    ],
    recommendedFeatureIds: [
      "qr-attendance",
      "remote-workforce",
      "shift-management",
      "multi-branch",
      "realtime-dashboard",
    ],
    benefits: [
      {
        get title() { return marketingText("industryPages.retail.benefits.0.title"); },
        get body() { return marketingText("industryPages.retail.benefits.0.body"); },
      },
      {
        get title() { return marketingText("industryPages.retail.benefits.1.title"); },
        get body() { return marketingText("industryPages.retail.benefits.1.body"); },
      },
      {
        get title() { return marketingText("industryPages.retail.benefits.2.title"); },
        get body() { return marketingText("industryPages.retail.benefits.2.body"); },
      },
    ],
    get ctaTitle() { return marketingText("industryPages.retail.ctaTitle"); },
    get ctaDescription() { return marketingText("industryPages.retail.ctaDescription"); },
  },
  offices: {
    id: "offices",
    get label() { return marketingText("industryPages.offices.label"); },
    get summary() { return marketingText("industryPages.offices.summary"); },
    get headline() { return marketingText("industryPages.offices.headline"); },
    get description() { return marketingText("industryPages.offices.description"); },
    challenges: [
      {
        get title() { return marketingText("industryPages.offices.challenges.0.title"); },
        get body() { return marketingText("industryPages.offices.challenges.0.body"); },
      },
      {
        get title() { return marketingText("industryPages.offices.challenges.1.title"); },
        get body() { return marketingText("industryPages.offices.challenges.1.body"); },
      },
      {
        get title() { return marketingText("industryPages.offices.challenges.2.title"); },
        get body() { return marketingText("industryPages.offices.challenges.2.body"); },
      },
    ],
    solutions: [
      {
        get title() { return marketingText("industryPages.offices.solutions.0.title"); },
        get body() { return marketingText("industryPages.offices.solutions.0.body"); },
      },
      {
        get title() { return marketingText("industryPages.offices.solutions.1.title"); },
        get body() { return marketingText("industryPages.offices.solutions.1.body"); },
      },
      {
        get title() { return marketingText("industryPages.offices.solutions.2.title"); },
        get body() { return marketingText("industryPages.offices.solutions.2.body"); },
      },
    ],
    recommendedFeatureIds: [
      "remote-workforce",
      "qr-attendance",
      "leave-management",
      "self-service",
      "realtime-dashboard",
    ],
    benefits: [
      {
        get title() { return marketingText("industryPages.offices.benefits.0.title"); },
        get body() { return marketingText("industryPages.offices.benefits.0.body"); },
      },
      {
        get title() { return marketingText("industryPages.offices.benefits.1.title"); },
        get body() { return marketingText("industryPages.offices.benefits.1.body"); },
      },
      {
        get title() { return marketingText("industryPages.offices.benefits.2.title"); },
        get body() { return marketingText("industryPages.offices.benefits.2.body"); },
      },
    ],
    get ctaTitle() { return marketingText("industryPages.offices.ctaTitle"); },
    get ctaDescription() { return marketingText("industryPages.offices.ctaDescription"); },
  },
  logistics: {
    id: "logistics",
    get label() { return marketingText("industryPages.logistics.label"); },
    get summary() { return marketingText("industryPages.logistics.summary"); },
    get headline() { return marketingText("industryPages.logistics.headline"); },
    get description() { return marketingText("industryPages.logistics.description"); },
    challenges: [
      {
        get title() { return marketingText("industryPages.logistics.challenges.0.title"); },
        get body() { return marketingText("industryPages.logistics.challenges.0.body"); },
      },
      {
        get title() { return marketingText("industryPages.logistics.challenges.1.title"); },
        get body() { return marketingText("industryPages.logistics.challenges.1.body"); },
      },
      {
        get title() { return marketingText("industryPages.logistics.challenges.2.title"); },
        get body() { return marketingText("industryPages.logistics.challenges.2.body"); },
      },
    ],
    solutions: [
      {
        get title() { return marketingText("industryPages.logistics.solutions.0.title"); },
        get body() { return marketingText("industryPages.logistics.solutions.0.body"); },
      },
      {
        get title() { return marketingText("industryPages.logistics.solutions.1.title"); },
        get body() { return marketingText("industryPages.logistics.solutions.1.body"); },
      },
      {
        get title() { return marketingText("industryPages.logistics.solutions.2.title"); },
        get body() { return marketingText("industryPages.logistics.solutions.2.body"); },
      },
    ],
    recommendedFeatureIds: [
      "gps-attendance",
      "remote-workforce",
      "mobile-app",
      "live-earnings",
      "realtime-dashboard",
    ],
    benefits: [
      {
        get title() { return marketingText("industryPages.logistics.benefits.0.title"); },
        get body() { return marketingText("industryPages.logistics.benefits.0.body"); },
      },
      {
        get title() { return marketingText("industryPages.logistics.benefits.1.title"); },
        get body() { return marketingText("industryPages.logistics.benefits.1.body"); },
      },
      {
        get title() { return marketingText("industryPages.logistics.benefits.2.title"); },
        get body() { return marketingText("industryPages.logistics.benefits.2.body"); },
      },
    ],
    get ctaTitle() { return marketingText("industryPages.logistics.ctaTitle"); },
    get ctaDescription() { return marketingText("industryPages.logistics.ctaDescription"); },
  },
  government: {
    id: "government",
    get label() { return marketingText("industryPages.government.label"); },
    get summary() { return marketingText("industryPages.government.summary"); },
    get headline() { return marketingText("industryPages.government.headline"); },
    get description() { return marketingText("industryPages.government.description"); },
    challenges: [
      {
        get title() { return marketingText("industryPages.government.challenges.0.title"); },
        get body() { return marketingText("industryPages.government.challenges.0.body"); },
      },
      {
        get title() { return marketingText("industryPages.government.challenges.1.title"); },
        get body() { return marketingText("industryPages.government.challenges.1.body"); },
      },
      {
        get title() { return marketingText("industryPages.government.challenges.2.title"); },
        get body() { return marketingText("industryPages.government.challenges.2.body"); },
      },
    ],
    solutions: [
      {
        get title() { return marketingText("industryPages.government.solutions.0.title"); },
        get body() { return marketingText("industryPages.government.solutions.0.body"); },
      },
      {
        get title() { return marketingText("industryPages.government.solutions.1.title"); },
        get body() { return marketingText("industryPages.government.solutions.1.body"); },
      },
      {
        get title() { return marketingText("industryPages.government.solutions.2.title"); },
        get body() { return marketingText("industryPages.government.solutions.2.body"); },
      },
    ],
    recommendedFeatureIds: [
      "qr-attendance",
      "remote-workforce",
      "gps-attendance",
      "reports",
      "realtime-dashboard",
    ],
    benefits: [
      {
        get title() { return marketingText("industryPages.government.benefits.0.title"); },
        get body() { return marketingText("industryPages.government.benefits.0.body"); },
      },
      {
        get title() { return marketingText("industryPages.government.benefits.1.title"); },
        get body() { return marketingText("industryPages.government.benefits.1.body"); },
      },
      {
        get title() { return marketingText("industryPages.government.benefits.2.title"); },
        get body() { return marketingText("industryPages.government.benefits.2.body"); },
      },
    ],
    get ctaTitle() { return marketingText("industryPages.government.ctaTitle"); },
    get ctaDescription() { return marketingText("industryPages.government.ctaDescription"); },
  },
};
export function getIndustrySolution(id: string): IndustrySolution | null {
  if (id in INDUSTRY_SOLUTIONS) {
    return INDUSTRY_SOLUTIONS[id as IndustryId];
  }
  return null;
}

export function listIndustrySolutions(): IndustrySolution[] {
  return LANDING_INDUSTRIES.map((item) => INDUSTRY_SOLUTIONS[item.id]);
}

export function resolveRecommendedFeatures(solution: IndustrySolution) {
  return solution.recommendedFeatureIds.map((id) => RECOMMENDED_FEATURE_CATALOG[id]);
}
