import { BRAND } from "@/lib/branding";
import { marketingText } from "@/lib/marketing/text";
import { LANDING_FEATURES, MARKETING, SIGNATURE_CAPABILITIES } from "./siteConfig";

/** Shared copy for Stage 4 marketing pages — keep routes thin. */

export const WHY_PAGE = {
  get eyebrow() { return marketingText("why.eyebrow"); },
  get title() { return marketingText("why.title"); },
  get description() { return marketingText("why.description"); },
  get pillars() {
    return [
      { title: marketingText("why.connectedTitle"), body: marketingText("why.connectedBody") },
      { title: marketingText("why.workplacesTitle"), body: marketingText("why.workplacesBody") },
      { title: marketingText("why.webMobileTitle"), body: marketingText("why.webMobileBody") },
    ];
  },
  get problems() {
    return [
      { title: marketingText("why.problemAttendanceTitle"), body: marketingText("why.problemAttendanceBody") },
      { title: marketingText("why.problemRemoteTitle"), body: marketingText("why.problemRemoteBody") },
      { title: marketingText("why.problemPayrollTitle"), body: marketingText("why.problemPayrollBody") },
      { title: marketingText("why.problemBranchesTitle"), body: marketingText("why.problemBranchesBody") },
    ];
  },
  get differentiators() {
    return [
      { title: marketingText("why.diffVerifyTitle"), body: marketingText("why.diffVerifyBody") },
      { title: marketingText("why.diffPlatformTitle"), body: marketingText("why.diffPlatformBody") },
      { title: marketingText("why.diffTrustTitle"), body: marketingText("why.diffTrustBody") },
      { title: marketingText("why.diffScaleTitle"), body: marketingText("why.diffScaleBody") },
    ];
  },
};

export const FEATURES_PAGE = {
  get eyebrow() { return marketingText("features.eyebrow"); },
  get title() { return marketingText("features.title"); },
  get description() { return marketingText("features.description"); },
  core: LANDING_FEATURES,
  signature: SIGNATURE_CAPABILITIES,
};

export const MOBILE_PAGE = {
  get eyebrow() { return marketingText("mobile.eyebrow"); },
  get title() { return marketingText("mobile.title"); },
  get description() { return marketingText("mobile.description"); },
  get highlights() {
    return [
      { title: marketingText("mobile.clockTitle"), body: marketingText("mobile.clockBody"), id: "clock" },
      { title: marketingText("mobile.gpsTitle"), body: marketingText("mobile.gpsBody"), id: "gps" },
      { title: marketingText("mobile.leaveTitle"), body: marketingText("mobile.leaveBody"), id: "leave" },
      { title: marketingText("mobile.earningsTitle"), body: marketingText("mobile.earningsBody"), id: "earnings" },
      { title: marketingText("mobile.notificationsTitle"), body: marketingText("mobile.notificationsBody"), id: "notifications" },
      { title: marketingText("mobile.historyTitle"), body: marketingText("mobile.historyBody"), id: "history" },
    ];
  },
  stores: {
    appStoreUrl: MARKETING.appStoreUrl,
    playStoreUrl: MARKETING.playStoreUrl,
  },
};

export const SECURITY_PAGE = {
  get eyebrow() { return marketingText("security.eyebrow"); },
  get title() { return marketingText("security.title"); },
  get description() { return marketingText("security.description"); },
  get pillars() {
    return [
      { title: marketingText("security.roleTitle"), body: marketingText("security.roleBody") },
      { title: marketingText("security.authTitle"), body: marketingText("security.authBody") },
      { title: marketingText("security.auditTitle"), body: marketingText("security.auditBody") },
      { title: marketingText("security.privacyTitle"), body: marketingText("security.privacyBody") },
    ];
  },
  get practices() {
    return [
      { title: marketingText("security.leastTitle"), body: marketingText("security.leastBody") },
      { title: marketingText("security.accountabilityTitle"), body: marketingText("security.accountabilityBody") },
      { title: marketingText("security.enterpriseTitle"), body: marketingText("security.enterpriseBody") },
    ];
  },
};

export const ABOUT_PAGE = {
  get eyebrow() { return marketingText("about.eyebrow"); },
  get title() { return marketingText("about.title", { values: { brand: BRAND.appName } }); },
  get description() { return marketingText("about.description"); },
  get mission() { return marketingText("about.mission"); },
  get beliefs() {
    return [
      { title: marketingText("about.clarityTitle"), body: marketingText("about.clarityBody") },
      { title: marketingText("about.operationsTitle"), body: marketingText("about.operationsBody") },
      { title: marketingText("about.togetherTitle"), body: marketingText("about.togetherBody") },
    ];
  },
  versionLabel: BRAND.versionLabel,
};

export const CONTACT_PAGE = {
  get eyebrow() { return marketingText("contact.eyebrow"); },
  get title() { return marketingText("contact.title"); },
  get description() { return marketingText("contact.description"); },
  email: MARKETING.contactEmail,
  get channels() {
    return [
      {
        title: marketingText("contact.requestTitle"),
        body: marketingText("contact.requestBody"),
        href: "/request-access",
        cta: marketingText("cta.requestAccess"),
      },
      {
        title: marketingText("contact.emailTitle"),
        body: marketingText("contact.emailBody"),
        href: `mailto:${MARKETING.contactEmail}`,
        cta: MARKETING.contactEmail,
      },
      {
        title: marketingText("contact.supportTitle"),
        body: marketingText("contact.supportBody"),
        href: "/support",
        cta: marketingText("cta.goToSupport"),
      },
    ];
  },
};

export const SUPPORT_PAGE = {
  get eyebrow() { return marketingText("support.eyebrow"); },
  get title() { return marketingText("support.title"); },
  get description() { return marketingText("support.description"); },
  email: MARKETING.contactEmail,
  get faqs() {
    const email = MARKETING.contactEmail;
    return [
      { question: marketingText("support.qRequest"), answer: marketingText("support.aRequest") },
      { question: marketingText("support.qAgain"), answer: marketingText("support.aAgain") },
      { question: marketingText("support.qDownload"), answer: marketingText("support.aDownload") },
      {
        question: marketingText("support.qAccount"),
        answer: marketingText("support.aAccount", { values: { email } }),
      },
      { question: marketingText("support.qMore"), answer: marketingText("support.aMore") },
      { question: marketingText("support.qLegal"), answer: marketingText("support.aLegal") },
    ];
  },
};
