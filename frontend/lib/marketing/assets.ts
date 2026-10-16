/**
 * Central marketing image manifest.
 *
 * Replace any file under /public/marketing/** without changing React code.
 * Paths are permanent — overwrite the .webp file with the same filename.
 */
export const MARKETING_ASSET_ROOT = "/marketing" as const;

export const MARKETING_IMAGES = {
  /* Hero */
  heroDashboard: `${MARKETING_ASSET_ROOT}/hero/hero-dashboard.webp`,
  heroMobile: `${MARKETING_ASSET_ROOT}/hero/hero-mobile.webp`,

  /* Dashboard */
  dashboardOverview: `${MARKETING_ASSET_ROOT}/dashboard/dashboard-overview.webp`,
  dashboardAttendance: `${MARKETING_ASSET_ROOT}/dashboard/dashboard-attendance.webp`,
  dashboardPayroll: `${MARKETING_ASSET_ROOT}/dashboard/dashboard-payroll.webp`,
  dashboardLiveEarnings: `${MARKETING_ASSET_ROOT}/dashboard/dashboard-live-earnings.webp`,
  dashboardReports: `${MARKETING_ASSET_ROOT}/dashboard/dashboard-reports.webp`,
  dashboardIndustry: `${MARKETING_ASSET_ROOT}/dashboard/dashboard-industry.webp`,

  /* Features / signature capabilities */
  gpsAttendance: `${MARKETING_ASSET_ROOT}/features/gps-attendance.webp`,
  remoteWorkforce: `${MARKETING_ASSET_ROOT}/features/remote-workforce.webp`,
  qrAttendance: `${MARKETING_ASSET_ROOT}/features/qr-attendance.webp`,
  liveEarnings: `${MARKETING_ASSET_ROOT}/features/live-earnings.webp`,
  multiBranch: `${MARKETING_ASSET_ROOT}/features/multi-branch.webp`,
  employeeSelfService: `${MARKETING_ASSET_ROOT}/features/employee-self-service.webp`,
  realTimeDashboard: `${MARKETING_ASSET_ROOT}/features/real-time-dashboard.webp`,
  featureAttendance: `${MARKETING_ASSET_ROOT}/features/feature-attendance.webp`,
  featurePayroll: `${MARKETING_ASSET_ROOT}/features/feature-payroll.webp`,
  featureLeave: `${MARKETING_ASSET_ROOT}/features/feature-leave.webp`,
  featureReports: `${MARKETING_ASSET_ROOT}/features/feature-reports.webp`,
  featureRemote: `${MARKETING_ASSET_ROOT}/features/feature-remote.webp`,
  featuresOverview: `${MARKETING_ASSET_ROOT}/features/features-overview.webp`,

  /* Workflow */
  workflowOverview: `${MARKETING_ASSET_ROOT}/workflow/workflow-overview.webp`,

  /* Homepage — business problems illustration (overwrite .webp to replace) */
  businessProblems: `${MARKETING_ASSET_ROOT}/features/business-problems.webp`,

  /* Mobile */
  mobileHome: `${MARKETING_ASSET_ROOT}/mobile/mobile-home.webp`,
  mobileAttendance: `${MARKETING_ASSET_ROOT}/mobile/mobile-attendance.webp`,
  mobileGps: `${MARKETING_ASSET_ROOT}/mobile/mobile-gps.webp`,
  mobileLiveEarnings: `${MARKETING_ASSET_ROOT}/mobile/mobile-live-earnings.webp`,
  mobileLeave: `${MARKETING_ASSET_ROOT}/mobile/mobile-leave.webp`,
  mobileNotifications: `${MARKETING_ASSET_ROOT}/mobile/mobile-notifications.webp`,
  mobileEmployees: `${MARKETING_ASSET_ROOT}/mobile/mobile-employees.webp`,

  /* Industries */
  industrySchools: `${MARKETING_ASSET_ROOT}/industries/industry-schools.webp`,
  industryHospitals: `${MARKETING_ASSET_ROOT}/industries/industry-hospitals.webp`,
  industryFactories: `${MARKETING_ASSET_ROOT}/industries/industry-factories.webp`,
  industryWarehouses: `${MARKETING_ASSET_ROOT}/industries/industry-warehouses.webp`,
  industryConstruction: `${MARKETING_ASSET_ROOT}/industries/industry-construction.webp`,
  industryHotels: `${MARKETING_ASSET_ROOT}/industries/industry-hotels.webp`,
  industryRetail: `${MARKETING_ASSET_ROOT}/industries/industry-retail.webp`,
  industryOffices: `${MARKETING_ASSET_ROOT}/industries/industry-offices.webp`,
  industryLogistics: `${MARKETING_ASSET_ROOT}/industries/industry-logistics.webp`,
  industryGovernment: `${MARKETING_ASSET_ROOT}/industries/industry-government.webp`,

  /* Security */
  securityOverview: `${MARKETING_ASSET_ROOT}/security/security-overview.webp`,
  securityRbac: `${MARKETING_ASSET_ROOT}/security/security-rbac.webp`,
  securityAudit: `${MARKETING_ASSET_ROOT}/security/security-audit.webp`,
  securityAuth: `${MARKETING_ASSET_ROOT}/security/security-auth.webp`,

  /* Testimonials (reserved for when stories return) */
  testimonialCompany1: `${MARKETING_ASSET_ROOT}/testimonials/testimonial-company-1.webp`,
  testimonialCompany2: `${MARKETING_ASSET_ROOT}/testimonials/testimonial-company-2.webp`,
  testimonialCompany3: `${MARKETING_ASSET_ROOT}/testimonials/testimonial-company-3.webp`,

  /* About / contact / request access */
  aboutTeam: `${MARKETING_ASSET_ROOT}/about/about-team.webp`,
  aboutMission: `${MARKETING_ASSET_ROOT}/about/about-mission.webp`,
  contactHero: `${MARKETING_ASSET_ROOT}/contact/contact-hero.webp`,
  requestAccessHero: `${MARKETING_ASSET_ROOT}/request-access/request-access-hero.webp`,
  whyHero: `${MARKETING_ASSET_ROOT}/hero/why-hero.webp`,
  solutionsHero: `${MARKETING_ASSET_ROOT}/hero/solutions-hero.webp`,
  faqHero: `${MARKETING_ASSET_ROOT}/hero/faq-hero.webp`,
  securityHero: `${MARKETING_ASSET_ROOT}/hero/security-hero.webp`,

  /* Store download badges */
  badgeAppStore: `${MARKETING_ASSET_ROOT}/social/app-store.png`,
  badgeGooglePlay: `${MARKETING_ASSET_ROOT}/social/google-play.png`,

  /* Atmosphere — high-quality WebP (+ SVG fallback paths) */
  atmosphereLight: `${MARKETING_ASSET_ROOT}/atmosphere/atmosphere-light.webp`,
  atmosphereDark: `${MARKETING_ASSET_ROOT}/atmosphere/atmosphere-dark.webp`,
  atmosphereLightFallback: `${MARKETING_ASSET_ROOT}/atmosphere/atmosphere-light.svg`,
  atmosphereDarkFallback: `${MARKETING_ASSET_ROOT}/atmosphere/atmosphere-dark.svg`,
} as const;

export type MarketingImageKey = keyof typeof MARKETING_IMAGES;

/** Resolve a marketing image path by key. */
export function marketingImage(key: MarketingImageKey): string {
  return MARKETING_IMAGES[key];
}

/** Industry card / page photography by industry id. */
export const INDUSTRY_IMAGES: Record<string, string> = {
  schools: MARKETING_IMAGES.industrySchools,
  hospitals: MARKETING_IMAGES.industryHospitals,
  factories: MARKETING_IMAGES.industryFactories,
  warehouses: MARKETING_IMAGES.industryWarehouses,
  construction: MARKETING_IMAGES.industryConstruction,
  hotels: MARKETING_IMAGES.industryHotels,
  retail: MARKETING_IMAGES.industryRetail,
  offices: MARKETING_IMAGES.industryOffices,
  logistics: MARKETING_IMAGES.industryLogistics,
  government: MARKETING_IMAGES.industryGovernment,
};

export function industryImage(industryId: string): string {
  return INDUSTRY_IMAGES[industryId] ?? MARKETING_IMAGES.solutionsHero;
}

/** Signature capability id → feature visual. */
export const SIGNATURE_CAPABILITY_IMAGES: Record<string, string> = {
  "gps-attendance": MARKETING_IMAGES.gpsAttendance,
  "remote-workforce": MARKETING_IMAGES.remoteWorkforce,
  "qr-attendance": MARKETING_IMAGES.qrAttendance,
  "live-earnings": MARKETING_IMAGES.liveEarnings,
  "multi-branch": MARKETING_IMAGES.multiBranch,
  "self-service": MARKETING_IMAGES.employeeSelfService,
  "realtime-dashboard": MARKETING_IMAGES.realTimeDashboard,
};

export function signatureCapabilityImage(capabilityId: string): string {
  return SIGNATURE_CAPABILITY_IMAGES[capabilityId] ?? MARKETING_IMAGES.featuresOverview;
}

/** Core feature screenshotKey → image. */
export const CORE_FEATURE_IMAGES: Record<string, string> = {
  attendance: MARKETING_IMAGES.featureAttendance,
  remote: MARKETING_IMAGES.featureRemote,
  payroll: MARKETING_IMAGES.featurePayroll,
  leave: MARKETING_IMAGES.featureLeave,
  reports: MARKETING_IMAGES.featureReports,
};

export function coreFeatureImage(screenshotKey: string): string {
  return CORE_FEATURE_IMAGES[screenshotKey] ?? MARKETING_IMAGES.featuresOverview;
}

/**
 * Inventory metadata for audits / maintenance.
 * Update `usedOn` when wiring new pages — filenames stay stable.
 */
export const MARKETING_IMAGE_INVENTORY: Array<{
  key: MarketingImageKey;
  filename: string;
  path: string;
  usedOn: string;
}> = [
  { key: "heroDashboard", filename: "hero-dashboard.webp", path: MARKETING_IMAGES.heroDashboard, usedOn: "Homepage Hero" },
  { key: "heroMobile", filename: "hero-mobile.webp", path: MARKETING_IMAGES.heroMobile, usedOn: "Mobile Page Hero" },
  { key: "whyHero", filename: "why-hero.webp", path: MARKETING_IMAGES.whyHero, usedOn: "Why HADRO Hero" },
  { key: "solutionsHero", filename: "solutions-hero.webp", path: MARKETING_IMAGES.solutionsHero, usedOn: "Solutions Hub" },
  { key: "faqHero", filename: "faq-hero.webp", path: MARKETING_IMAGES.faqHero, usedOn: "FAQs Page" },
  { key: "dashboardOverview", filename: "dashboard-overview.webp", path: MARKETING_IMAGES.dashboardOverview, usedOn: "Homepage Dashboard Showcase" },
  { key: "dashboardAttendance", filename: "dashboard-attendance.webp", path: MARKETING_IMAGES.dashboardAttendance, usedOn: "Dashboard Attendance View (reserved)" },
  { key: "dashboardPayroll", filename: "dashboard-payroll.webp", path: MARKETING_IMAGES.dashboardPayroll, usedOn: "Dashboard Payroll View (reserved)" },
  { key: "dashboardLiveEarnings", filename: "dashboard-live-earnings.webp", path: MARKETING_IMAGES.dashboardLiveEarnings, usedOn: "Dashboard Live Earnings View (reserved)" },
  { key: "dashboardReports", filename: "dashboard-reports.webp", path: MARKETING_IMAGES.dashboardReports, usedOn: "Dashboard Reports View (reserved)" },
  { key: "dashboardIndustry", filename: "dashboard-industry.webp", path: MARKETING_IMAGES.dashboardIndustry, usedOn: "Industry dashboards (reserved)" },
  { key: "gpsAttendance", filename: "gps-attendance.webp", path: MARKETING_IMAGES.gpsAttendance, usedOn: "GPS Capability Showcase" },
  { key: "remoteWorkforce", filename: "remote-workforce.webp", path: MARKETING_IMAGES.remoteWorkforce, usedOn: "Remote Workforce Showcase" },
  { key: "qrAttendance", filename: "qr-attendance.webp", path: MARKETING_IMAGES.qrAttendance, usedOn: "QR Attendance Showcase" },
  { key: "liveEarnings", filename: "live-earnings.webp", path: MARKETING_IMAGES.liveEarnings, usedOn: "Live Earnings Showcase" },
  { key: "multiBranch", filename: "multi-branch.webp", path: MARKETING_IMAGES.multiBranch, usedOn: "Multi-Branch Showcase" },
  { key: "employeeSelfService", filename: "employee-self-service.webp", path: MARKETING_IMAGES.employeeSelfService, usedOn: "Employee Self-Service Showcase" },
  { key: "realTimeDashboard", filename: "real-time-dashboard.webp", path: MARKETING_IMAGES.realTimeDashboard, usedOn: "Real-Time Dashboard Showcase" },
  { key: "featuresOverview", filename: "features-overview.webp", path: MARKETING_IMAGES.featuresOverview, usedOn: "Features Page Hero" },
  { key: "featureAttendance", filename: "feature-attendance.webp", path: MARKETING_IMAGES.featureAttendance, usedOn: "Features — Attendance" },
  { key: "featureRemote", filename: "feature-remote.webp", path: MARKETING_IMAGES.featureRemote, usedOn: "Features — Remote Workforce" },
  { key: "featurePayroll", filename: "feature-payroll.webp", path: MARKETING_IMAGES.featurePayroll, usedOn: "Features — Payroll" },
  { key: "featureLeave", filename: "feature-leave.webp", path: MARKETING_IMAGES.featureLeave, usedOn: "Features — Leave" },
  { key: "featureReports", filename: "feature-reports.webp", path: MARKETING_IMAGES.featureReports, usedOn: "Features — Reports" },
  { key: "workflowOverview", filename: "workflow-overview.webp", path: MARKETING_IMAGES.workflowOverview, usedOn: "Product Workflow Section" },
  { key: "businessProblems", filename: "business-problems.webp", path: MARKETING_IMAGES.businessProblems, usedOn: "Homepage Business Problems" },
  { key: "mobileHome", filename: "mobile-home.webp", path: MARKETING_IMAGES.mobileHome, usedOn: "Mobile — Attendance history" },
  { key: "mobileAttendance", filename: "mobile-attendance.webp", path: MARKETING_IMAGES.mobileAttendance, usedOn: "Mobile — Clock in / clock out" },
  { key: "mobileGps", filename: "mobile-gps.webp", path: MARKETING_IMAGES.mobileGps, usedOn: "Mobile — GPS & QR attendance" },
  { key: "mobileLiveEarnings", filename: "mobile-live-earnings.webp", path: MARKETING_IMAGES.mobileLiveEarnings, usedOn: "Mobile — Live earnings" },
  { key: "mobileLeave", filename: "mobile-leave.webp", path: MARKETING_IMAGES.mobileLeave, usedOn: "Mobile — Leave requests" },
  { key: "mobileNotifications", filename: "mobile-notifications.webp", path: MARKETING_IMAGES.mobileNotifications, usedOn: "Mobile — Notifications & profile" },
  { key: "mobileEmployees", filename: "mobile-employees.webp", path: MARKETING_IMAGES.mobileEmployees, usedOn: "Mobile — Connected workforce" },
  { key: "industrySchools", filename: "industry-schools.webp", path: MARKETING_IMAGES.industrySchools, usedOn: "Schools" },
  { key: "industryHospitals", filename: "industry-hospitals.webp", path: MARKETING_IMAGES.industryHospitals, usedOn: "Hospitals" },
  { key: "industryFactories", filename: "industry-factories.webp", path: MARKETING_IMAGES.industryFactories, usedOn: "Factories" },
  { key: "industryWarehouses", filename: "industry-warehouses.webp", path: MARKETING_IMAGES.industryWarehouses, usedOn: "Warehouses" },
  { key: "industryConstruction", filename: "industry-construction.webp", path: MARKETING_IMAGES.industryConstruction, usedOn: "Construction" },
  { key: "industryHotels", filename: "industry-hotels.webp", path: MARKETING_IMAGES.industryHotels, usedOn: "Hotels" },
  { key: "industryRetail", filename: "industry-retail.webp", path: MARKETING_IMAGES.industryRetail, usedOn: "Retail" },
  { key: "industryOffices", filename: "industry-offices.webp", path: MARKETING_IMAGES.industryOffices, usedOn: "Offices" },
  { key: "industryLogistics", filename: "industry-logistics.webp", path: MARKETING_IMAGES.industryLogistics, usedOn: "Logistics" },
  { key: "industryGovernment", filename: "industry-government.webp", path: MARKETING_IMAGES.industryGovernment, usedOn: "Government" },
  { key: "securityOverview", filename: "security-overview.webp", path: MARKETING_IMAGES.securityOverview, usedOn: "Security pillars" },
  { key: "securityRbac", filename: "security-rbac.webp", path: MARKETING_IMAGES.securityRbac, usedOn: "Security — RBAC" },
  { key: "securityAudit", filename: "security-audit.webp", path: MARKETING_IMAGES.securityAudit, usedOn: "Security — Audit" },
  { key: "securityAuth", filename: "security-auth.webp", path: MARKETING_IMAGES.securityAuth, usedOn: "Security — Authentication" },
  { key: "securityHero", filename: "security-hero.webp", path: MARKETING_IMAGES.securityHero, usedOn: "Security Page Hero" },
  { key: "badgeAppStore", filename: "app-store.png", path: MARKETING_IMAGES.badgeAppStore, usedOn: "App Store download badge" },
  { key: "badgeGooglePlay", filename: "google-play.png", path: MARKETING_IMAGES.badgeGooglePlay, usedOn: "Google Play download badge" },
  { key: "testimonialCompany1", filename: "testimonial-company-1.webp", path: MARKETING_IMAGES.testimonialCompany1, usedOn: "Testimonials" },
  { key: "testimonialCompany2", filename: "testimonial-company-2.webp", path: MARKETING_IMAGES.testimonialCompany2, usedOn: "Testimonials" },
  { key: "testimonialCompany3", filename: "testimonial-company-3.webp", path: MARKETING_IMAGES.testimonialCompany3, usedOn: "Testimonials (reserved)" },
  { key: "aboutTeam", filename: "about-team.webp", path: MARKETING_IMAGES.aboutTeam, usedOn: "About" },
  { key: "aboutMission", filename: "about-mission.webp", path: MARKETING_IMAGES.aboutMission, usedOn: "About" },
  { key: "contactHero", filename: "contact-hero.webp", path: MARKETING_IMAGES.contactHero, usedOn: "Contact" },
  { key: "requestAccessHero", filename: "request-access-hero.webp", path: MARKETING_IMAGES.requestAccessHero, usedOn: "Request Access" },
  { key: "atmosphereLight", filename: "atmosphere-light.webp", path: MARKETING_IMAGES.atmosphereLight, usedOn: "Marketing main atmosphere (light)" },
  { key: "atmosphereDark", filename: "atmosphere-dark.webp", path: MARKETING_IMAGES.atmosphereDark, usedOn: "Final navy CTA atmosphere (dark)" },
  { key: "atmosphereLightFallback", filename: "atmosphere-light.svg", path: MARKETING_IMAGES.atmosphereLightFallback, usedOn: "Light atmosphere SVG fallback" },
  { key: "atmosphereDarkFallback", filename: "atmosphere-dark.svg", path: MARKETING_IMAGES.atmosphereDarkFallback, usedOn: "Dark atmosphere SVG fallback" },
];
