/**
 * Ensures every MARKETING_IMAGES path has a seed .webp under frontend/public.
 * Existing files are left untouched — overwrite production art manually.
 *
 * Run from repo root or frontend:
 *   node frontend/scripts/ensure-marketing-assets.mjs
 *   node scripts/ensure-marketing-assets.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, "..");
const publicRoot = path.join(frontendRoot, "public");

/** Minimal valid 1×1 WebP (lossy). */
const SEED_WEBP = Buffer.from(
  "UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=",
  "base64"
);

const SUBDIRS = [
  "hero",
  "dashboard",
  "features",
  "workflow",
  "mobile",
  "industries",
  "security",
  "testimonials",
  "about",
  "contact",
  "request-access",
  "logos",
  "downloads",
];

/** Keep in sync with frontend/lib/marketing/assets.ts MARKETING_IMAGES paths. */
const FILES = [
  "hero/hero-dashboard.webp",
  "hero/hero-mobile.webp",
  "hero/why-hero.webp",
  "hero/solutions-hero.webp",
  "hero/faq-hero.webp",
  "dashboard/dashboard-overview.webp",
  "dashboard/dashboard-attendance.webp",
  "dashboard/dashboard-payroll.webp",
  "dashboard/dashboard-live-earnings.webp",
  "dashboard/dashboard-reports.webp",
  "dashboard/dashboard-industry.webp",
  "features/gps-attendance.webp",
  "features/remote-workforce.webp",
  "features/qr-attendance.webp",
  "features/live-earnings.webp",
  "features/multi-branch.webp",
  "features/employee-self-service.webp",
  "features/real-time-dashboard.webp",
  "features/feature-attendance.webp",
  "features/feature-payroll.webp",
  "features/feature-leave.webp",
  "features/feature-reports.webp",
  "features/feature-remote.webp",
  "features/features-overview.webp",
  "workflow/workflow-overview.webp",
  "mobile/mobile-home.webp",
  "mobile/mobile-attendance.webp",
  "mobile/mobile-gps.webp",
  "mobile/mobile-live-earnings.webp",
  "mobile/mobile-leave.webp",
  "mobile/mobile-notifications.webp",
  "mobile/mobile-employees.webp",
  "industries/industry-schools.webp",
  "industries/industry-hospitals.webp",
  "industries/industry-factories.webp",
  "industries/industry-warehouses.webp",
  "industries/industry-construction.webp",
  "industries/industry-hotels.webp",
  "industries/industry-retail.webp",
  "industries/industry-offices.webp",
  "industries/industry-logistics.webp",
  "industries/industry-government.webp",
  "security/security-overview.webp",
  "security/security-rbac.webp",
  "security/security-audit.webp",
  "security/security-auth.webp",
  "testimonials/testimonial-company-1.webp",
  "testimonials/testimonial-company-2.webp",
  "testimonials/testimonial-company-3.webp",
  "about/about-team.webp",
  "about/about-mission.webp",
  "contact/contact-hero.webp",
  "request-access/request-access-hero.webp",
];

const marketingRoot = path.join(publicRoot, "marketing");
fs.mkdirSync(marketingRoot, { recursive: true });

for (const dir of SUBDIRS) {
  fs.mkdirSync(path.join(marketingRoot, dir), { recursive: true });
}

let created = 0;
let skipped = 0;

for (const rel of FILES) {
  const full = path.join(marketingRoot, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  if (fs.existsSync(full)) {
    skipped += 1;
    continue;
  }
  fs.writeFileSync(full, SEED_WEBP);
  created += 1;
}

console.log(
  `Marketing assets ready under public/marketing — created ${created}, kept ${skipped} existing.`
);
