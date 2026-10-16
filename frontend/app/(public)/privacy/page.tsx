import Link from "next/link";
import { BRAND } from "@/lib/branding";
import { MARKETING } from "@/lib/marketing/siteConfig";

const EFFECTIVE_DATE = "1st October 2026";

export default function PrivacyPolicyPage() {
  return (
    <div className="legal-page-shell">
      <div className="legal-art-layer legal-art-layer--light dark:hidden" aria-hidden />
      <div className="legal-art-layer legal-art-layer--dark hidden dark:block" aria-hidden />
      <div className="legal-page-content px-3 py-6 sm:px-6 sm:py-10 md:py-12">
        <div className="mx-auto w-full min-w-0 max-w-[820px]">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 sm:mb-6 sm:gap-3">
            <Link href="/" className="text-sm font-semibold text-theme-muted hover:text-theme">
              ← Home
            </Link>
            <Link href="/login" className="text-sm font-semibold text-theme-muted hover:text-theme">
              Sign in
            </Link>
          </div>

          <div className="legal-card-frame">
            <main className="legal-card-inner px-4 py-6 sm:px-10 sm:py-10">
              <header className="mb-8 sm:mb-10">
                <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl md:text-4xl">
                  Privacy Policy
                </h1>
                <p className="mt-2 text-sm text-theme-muted">{BRAND.legalName}</p>
                <div
                  className="mt-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium text-theme-muted"
                  style={{ borderColor: "var(--border-soft)", background: "var(--surface-muted)" }}
                >
                  <span className="text-theme">Effective Date:</span> {EFFECTIVE_DATE}
                </div>
              </header>

              <div
                className="space-y-9 text-[0.9375rem] leading-[1.7] text-pretty"
                style={{ color: "var(--text-primary)" }}
              >
                <section>
                  <h2 className="text-base font-semibold sm:text-lg">1. Introduction</h2>
                  <p className="mt-3">
                    {BRAND.legalName} (&quot;{BRAND.companyName}&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;)
                    operates {BRAND.appName}, an Intelligent Workforce Management platform delivered through a web
                    administration workspace and a companion mobile application.
                  </p>
                  <p className="mt-3">
                    {BRAND.appName} helps organizations manage attendance (including Clock In and Clock Out), leave,
                    payroll visibility, employee records, branches, departments, reporting, and related workforce
                    operations. This Privacy Policy explains how we collect, use, store, and share information when
                    organizations and individuals use our services.
                  </p>
                  <p className="mt-3">
                    {BRAND.companyName} is founded and operated from Ghana, and {BRAND.appName} is designed for
                    organizations across Africa and other markets where we provide access. This Policy describes our
                    practices in a way that can apply across jurisdictions. Users and organizations may also have
                    rights or obligations under the privacy, employment, or data-protection laws that apply in their
                    location.
                  </p>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">2. Scope</h2>
                  <p className="mt-3">This Privacy Policy applies to:</p>
                  <ul className="mt-3 list-disc space-y-1.5 pl-5" style={{ color: "var(--text-muted)" }}>
                    <li>The public {BRAND.appName} website (including request-access and contact pathways)</li>
                    <li>The {BRAND.appName} web workspace used by administrators, managers, HR, and platform operators</li>
                    <li>The {BRAND.appName} mobile application used primarily by employees and approvers</li>
                    <li>Related support communications we send or receive about the service</li>
                  </ul>
                  <p className="mt-3">
                    Organizations that subscribe to or are provisioned for {BRAND.appName} control how their workforce
                    data is configured and who may access it inside their account. Individual employees typically
                    interact with {BRAND.appName} because their organization has enrolled them.
                  </p>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">3. Information We Collect</h2>
                  <p className="mt-3">
                    The information we process depends on how you interact with {BRAND.appName}—as a prospective
                    customer, an organization administrator, or an employee user.
                  </p>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">4. Information Provided by Organizations</h2>
                  <p className="mt-3">
                    When an organization requests access or is onboarded, we may collect company and contact details
                    such as company name, contact person name, work email, phone number, country, role, approximate
                    employee count, and optional notes about workforce needs.
                  </p>
                  <p className="mt-3">
                    Organization administrators may also configure company profile information, logos, branches,
                    departments, offices, shifts, holidays, policies, wage or salary settings, and related operational
                    settings required to run the service.
                  </p>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">5. Employee and User Information</h2>
                  <p className="mt-3">For users of the web or mobile applications, we may process:</p>
                  <ul className="mt-3 list-disc space-y-1.5 pl-5" style={{ color: "var(--text-muted)" }}>
                    <li>Identity and profile details (such as name, email, phone number, date of birth, gender, and profile photo where provided)</li>
                    <li>Employment structure details (role, status, branch, department, shift, and remote-attendance settings)</li>
                    <li>Leave information (leave types, balances, requests, and approval outcomes)</li>
                    <li>Payroll-related visibility data (configured rates or salaries, earnings calculations, overtime entries, payslips, and related period information)</li>
                    <li>In-app notifications related to leave, attendance, payroll events, and similar workflow alerts</li>
                    <li>Audit and activity records created by administrative or system actions where those features are enabled</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">6. Attendance and Location Information</h2>
                  <p className="mt-3">
                    Attendance is a core {BRAND.appName} feature. Depending on how an organization configures attendance,
                    we may process Clock In and Clock Out records, work-session history, QR validation events, remote
                    attendance requests and approvals, lateness or absence indicators, and related attendance notes.
                  </p>
                  <p className="mt-3">
                    Where GPS attendance is used, location coordinates may be collected at the time of an attendance
                    action (for example, during Clock In or Clock Out) to support verification against organization
                    settings such as branch locations or geofences. We do not use attendance GPS to continuously track
                    users in the background as a general location-monitoring product.
                  </p>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">7. Device, Technical, and Usage Information</h2>
                  <p className="mt-3">
                    To operate and secure the service, we may process technical information such as authentication
                    tokens, session-related data stored locally on a device or browser, IP addresses used for request
                    handling and rate limiting, and operational logs needed to diagnose issues and protect accounts.
                  </p>
                  <p className="mt-3">
                    {BRAND.appName} does not currently operate a separate marketing-analytics or advertising cookie
                    platform on the public website. Theme and interface preferences may be stored locally in your
                    browser or device to improve usability.
                  </p>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">8. Authentication and Account Information</h2>
                  <p className="mt-3">
                    Account access uses email-and-password authentication through our authentication provider.
                    Password reset flows are handled through secure email links. After first sign-in, some users may
                    be asked to complete a required onboarding step (such as setting a password and confirming date of
                    birth) before full access is granted.
                  </p>
                  <p className="mt-3">
                    Access is role-based. Typical roles include employee, manager, HR, company administrator, and
                    platform administrator. Organization or user accounts may be suspended or deactivated by
                    authorized administrators, which can prevent further sign-in.
                  </p>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">9. How We Use Information</h2>
                  <p className="mt-3">We use information to:</p>
                  <ul className="mt-3 list-disc space-y-1.5 pl-5" style={{ color: "var(--text-muted)" }}>
                    <li>Provide and maintain the {BRAND.appName} web and mobile services</li>
                    <li>Authenticate users and manage sessions</li>
                    <li>Support Clock In / Clock Out verification, including QR and GPS where configured</li>
                    <li>Enable leave workflows, approvals, and balances</li>
                    <li>Provide payroll visibility, payslips, and related reporting configured by the organization</li>
                    <li>Deliver in-app (and, where enabled, email) notifications about relevant events</li>
                    <li>Support onboarding of prospective customers and provisioned organizations</li>
                    <li>Secure the platform, prevent abuse, and investigate integrity or access issues</li>
                    <li>Respond to support requests sent to us</li>
                    <li>Improve reliability and user experience of the product</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">10. How Information Is Shared</h2>
                  <p className="mt-3">We do not sell personal information.</p>
                  <p className="mt-3">Information may be shared:</p>
                  <ul className="mt-3 list-disc space-y-1.5 pl-5" style={{ color: "var(--text-muted)" }}>
                    <li>Within an organization, according to role-based permissions (for example, managers reviewing attendance or leave)</li>
                    <li>With service providers that help us host, authenticate, store, or operate the platform</li>
                    <li>When required to comply with applicable law, lawful requests, or to protect rights, safety, and integrity</li>
                    <li>In connection with a corporate transaction, where permitted and subject to appropriate safeguards</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">11. Service Providers and Third-Party Services</h2>
                  <p className="mt-3">
                    We use trusted infrastructure providers to operate {BRAND.appName}, including cloud authentication,
                    database, and file-storage services. Where email delivery is enabled for certain notifications, we
                    may use an email delivery configuration operated by {BRAND.companyName}.
                  </p>
                  <p className="mt-3">
                    These providers process information on our instructions to deliver the service. They maintain their
                    own security and privacy practices for the infrastructure they operate.
                  </p>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">12. Data Security</h2>
                  <p className="mt-3">
                    We take reasonable technical and organizational measures to protect information, including
                    authenticated access, encrypted connections (HTTPS), role-based authorization inside the product,
                    and operational controls for company and platform administration.
                  </p>
                  <p className="mt-3">
                    No method of transmission or storage is completely secure. Organizations and users are also
                    responsible for protecting credentials and configuring access appropriately within their accounts.
                  </p>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">13. Data Retention</h2>
                  <p className="mt-3">
                    We retain information for as long as needed to provide the service, support legitimate business
                    operations, resolve disputes, enforce agreements, and meet applicable legal or accounting
                    requirements. Retention needs can vary by data type and by the organization&apos;s operational
                    settings. When an organization ends its relationship with us, we will handle retained data in
                    accordance with our contractual and operational processes then in effect.
                  </p>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">14. Customer Data and Ownership</h2>
                  <p className="mt-3">
                    Workforce and operational data entered for an organization remains associated with that
                    organization&apos;s account. Organization administrators control much of the day-to-day management
                    of employee records, attendance, leave, and related settings. Employees can typically view
                    information about themselves that the product exposes to their role.
                  </p>
                  <p className="mt-3">
                    For workforce information submitted by an organization, the organization generally determines the
                    purposes for which that information is used within HADRO, while HADRO processes the information to
                    provide, secure, maintain, and support the Services, subject to applicable law and the
                    organization&apos;s agreement with HADRO.
                  </p>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">15. Rights and Choices</h2>
                  <p className="mt-3">
                    Depending on your role, the type of information involved, and applicable law, you may have rights
                    or controls relating to your personal information, which may include access, correction, deletion,
                    objection, restriction of processing, portability, or other rights recognized by applicable law.
                  </p>
                  <p className="mt-3">
                    Where HADRO processes workforce information on behalf of an organization, requests relating to that
                    information may need to be directed first to the relevant organization or administrator. HADRO may
                    assist the organization with applicable requests where appropriate.
                  </p>
                  <p className="mt-3">
                    You may also contact HADRO at support@hadrotech.com regarding privacy-related questions or
                    requests. We may need to verify your identity and may be subject to lawful limitations or
                    exceptions when responding.
                  </p>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">16. International and Cross-Border Processing</h2>
                  <p className="mt-3">
                    {BRAND.appName} may be used by organizations and individuals in different countries. Information
                    may be processed in locations where we or our infrastructure providers operate. Where cross-border
                    processing occurs, we take steps appropriate to the nature of the service and the providers we use.
                    Applicable local laws may provide additional protections or obligations.
                  </p>
                  <p className="mt-3">
                    Where applicable law imposes requirements for international transfers or cross-border processing,
                    we will take reasonable steps to use appropriate safeguards or other legally recognized mechanisms.
                  </p>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">17. Children</h2>
                  <p className="mt-3">
                    {BRAND.appName} is intended for organizational workforce use by adults. It is not directed to
                    children, and we do not knowingly collect personal information from children for the purpose of
                    providing the service.
                  </p>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">18. Changes to This Privacy Policy</h2>
                  <p className="mt-3">
                    We may update this Privacy Policy from time to time. When we do, we will revise the Effective Date
                    above. Continued use of the services after an update means the revised Policy applies to subsequent
                    use, except where applicable law requires additional notice or consent.
                  </p>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">19. Contact Information</h2>
                  <p className="mt-3">
                    For privacy questions or requests related to {BRAND.appName}, contact:
                  </p>
                  <div className="legal-contact-panel mt-4 text-sm">
                    <div
                      className="flex flex-col gap-1 pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                      style={{ borderBottom: "1px solid var(--border-soft)" }}
                    >
                      <span className="text-xs font-semibold uppercase tracking-wide text-theme-muted">Company</span>
                      <span className="text-right font-semibold">{BRAND.legalName}</span>
                    </div>
                    <div
                      className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                      style={{ borderBottom: "1px solid var(--border-soft)" }}
                    >
                      <span className="text-xs font-semibold uppercase tracking-wide text-theme-muted">Support</span>
                      <a
                        href={`mailto:${BRAND.supportEmail}`}
                        className="text-right font-semibold text-[var(--ds-color-primary)] underline-offset-2 hover:underline"
                      >
                        {BRAND.supportEmail}
                      </a>
                    </div>
                    <div className="flex flex-col gap-1 pt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                      <span className="text-xs font-semibold uppercase tracking-wide text-theme-muted">Website</span>
                      <a
                        href={MARKETING.siteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-right font-semibold text-[var(--ds-color-primary)] underline-offset-2 hover:underline"
                      >
                        hadro.africa
                      </a>
                    </div>
                  </div>
                </section>
              </div>

              <div className="mt-12 flex flex-wrap items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-[var(--ds-color-primary)] underline-offset-4 hover:underline"
                >
                  ← Back to sign in
                </Link>
                <span className="text-xs text-theme-muted">•</span>
                <Link
                  href="/"
                  className="text-sm font-semibold text-[var(--ds-color-primary)] underline-offset-4 hover:underline"
                >
                  Back to home
                </Link>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
