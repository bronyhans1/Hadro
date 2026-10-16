import {
  createMemoryLocaleStorage,
  catalogs,
  documentLocaleAttributes,
  en,
  formatCurrency as formatLocaleCurrency,
  formatDate,
  formatNumber,
  getTextDirection,
  loadLocalePreference,
  LOCALE_META,
  parseStoredPreference,
  resolveActiveLocale,
  resolveLocale,
  saveLocalePreference,
  setActiveLocale,
  SUPPORTED_LOCALES,
  translate,
} from "../../../../shared/i18n";
import { formatCurrency } from "../formatCurrency";

describe("i18n foundation", () => {
  afterEach(() => {
    setActiveLocale("en");
  });

  function expectReviewed(key: string, locale: "fr" | "pt" | "ar" | "sw" | "es") {
    const value = translate(key, { locale });
    const english = translate(key, { locale: "en" });
    expect(value.trim().length).toBeGreaterThan(0);
    expect(value).not.toBe(key);
    const tokens = (input: string) =>
      [...input.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map((match) => match[1]).sort().join(",");
    expect(tokens(value)).toBe(tokens(english));
  }

  test("English is the default and unsupported locales fall back to English", () => {
    expect(resolveLocale(null)).toBe("en");
    expect(resolveLocale("")).toBe("en");
    expect(resolveLocale("zh-CN")).toBe("en");
    expect(resolveLocale("de")).toBe("en");
    expect(resolveActiveLocale(null)).toBe("en");
    expect(resolveActiveLocale("system", "ja")).toBe("en");
  });

  test("supported locale detection keeps the language and ignores country", () => {
    expect(resolveLocale("fr")).toBe("fr");
    expect(resolveLocale("fr-SN")).toBe("fr");
    expect(resolveLocale("pt_BR")).toBe("pt");
    expect(resolveLocale("AR")).toBe("ar");
    expect(resolveLocale("sw-KE")).toBe("sw");
    expect(resolveLocale("es-MX")).toBe("es");
    expect(resolveActiveLocale("system", "fr-SN")).toBe("fr");
  });

  test("locale preference persists and invalid values are ignored", async () => {
    const storage = createMemoryLocaleStorage();
    expect(await loadLocalePreference(storage)).toBeNull();
    await saveLocalePreference(storage, "sw");
    expect(await loadLocalePreference(storage)).toBe("sw");
    storage.set("not-a-locale");
    expect(await loadLocalePreference(storage)).toBeNull();
    expect(resolveActiveLocale(await loadLocalePreference(storage))).toBe("en");
  });

  test("translation lookup falls back to English when a locale catalog is empty", () => {
    expect(translate("attendance.clockIn", { locale: "en" })).toBe("Clock In");
    expectReviewed("attendance.clockOut", "fr");
    expectReviewed("attendance.clockedIn", "ar");
    expectReviewed("attendance.clockedOut", "pt");
    expect(translate("missing.key", { locale: "es" })).toBe("missing.key");
  });

  test("pluralization uses the English catalog", () => {
    expect(translate("employees.count", { locale: "en", count: 1 })).toBe("1 employee");
    expect(translate("employees.count", { locale: "sw", count: 3 })).toBe("Wafanyakazi 3");
  });

  test("navigation and common keys keep the current English wording", () => {
    expect(translate("navigation.dashboard")).toBe("Dashboard");
    expect(translate("navigation.attendance")).toBe("Attendance");
    expect(translate("navigation.signOut")).toBe("Sign Out");
    expect(translate("navigation.home")).toBe("Home");
    expect(translate("common.retry")).toBe("Retry");
    expect(translate("common.noData")).toBe("No data");
    expect(translate("common.close")).toBe("Close");
    expectReviewed("errors.generic", "fr");
    expectReviewed("permissions.roles.company_admin", "ar");
    expectReviewed("profile.accountStatus.active", "sw");
  });

  test("authentication keys keep the current English wording and fall back from empty locales", () => {
    expect(translate("auth.welcomeBack")).toBe("Welcome back");
    expect(translate("auth.signInToContinue")).toBe("Sign in to continue to your workspace.");
    expect(translate("auth.email")).toBe("Email");
    expect(translate("auth.password")).toBe("Password");
    expect(translate("auth.signIn")).toBe("Sign in");
    expect(translate("auth.signingIn")).toBe("Signing in…");
    expect(translate("auth.signingInLabel")).toBe("Signing in");
    expect(translate("auth.forgotPassword")).toBe("Forgot password?");
    expect(translate("auth.needHelp")).toBe("Need help? Contact Us");
    expect(translate("auth.show")).toBe("Show");
    expect(translate("auth.hide")).toBe("Hide");
    expectReviewed("auth.loginFailed", "fr");
    expectReviewed("auth.forgotEmailFirst", "pt");
    expectReviewed("auth.forgotEmailFirstShort", "ar");
    expectReviewed("auth.resetUnavailable", "sw");
    expectReviewed("auth.resetUnavailableShort", "es");
    expect(translate("auth.resetLinkSent")).toBe("Password reset link sent. Check your email inbox.");
    expectReviewed("auth.resetLinkSentShort", "fr");
    expect(translate("auth.passwordUpdatedSignIn")).toBe("Your password was updated. You can sign in now.");
    expect(translate("auth.sessionExpiredTitle")).toBe("Session Expired");
    expectReviewed("auth.sessionExpiredBody", "ar");
    expectReviewed("auth.sessionExpired", "pt");
    expect(translate("auth.agreePrefix")).toBe("By continuing, you agree to HADRO’s");
    expect(translate("auth.termsOfService")).toBe("Terms of Service");
    expect(translate("auth.privacyPolicy")).toBe("Privacy Policy");
    expect(translate("auth.setNewPassword")).toBe("Set a new password");
    expect(translate("auth.chooseStrongPassword")).toBe(
      "Choose a strong password you haven't used elsewhere."
    );
    expectReviewed("auth.resetLinkInvalid", "sw");
    expect(translate("auth.couldNotVerifyReset")).toBe("Could not verify your reset link.");
    expectReviewed("auth.passwordsDoNotMatch", "es");
    expect(translate("auth.passwordMinLength")).toBe("Password must be at least 8 characters.");
    expect(translate("auth.passwordMinHint")).toBe("At least 8 characters");
    expect(translate("auth.newPassword")).toBe("New password");
    expect(translate("auth.confirmPassword")).toBe("Confirm password");
    expect(translate("auth.updatePassword")).toBe("Update password");
    expect(translate("auth.updatingPassword")).toBe("Updating password…");
    expectReviewed("auth.backToSignIn", "fr");
    expect(translate("auth.logOutQuestion")).toBe("Log out?");
    expect(translate("auth.logOut")).toBe("Log out");
    expect(translate("auth.logOutBody")).toBe(
      "Are you sure you want to log out? You'll need to sign in again to access your workspace."
    );
    expectReviewed("auth.logOutOfHadro", "ar");
    expect(translate("common.signOut")).toBe("Sign out");
    expect(translate("navigation.signOut")).toBe("Sign Out");
    expect(translate("auth.preparingWorkspace")).toBe("Preparing your workspace...");
    expectReviewed("auth.webAppRequired", "pt");
    expect(translate("auth.mobileCopyright")).toBe("HADRO Mobile ©");
    expect(translate("auth.webCopyright")).toBe("HADRO ©");
    expectReviewed("attendance.clockIn", "fr");
    expectReviewed("attendance.clockOut", "es");
  });

  test("attendance keys keep approved Clock In wording and fall back to English", () => {
    expect(translate("attendance.clockIn")).toBe("Clock In");
    expect(translate("attendance.clockOut")).toBe("Clock Out");
    expect(translate("attendance.clockedIn")).toBe("Clocked In");
    expect(translate("attendance.clockedOut")).toBe("Clocked Out");
    expect(translate("attendance.clockInTime")).toBe("Clock-in Time");
    expect(translate("attendance.clockOutTime")).toBe("Clock-out Time");
    expectReviewed("attendance.scanToClockIn", "fr");
    expectReviewed("attendance.clockInFailed", "pt");
    expectReviewed("attendance.clockOutFailed", "ar");
    expectReviewed("attendance.clockedInSuccessfully", "sw");
    expectReviewed("attendance.clockedOutSuccessfully", "es");
    expectReviewed("attendance.remoteClockIn", "fr");
    expectReviewed("attendance.notClockedIn", "ar");
    expectReviewed("navigation.attendance", "pt");
    expectReviewed("common.back", "sw");
    expect(translate("attendance.clockIn")).not.toMatch(/Check In|Check Out|Checked In|Checked Out/);
    expect(translate("attendance.clockOut")).not.toMatch(/Check-in|Check-out/);
  });

  test("employee management keys keep current English wording and fall back", () => {
    expect(translate("employees.title")).toBe("Employees");
    expect(translate("employees.addEmployee")).toBe("Add Employee");
    expect(translate("employees.employeeProfile")).toBe("Employee profile");
    expect(translate("employees.searchPlaceholder")).toBe("Search by employee name, email or ID...");
    expect(translate("employees.manualClockEllipsis")).toBe("Manual Clock In / Clock Out…");
    expect(translate("employees.showingCount", { values: { shown: 2, total: 8 } })).toBe("Showing 2 of 8");
    expect(translate("employees.count", { count: 1 })).toBe("1 employee");
    expect(translate("employees.count", { count: 2 })).toBe("2 employees");
    expect(translate("profile.accountStatus.active")).toBe("Active");
    expect(translate("profile.accountStatus.inactive")).toBe("Inactive");
    expect(translate("profile.accountStatus.suspended")).toBe("Suspended");
    expect(translate("profile.gender.female")).toBe("Female");
    expect(translate("permissions.roles.employee")).toBe("Employee");
    expectReviewed("employees.addEmployee", "fr");
    expectReviewed("employees.employeeDirectory", "ar");
    expectReviewed("employees.noEmployeesFound", "pt");
    expectReviewed("employees.failedAddEmployee", "sw");
    expectReviewed("employees.deleteUser", "es");
  });

  test("leave keys keep current English wording and fall back", () => {
    expect(translate("navigation.leave")).toBe("Leave");
    expect(translate("leave.requestLeave")).toBe("Request Leave");
    expect(translate("leave.requestLeaveAction")).toBe("Request leave");
    expect(translate("leave.pending")).toBe("Pending");
    expect(translate("leave.approved")).toBe("Approved");
    expect(translate("leave.rejected")).toBe("Rejected");
    expect(translate("leave.cancelled")).toBe("Cancelled");
    expect(translate("leave.types.annual")).toBe("Annual");
    expect(translate("leave.days", { count: 1 })).toBe("1 day");
    expect(translate("leave.days", { count: 2 })).toBe("2 days");
    expect(translate("leave.requestsNeedAction", { count: 1 })).toBe("1 request need action");
    expect(translate("leave.requestsNeedAction", { count: 2 })).toBe("2 requests need action");
    expect(translate("leave.daysLeft", { count: 1 })).toBe("1 day left");
    expect(translate("leave.daysLeft", { count: 2 })).toBe("2 days left");
    expectReviewed("leave.requestLeave", "fr");
    expectReviewed("leave.pending", "ar");
    expectReviewed("leave.approved", "pt");
    expectReviewed("leave.rejected", "sw");
    expectReviewed("leave.cancelled", "es");
    expect(translate("leave.onLeaveUntilClockIn", { values: { date: "2026-10-01" } })).toContain("Clock-in");
    expect(translate("leave.onLeaveUntilClockIn")).not.toMatch(/Check In|Check Out|Check-in|Check-out/);
  });

  test("payroll labels resolve in English and fall back for other locales", () => {
    expect(translate("payroll.title")).toBe("Payroll");
    expect(translate("navigation.payroll")).toBe("Payroll");
    expect(translate("payroll.grossPayroll")).toBe("Gross Payroll");
    expect(translate("payroll.gross")).toBe("Gross");
    expect(translate("payroll.payslip")).toBe("Payslip");
    expect(translate("payroll.payslips")).toBe("Payslips");
    expect(translate("payroll.expectedSalary")).toBe("Expected salary");
    expect(translate("payroll.manualOvertime")).toBe("Manual Overtime");
    expect(translate("payroll.latePayDeduction")).toBe("Late pay deduction");
    expect(translate("payroll.earnings")).toBe("Earnings");
    expect(translate("payroll.liveEarnings")).toBe("Live earnings");
    expect(translate("payroll.timelineEvents", { count: 1 })).toBe("1 event");
    expect(translate("payroll.timelineEvents", { count: 2 })).toBe("2 events");
    expect(translate("payroll.draftEntriesInView", { count: 1 })).toBe("1 draft entry in view");
    expect(translate("payroll.draftEntriesInView", { count: 2 })).toBe("2 draft entries in view");
    expectReviewed("payroll.title", "fr");
    expectReviewed("payroll.grossPayroll", "ar");
    expectReviewed("payroll.payslip", "pt");
    expectReviewed("payroll.expectedSalary", "sw");
    expectReviewed("payroll.manualOvertime", "es");
    expect(translate("payroll.lateMtd", { values: { amount: "GHS 12.50" } })).toBe("Late MTD: −GHS 12.50");
    expect(translate("payroll.hourlyAt", { values: { amount: "GHS 20.00" } })).toBe("@ GHS 20.00/hr");
    expect(formatCurrency(8500, "GHS")).toBe("GHS 8,500.00");
    expect(formatCurrency(1250.5, "USD")).toBe("USD 1,250.50");
    expect(formatCurrency(8500, "EUR").startsWith("GHS ")).toBe(true);
  });

  test("department labels resolve in English and fall back for other locales", () => {
    expect(translate("departments.title")).toBe("Departments");
    expect(translate("navigation.departments")).toBe("Departments");
    expect(translate("attendance.department")).toBe("Department");
    expect(translate("departments.addDepartment")).toBe("Add Department");
    expect(translate("departments.addDepartmentSentence")).toBe("Add department");
    expect(translate("departments.searchDepartments")).toBe("Search departments");
    expect(translate("departments.noDepartmentsYet")).toBe("No departments created yet.");
    expect(translate("departments.deleteConfirm", { values: { name: "Human Resources" } })).toBe(
      'Are you sure you want to delete "Human Resources"? This action cannot be undone.'
    );
    expectReviewed("departments.title", "fr");
    expectReviewed("departments.addDepartment", "ar");
    expectReviewed("departments.editDepartment", "pt");
    expectReviewed("departments.deleteDepartment", "sw");
    expectReviewed("departments.departmentList", "es");
    expect(translate("Human Resources")).toBe("Human Resources");
  });

  test("branch labels resolve in English and fall back for other locales", () => {
    expect(translate("branches.title")).toBe("Branches");
    expect(translate("navigation.branches")).toBe("Branches");
    expect(translate("attendance.branch")).toBe("Branch");
    expect(translate("branches.addBranch")).toBe("Add Branch");
    expect(translate("branches.addBranchSentence")).toBe("Add branch");
    expect(translate("branches.searchBranches")).toBe("Search branches");
    expect(translate("branches.deleteConfirm", { values: { name: "Accra Headquarters" } })).toBe(
      'Delete "Accra Headquarters"? This only works if no users or departments are assigned to it.'
    );
    expect(translate("branches.count", { count: 1 })).toBe("1 Branch");
    expect(translate("branches.count", { count: 2 })).toBe("2 Branches");
    expectReviewed("branches.title", "fr");
    expectReviewed("branches.addBranch", "ar");
    expectReviewed("branches.editBranch", "pt");
    expectReviewed("branches.latitude", "sw");
    expectReviewed("branches.deleteBranch", "es");
    expect(translate("Accra Headquarters")).toBe("Accra Headquarters");
  });

  test("report labels resolve in English and fall back for other locales", () => {
    expect(translate("navigation.reports")).toBe("Reports & Exports");
    expect(translate("reports.title")).toBe("Reports & Exports");
    expect(translate("reports.attendanceReport")).toBe("Attendance Report");
    expect(translate("reports.leaveReport")).toBe("Leave Report");
    expect(translate("reports.clockIn")).toBe("Clock-in");
    expect(translate("reports.clockOut")).toBe("Clock-out");
    expect(translate("reports.exportCsv")).toBe("Export CSV");
    expect(translate("reports.recordNoun", { count: 1 })).toBe("record");
    expect(translate("reports.recordNoun", { count: 2 })).toBe("records");
    expect(translate("reports.requestNoun", { count: 1 })).toBe("request");
    expect(translate("reports.requestNoun", { count: 2 })).toBe("requests");
    expectReviewed("reports.attendanceReport", "fr");
    expectReviewed("reports.leaveReport", "ar");
    expectReviewed("reports.clockIn", "pt");
    expectReviewed("reports.exportCsv", "sw");
    expectReviewed("reports.title", "es");
    expect(translate("Accra Headquarters")).toBe("Accra Headquarters");
  });

  test("notification labels resolve in English and fall back for other locales", () => {
    expect(translate("navigation.notifications")).toBe("Notifications");
    expect(translate("notifications.title")).toBe("Notifications");
    expect(translate("notifications.markAllRead")).toBe("Mark all read");
    expect(translate("notifications.noNotifications")).toBe("No notifications");
    expect(translate("notifications.unread")).toBe("Unread");
    expect(translate("notifications.read")).toBe("Read");
    expect(translate("notifications.bellAriaUnread", { values: { count: 3 } })).toBe(
      "Notifications, 3 unread"
    );
    expect(translate("notifications.unreadStayOnTop", { values: { count: 2 } })).toBe(
      "2 unread · Stay on top of work updates"
    );
    expect(translate("notifications.minutesAgo", { values: { count: 5 } })).toBe("5m ago");
    expect(translate("notifications.justNow")).toBe("Just now");
    expectReviewed("notifications.title", "fr");
    expectReviewed("notifications.markAllRead", "ar");
    expectReviewed("notifications.unread", "pt");
    expectReviewed("notifications.searchPlaceholder", "sw");
    expectReviewed("notifications.upToDate", "es");
    expect(translate("John requested annual leave.")).toBe("John requested annual leave.");
  });

  test("settings labels resolve in English and fall back for other locales", () => {
    expect(translate("navigation.settings")).toBe("Settings");
    expect(translate("settings.title")).toBe("Settings");
    expect(translate("settings.attendanceConfiguration")).toBe("Attendance Configuration");
    expect(translate("leave.companyHolidays")).toBe("Company Holidays");
    expect(translate("settings.saveChanges")).toBe("Save changes");
    expect(translate("settings.addHoliday")).toBe("Add holiday");
    expect(translate("settings.paid")).toBe("paid");
    expect(translate("settings.unpaid")).toBe("unpaid");
    expect(translate("settings.light")).toBe("Light");
    expect(translate("settings.dark")).toBe("Dark");
    expect(translate("settings.system")).toBe("System");
    expectReviewed("settings.attendanceConfiguration", "fr");
    expectReviewed("settings.saveChanges", "ar");
    expectReviewed("settings.addHoliday", "pt");
    expectReviewed("settings.appearance", "sw");
    expectReviewed("settings.themePreference", "es");
    expect(translate("Africa/Accra")).toBe("Africa/Accra");
    expect(translate("Independence Day")).toBe("Independence Day");
  });

  test("remaining module labels resolve in English and fall back", () => {
    expect(translate("dashboard.goodMorning")).toBe("Good morning");
    expect(translate("dashboard.todaysKpis")).toBe("Today's KPIs");
    expect(translate("dashboard.openSettings")).toBe("Open Settings");
    expect(translate("profile.firstName")).toBe("First name");
    expect(translate("profile.passwordUpdated")).toBe("Password updated");
    expect(translate("profile.saveProfile")).toBe("Save profile");
    expect(translate("settings.managedInSettings")).toBe("(managed in Settings)");
    expect(translate("attendance.sessionNoun", { count: 1 })).toBe("session");
    expect(translate("attendance.sessionNoun", { count: 2 })).toBe("sessions");
    expect(translate("audit.departmentCreate")).toBe("Created Department");
    expect(translate("audit.employeeClockedIn")).toBe("Employee Clocked In");
    expectReviewed("dashboard.goodMorning", "fr");
    expectReviewed("profile.myProfile", "ar");
    expectReviewed("audit.users", "pt");
    expectReviewed("platform.configuredInPortal", "sw");
    expectReviewed("dashboard.yourDay", "es");
    expect(translate("Accra Headquarters")).toBe("Accra Headquarters");
  });

  test("marketing labels resolve in English and fall back", () => {
    expect(translate("marketing.nav.faqs")).toBe("FAQs");
    expect(translate("marketing.cta.requestAccess")).toBe("Request access");
    expect(translate("marketing.home.title")).toBe(
      "Simplify workforce management across every site and shift."
    );
    expect(translate("marketing.footer.rights")).toBe("All rights reserved.");
    expect(translate("marketing.mockup.chrome")).toBe("HADRO · Web");
    expectReviewed("marketing.nav.faqs", "fr");
    expectReviewed("marketing.cta.requestAccess", "ar");
  });

  test("marketing download copy never exposes store-link developer instructions", () => {
    const forbidden = [
      /Store links are centralized/i,
      /Swap placeholders for live listings/i,
      /centralized in marketing configuration/i,
      /configuration marketing/i,
      /configuração de marketing/i,
      /configuración de marketing/i,
      /إعداد التسويق/i,
      /usanidi wa uuzaji/i,
    ];
    const locales = ["en", "fr", "pt", "es", "ar", "sw"] as const;
    for (const locale of locales) {
      const value = translate("marketing.mobile.downloadDescription", { locale });
      expect(value.trim().length).toBeGreaterThan(0);
      for (const pattern of forbidden) {
        expect(value).not.toMatch(pattern);
      }
    }
  });

  test("language selector locales stay explicit and fall back to English", () => {
    expect([...SUPPORTED_LOCALES]).toEqual(["en", "fr", "pt", "ar", "sw", "es"]);
    expect(LOCALE_META.en.nativeName).toBe("English");
    expect(LOCALE_META.fr.nativeName).toBe("Français");
    expect(LOCALE_META.pt.nativeName).toBe("Português");
    expect(LOCALE_META.ar.nativeName).toBe("العربية");
    expect(LOCALE_META.sw.nativeName).toBe("Kiswahili");
    expect(LOCALE_META.es.nativeName).toBe("Español");
    expect(translate("settings.language")).toBe("Language");
    expectReviewed("settings.selectLanguage", "fr");
    expect(translate("settings.currentLanguage", { values: { language: "Français" } })).toBe(
      "Current language: Français"
    );

    for (const code of SUPPORTED_LOCALES) {
      expect(resolveActiveLocale(code)).toBe(code);
      expect(documentLocaleAttributes(code)).toEqual({
        lang: code,
        dir: code === "ar" ? "rtl" : "ltr",
      });
    }

    expect(parseStoredPreference("nope")).toBeNull();
    expect(parseStoredPreference("")).toBeNull();
    expect(resolveActiveLocale(parseStoredPreference("de"))).toBe("en");
    expect(resolveActiveLocale(null)).toBe("en");
  });

  test("Arabic is RTL and English is LTR", () => {
    expect(getTextDirection("ar")).toBe("rtl");
    expect(getTextDirection("en")).toBe("ltr");
    expect(getTextDirection("fr")).toBe("ltr");
  });

  test("reviewed catalogs keep locked attendance terms and interpolation", () => {
    expect(translate("attendance.clockIn", { locale: "fr" })).toBe("Pointer l'arrivée");
    expect(translate("attendance.clockOut", { locale: "fr" })).toBe("Pointer le départ");
    expect(translate("attendance.clockedIn", { locale: "pt" })).toBe("Entrada registada");
    expect(translate("attendance.clockedOut", { locale: "es" })).toBe("Salida registrada");
    expect(translate("attendance.clockIn", { locale: "ar" })).toBe("تسجيل الحضور");
    expect(translate("attendance.clockOut", { locale: "sw" })).toBe("Sajili Kutoka");
    expect(translate("payroll.grossPayroll", { locale: "fr" })).toBe("Masse salariale brute");
    expect(translate("employees.count", { locale: "fr", count: 1 })).toBe("1 employé");
    expect(translate("employees.count", { locale: "ar", count: 2 })).toBe("2 موظفان");
    expect(translate("marketing.nav.why", { locale: "es" })).toContain("HADRO");
    expect(translate("missing.key", { locale: "fr" })).toBe("missing.key");
  });

  test("active locale formats dates and numbers without changing currency codes", () => {
    const date = new Date("2026-09-23T15:04:00Z");
    const options = { dateStyle: "medium" as const, timeZone: "UTC" };
    expect(formatDate(date, "fr", options)).not.toBe(formatDate(date, "en", options));
    expect(formatNumber(1234.5, "fr")).not.toBe(formatNumber(1234.5, "en"));
    setActiveLocale("ar");
    expect(formatDate(date)).not.toBe(formatDate(date, "en"));
    expect(formatLocaleCurrency(8500, "GHS", "ar")).toMatch(/GHS/);
  });

  test("every English catalog leaf exists in each reviewed locale", () => {
    const tokens = (input: string) =>
      [...input.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map((match) => match[1]).sort().join(",");
    const problems: string[] = [];
    function walk(english: unknown, localized: unknown, prefix: string) {
      if (typeof english === "string") {
        if (typeof localized !== "string" || !localized.trim()) problems.push(`missing ${prefix}`);
        else if (tokens(english) !== tokens(localized)) problems.push(`tokens ${prefix}`);
        return;
      }
      if (Array.isArray(english)) {
        if (!Array.isArray(localized)) {
          problems.push(`missing ${prefix}`);
          return;
        }
        english.forEach((item, index) => walk(item, localized[index], `${prefix}.${index}`));
        return;
      }
      if (english && typeof english === "object") {
        for (const key of Object.keys(english as Record<string, unknown>)) {
          const next =
            localized && typeof localized === "object"
              ? (localized as Record<string, unknown>)[key]
              : undefined;
          walk((english as Record<string, unknown>)[key], next, prefix ? `${prefix}.${key}` : key);
        }
      }
    }
    for (const locale of ["fr", "pt", "ar", "sw", "es"] as const) {
      walk(en, catalogs[locale], locale);
    }
    expect(problems).toEqual([]);
  });
});
