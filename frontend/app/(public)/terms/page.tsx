import Link from "next/link";
import { BRAND } from "@/lib/branding";
import { MARKETING } from "@/lib/marketing/siteConfig";

const EFFECTIVE_DATE = "1st October 2026";

export default function TermsOfServicePage() {
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
                  Terms of Service
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
                  <h2 className="text-base font-semibold sm:text-lg">1. Acceptance of Terms</h2>
                  <p className="mt-3">
                    These Terms of Service (&quot;Terms&quot;) govern access to and use of {BRAND.appName}, including
                    the public website, web workspace, and mobile application operated by {BRAND.legalName}
                    (&quot;{BRAND.companyName}&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
                  </p>
                  <p className="mt-3">
                    By accessing or using {BRAND.appName}, requesting access, or allowing users in your organization
                    to use the service, you agree to these Terms. If you are accepting on behalf of an organization,
                    you confirm that you have authority to bind that organization.
                  </p>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">2. Definitions</h2>
                  <ul className="mt-3 list-disc space-y-1.5 pl-5" style={{ color: "var(--text-muted)" }}>
                    <li>
                      <strong style={{ color: "var(--text-primary)" }}>Customer / Organization</strong> — the
                      company or entity provisioned to use {BRAND.appName} for its workforce.
                    </li>
                    <li>
                      <strong style={{ color: "var(--text-primary)" }}>User</strong> — any individual authorized to
                      access the service (for example, employee, manager, HR, company administrator, or platform
                      administrator).
                    </li>
                    <li>
                      <strong style={{ color: "var(--text-primary)" }}>Customer Data</strong> — information submitted
                      to or generated in the organization&apos;s {BRAND.appName} account, including employee profiles,
                      attendance, leave, and payroll-visibility records.
                    </li>
                    <li>
                      <strong style={{ color: "var(--text-primary)" }}>Services</strong> — the {BRAND.appName} web
                      and mobile products and related support channels we provide.
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">3. The Service</h2>
                  <p className="mt-3">
                    {BRAND.appName} is an Intelligent Workforce Management platform that may include attendance
                    (Clock In / Clock Out with QR and/or GPS verification where configured), leave management,
                    payroll visibility and payslips, employee administration, branches and departments, reporting,
                    notifications, and related tools.
                  </p>
                  <p className="mt-3">
                    {BRAND.companyName} is based in Ghana and builds {BRAND.appName} for organizations across Africa
                    and other markets where access is granted. Availability of specific features may depend on
                    provisioning, role permissions, and organization configuration.
                  </p>
                  <p className="mt-3">
                    Access is generally provided through organization provisioning and onboarding rather than open
                    public self-registration. Prospective customers may submit a request-access form on our website.
                  </p>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">4. Eligibility and Accounts</h2>
                  <p className="mt-3">
                    Users must be able to form a binding agreement under applicable law and must use accurate account
                    information. You are responsible for safeguarding login credentials and for activity that occurs
                    under your account.
                  </p>
                  <p className="mt-3">
                    Notify us promptly at {BRAND.supportEmail} if you believe an account has been compromised.
                    Organization administrators are responsible for authorizing and deactivating users for their
                    workforce.
                  </p>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">5. Organization and Administrator Responsibilities</h2>
                  <p className="mt-3">Organizations and their administrators are responsible for:</p>
                  <ul className="mt-3 list-disc space-y-1.5 pl-5" style={{ color: "var(--text-muted)" }}>
                    <li>Deciding who may access the organization&apos;s {BRAND.appName} account and with which roles</li>
                    <li>Configuring branches, departments, shifts, policies, and attendance settings accurately</li>
                    <li>Ensuring employee and operational data entered into the system is lawful and correct</li>
                    <li>Using attendance, leave, and payroll-visibility features in accordance with applicable employment and workplace rules</li>
                    <li>Providing any notices or obtaining any consents required for their workforce under applicable law</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">6. Acceptable Use</h2>
                  <p className="mt-3">You agree to use {BRAND.appName} only for lawful workforce-management purposes. You must not:</p>
                  <ul className="mt-3 list-disc space-y-1.5 pl-5" style={{ color: "var(--text-muted)" }}>
                    <li>Attempt unauthorized access to accounts, systems, or data</li>
                    <li>Falsify, spoof, or manipulate attendance, leave, or payroll-related records</li>
                    <li>Interfere with platform integrity, security, or availability</li>
                    <li>Misuse GPS, QR, or remote-attendance features to misrepresent presence or location</li>
                    <li>Upload unlawful, harmful, or infringing content</li>
                    <li>Reverse engineer or abuse the service except to the extent such restriction is prohibited by law</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">7. Attendance Integrity</h2>
                  <p className="mt-3">
                    Where enabled, {BRAND.appName} may use QR validation, GPS verification, remote-attendance
                    approval workflows, and related controls to support trustworthy Clock In and Clock Out records.
                    Users and organizations must not attempt to circumvent these controls.
                  </p>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">8. Customer Data</h2>
                  <p className="mt-3">
                    As between {BRAND.companyName} and the Customer, Customer Data remains associated with the
                    Customer&apos;s account. We process Customer Data to provide the Services and as described in our
                    Privacy Policy. Customers are responsible for the lawfulness of Customer Data they submit and for
                    instructions they give us through administrators.
                  </p>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">9. Intellectual Property</h2>
                  <p className="mt-3">
                    {BRAND.appName}, including its software, branding, documentation, and related materials, is owned
                    by {BRAND.legalName} or its licensors. These Terms do not transfer ownership of our intellectual
                    property. Customers retain rights in their Customer Data. Feedback you provide may be used to
                    improve the Services without obligation to you.
                  </p>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">10. Third-Party Services</h2>
                  <p className="mt-3">
                    The Services rely on infrastructure and authentication providers (including cloud hosting and
                    authentication services). Your use of the Services may therefore depend on the availability and
                    terms of those providers. We are not responsible for third-party services we do not control,
                    except to the extent required by applicable law.
                  </p>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">11. Service Availability and Support</h2>
                  <p className="mt-3">
                    We aim to provide a reliable service and may perform maintenance, updates, or changes that
                    temporarily affect availability. We do not guarantee uninterrupted or error-free operation at all
                    times.
                  </p>
                  <p className="mt-3">
                    Support is available through {BRAND.supportEmail} and related in-product or website contact
                    pathways. Response times and support scope may vary based on the nature of the request and any
                    separate arrangement with the Customer.
                  </p>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">12. Fees</h2>
                  <p className="mt-3">
                    Access to {BRAND.appName} may be subject to commercial arrangements agreed separately with the
                    Customer. These public Terms do not themselves set subscription prices, billing cycles, or refund
                    rules. Where a separate order, quote, or agreement applies, that commercial document governs fees.
                  </p>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">13. Suspension and Termination</h2>
                  <p className="mt-3">
                    We may suspend or terminate access if these Terms are violated, if misuse or security risk is
                    detected, if required by law, or if an organization&apos;s account is deactivated under our
                    operational processes. Organizations may also deactivate users within their accounts. Provisions
                    that by nature should survive (including intellectual property, disclaimers, and limitations of
                    liability) will continue after termination.
                  </p>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">14. Disclaimers</h2>
                  <p className="mt-3">
                    The Services are provided on an &quot;as available&quot; basis. To the fullest extent permitted by
                    law, we disclaim warranties not expressly stated in these Terms, including implied warranties of
                    merchantability, fitness for a particular purpose, and non-infringement.
                  </p>
                  <p className="mt-3">
                    Payroll visibility and related calculations depend on configurations and data supplied by the
                    Customer. {BRAND.legalName} does not guarantee financial or payroll outcomes where Customer Data
                    or settings are incomplete or incorrect.
                  </p>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">15. Limitation of Liability</h2>
                  <p className="mt-3">
                    To the fullest extent permitted by applicable law, {BRAND.legalName} is not liable for indirect,
                    incidental, special, consequential, or punitive damages, or for lost profits, lost revenue, or
                    business interruption, arising from use of the Services.
                  </p>
                  <p className="mt-3">
                    We are also not liable for decisions made solely on the basis of reports or payroll-visibility
                    outputs where those outputs depend on Customer-configured rules or Customer-entered data.
                  </p>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">16. Indemnification</h2>
                  <p className="mt-3">
                    Customers agree to defend and indemnify {BRAND.legalName} against claims arising from Customer
                    Data, misuse of the Services by the Customer&apos;s users, or the Customer&apos;s violation of
                    these Terms or applicable law, except to the extent caused by our willful misconduct.
                  </p>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">17. Governing Law and Disputes</h2>
                  <p className="mt-3">
                    {BRAND.legalName} is incorporated in Ghana. Unless a separate written agreement with a Customer
                    provides otherwise, these Terms are governed by the laws of Ghana, without regard to conflict-of-law
                    rules that would require another jurisdiction&apos;s laws.
                  </p>
                  <p className="mt-3">
                    Because {BRAND.appName} may serve organizations and users in multiple countries, parties may also
                    have rights or remedies under local laws that cannot be waived. Customers who require a different
                    governing-law or dispute-resolution arrangement should address that in a negotiated agreement.
                    Formal dispute-resolution procedures should be confirmed with qualified legal counsel for the
                    relevant commercial relationship.
                  </p>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">18. Changes to These Terms</h2>
                  <p className="mt-3">
                    We may update these Terms from time to time. The Effective Date above will be revised when changes
                    are published. Continued use of the Services after an update constitutes acceptance of the revised
                    Terms, except where applicable law requires a different process.
                  </p>
                </section>

                <section>
                  <h2 className="text-base font-semibold sm:text-lg">19. Contact Information</h2>
                  <p className="mt-3">Questions about these Terms may be sent to:</p>
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
