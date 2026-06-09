import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Shield,
  Lock,
  Eye,
  Database,
  UserCheck,
  RefreshCw,
  Globe,
  Mail,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EFFECTIVE_DATE = "4 June 2026";
const CONTACT_EMAIL = "privacy@cashflow.app";
const APP_NAME = "CashFlow";
const COMPANY = "CashFlow"; // update to legal entity name if/when incorporated

function SectionHeading({
  icon: Icon,
  number,
  title,
}: {
  icon: React.ElementType;
  number: number;
  title: string;
}) {
  return (
    <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
      <Icon className="w-4 h-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
      {number}. {title}
    </h2>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="pl-6 text-slate-600 dark:text-slate-300 leading-relaxed space-y-3 text-[0.9375rem]">
      {children}
    </div>
  );
}

function BulletList({ items }: { items: (string | React.ReactNode)[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-300 text-[0.9375rem] leading-relaxed">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PrivacyPolicy() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-3xl mx-auto">
        {/* Nav bar */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to={user ? "/" : "/login"}
            className="inline-flex items-center text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {user ? "Back to Dashboard" : "Back to Login"}
          </Link>
          <span className="text-xs text-slate-400">
            Effective date: {EFFECTIVE_DATE}
          </span>
        </div>

        {/* Document card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
          {/* Header */}
          <div className="px-8 sm:px-12 pt-10 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Privacy Policy
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                  {APP_NAME} — Effective {EFFECTIVE_DATE}
                </p>
              </div>
            </div>

            {/* Plain-language summary */}
            <div className="mt-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40 rounded-xl px-5 py-4">
              <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed">
                <span className="font-semibold">Plain-language summary.</span>{" "}
                {APP_NAME} is a personal finance tool. Your financial data
                belongs to you. We store it securely in Google Firebase to sync
                across your devices, never sell it, never use it for
                advertising, and you can delete it at any time.
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 sm:px-12 py-10 space-y-10">
            {/* 1 */}
            <section>
              <SectionHeading
                icon={UserCheck}
                number={1}
                title="Who We Are and How to Reach Us"
              />
              <Prose>
                <p>
                  {APP_NAME} ("we," "our," or "us") is a personal finance
                  management application. This Privacy Policy explains how we
                  collect, use, store, and protect information about you
                  ("User," "you") when you use the {APP_NAME} web application
                  (the "Service").
                </p>
                <p>
                  For any privacy-related questions, requests, or concerns,
                  contact us at:{" "}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </p>
              </Prose>
            </section>

            {/* 2 */}
            <section>
              <SectionHeading
                icon={Database}
                number={2}
                title="Information We Collect"
              />
              <Prose>
                <p>
                  We collect only the information necessary to operate and
                  improve the Service. This falls into two categories.
                </p>

                <p className="font-medium text-slate-700 dark:text-slate-200">
                  2.1 Information you provide directly
                </p>
                <BulletList
                  items={[
                    "Financial records you create: expense amounts, descriptions, categories, dates, income entries, and budget targets.",
                    "Account information obtained through Google Sign-In: your name, email address, and profile picture URL. We do not receive your Google password.",
                    "Custom categories, budget names, and any other content you choose to enter.",
                  ]}
                />

                <p className="font-medium text-slate-700 dark:text-slate-200">
                  2.2 Information collected automatically
                </p>
                <BulletList
                  items={[
                    "Device and browser type, operating system version, and language preferences — used solely for compatibility and error diagnosis.",
                    "Anonymised crash reports and performance metrics if an unhandled error occurs. These reports do not include your financial data.",
                    "The date and time of your last login, retained for account security purposes only.",
                  ]}
                />

                <p className="font-medium text-slate-700 dark:text-slate-200">
                  2.3 What we do not collect
                </p>
                <BulletList
                  items={[
                    "We do not collect bank account numbers, credit or debit card numbers, or any payment credentials.",
                    "We do not collect your national identification number, tax identification number, or any government-issued ID.",
                    "We do not use advertising trackers, third-party analytics pixels, or behavioural profiling tools.",
                    "We do not access your contacts, camera, microphone, or any device sensor.",
                  ]}
                />
              </Prose>
            </section>

            {/* 3 */}
            <section>
              <SectionHeading
                icon={Eye}
                number={3}
                title="How We Use Your Information"
              />
              <Prose>
                <p>
                  We use your information exclusively for the following
                  purposes. We do not use your financial data for any purpose
                  not listed here.
                </p>
                <BulletList
                  items={[
                    "To provide the core Service: storing, syncing, and displaying your expense, income, budget, and category records across your devices.",
                    "To generate reports and PDF exports at your explicit request.",
                    "To authenticate your identity securely and maintain the integrity of your account.",
                    "To diagnose technical errors, fix bugs, and maintain service availability.",
                    "To communicate with you in response to support inquiries you initiate.",
                    "To comply with applicable law, legal process, or enforceable governmental requests.",
                  ]}
                />
                <p>
                  We do{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    not
                  </span>{" "}
                  sell, rent, license, or trade your personal data or financial
                  records to any third party under any circumstances. We do not
                  use your data to train machine learning models or to derive
                  insights that are shared externally.
                </p>
              </Prose>
            </section>

            {/* 4 */}
            <section>
              <SectionHeading
                icon={Lock}
                number={4}
                title="Data Storage and Security"
              />
              <Prose>
                <p>
                  Your data is stored in Google Firebase (Firestore), a
                  cloud-hosted NoSQL database operated by Google LLC. Firebase
                  infrastructure is hosted on Google Cloud Platform data
                  centres, which maintain ISO 27001, SOC 2 Type II, and other
                  industry-standard security certifications.
                </p>
                <p>
                  In addition to cloud storage, {APP_NAME} uses your browser's
                  IndexedDB to cache your data locally, enabling the application
                  to function offline. This local data is stored only on your
                  device and is cleared when you sign out or uninstall the
                  application.
                </p>
                <p className="font-medium text-slate-700 dark:text-slate-200">
                  Security measures we implement:
                </p>
                <BulletList
                  items={[
                    "All data in transit is encrypted using TLS 1.2 or higher.",
                    "All data at rest is encrypted by Firebase using AES-256.",
                    "Firestore security rules enforce that each user may only read and write their own data. No user can access another user's records.",
                    "Authentication is handled entirely by Google Firebase Authentication. We do not store or transmit passwords.",
                    "Sensitive environment credentials (API keys) are stored in server-side environment variables and are never exposed in client-side code.",
                  ]}
                />
                <p>
                  While we implement industry-standard safeguards, no system is
                  perfectly secure. In the event of a data breach that affects
                  your personal information, we will notify you via email within
                  72 hours of becoming aware of the breach, to the extent
                  required by applicable law.
                </p>
              </Prose>
            </section>

            {/* 5 */}
            <section>
              <SectionHeading
                icon={Globe}
                number={5}
                title="Third-Party Services"
              />
              <Prose>
                <p>
                  {APP_NAME} uses a small number of third-party services to
                  operate. Each has its own privacy policy, which we encourage
                  you to review.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-2 pr-4 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          Service
                        </th>
                        <th className="text-left py-2 pr-4 font-semibold text-slate-700 dark:text-slate-300">
                          Purpose
                        </th>
                        <th className="text-left py-2 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          Data shared
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      <tr>
                        <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          Google Firebase
                        </td>
                        <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">
                          Authentication, database, hosting
                        </td>
                        <td className="py-2.5 text-slate-600 dark:text-slate-400">
                          Account identity, encrypted financial records
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          Google Fonts
                        </td>
                        <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">
                          Typeface delivery
                        </td>
                        <td className="py-2.5 text-slate-600 dark:text-slate-400">
                          Your IP address (Google's standard CDN behaviour)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p>
                  We do not integrate with any advertising networks, social
                  media platforms, data brokers, or analytics providers beyond
                  those listed above.
                </p>
              </Prose>
            </section>

            {/* 6 */}
            <section>
              <SectionHeading
                icon={RefreshCw}
                number={6}
                title="Data Retention and Deletion"
              />
              <Prose>
                <p>
                  We retain your data for as long as your account is active. The
                  application automatically deletes expense and income records
                  older than 12 months as part of its data management cycle. You
                  may adjust this retention window in the Settings page.
                </p>
                <p className="font-medium text-slate-700 dark:text-slate-200">
                  Your right to deletion:
                </p>
                <BulletList
                  items={[
                    "You may delete individual records at any time from within the application.",
                    "You may request complete deletion of your account and all associated data by emailing us at " +
                      CONTACT_EMAIL +
                      ". We will process deletion requests within 30 days.",
                    "Upon account deletion, all Firestore records associated with your user ID are permanently erased. Local IndexedDB data is cleared on your next sign-out.",
                  ]}
                />
              </Prose>
            </section>

            {/* 7 */}
            <section>
              <SectionHeading icon={UserCheck} number={7} title="Your Rights" />
              <Prose>
                <p>
                  Depending on your jurisdiction, you may have the following
                  rights with respect to your personal data. We honour all of
                  these rights regardless of where you are located.
                </p>
                <BulletList
                  items={[
                    <>
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        Right of access.
                      </span>{" "}
                      You may request a copy of all personal data we hold about
                      you.
                    </>,
                    <>
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        Right of rectification.
                      </span>{" "}
                      You may correct inaccurate personal data at any time,
                      directly within the application.
                    </>,
                    <>
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        Right of erasure.
                      </span>{" "}
                      You may request that we delete your data, as described in
                      Section 6.
                    </>,
                    <>
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        Right to data portability.
                      </span>{" "}
                      You may export your data as a PDF report at any time from
                      the Reports section. Additional export formats may be
                      available on request.
                    </>,
                    <>
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        Right to object.
                      </span>{" "}
                      You may object to any processing of your data. Given that
                      we process your data only to operate the Service, the
                      practical effect of such an objection would be
                      discontinuation of your account.
                    </>,
                    <>
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        Right to withdraw consent.
                      </span>{" "}
                      Where processing is based on consent, you may withdraw
                      that consent at any time by deleting your account.
                    </>,
                  ]}
                />
                <p>
                  To exercise any of these rights, contact us at{" "}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {CONTACT_EMAIL}
                  </a>
                  . We will respond within 30 days. We will not charge a fee for
                  reasonable requests.
                </p>
              </Prose>
            </section>

            {/* 8 */}
            <section>
              <SectionHeading
                icon={AlertTriangle}
                number={8}
                title="Children's Privacy"
              />
              <Prose>
                <p>
                  The Service is not directed to individuals under the age of
                  18. We do not knowingly collect personal information from
                  children. If you believe a child has provided us with personal
                  information, please contact us immediately and we will delete
                  that information.
                </p>
              </Prose>
            </section>

            {/* 9 */}
            <section>
              <SectionHeading
                icon={Globe}
                number={9}
                title="International Data Transfers"
              />
              <Prose>
                <p>
                  {APP_NAME} is operated from India. Your data is processed on
                  Google Firebase infrastructure, which may store and process
                  data in multiple regions globally. By using the Service, you
                  consent to the transfer of your data to jurisdictions that may
                  have different data protection laws than your own.
                </p>
                <p>
                  Google Firebase complies with applicable data transfer
                  frameworks. For users in the European Economic Area, the
                  United Kingdom, and Switzerland, data transfers are conducted
                  under Standard Contractual Clauses approved by the European
                  Commission. For users in India, data handling is conducted in
                  accordance with the Digital Personal Data Protection Act, 2023
                  (DPDPA).
                </p>
              </Prose>
            </section>

            {/* 10 */}
            <section>
              <SectionHeading
                icon={RefreshCw}
                number={10}
                title="Changes to This Policy"
              />
              <Prose>
                <p>
                  We may update this Privacy Policy from time to time. When we
                  make material changes, we will update the effective date at
                  the top of this document and, where required by law or where
                  the change is significant, notify you by email. Your continued
                  use of the Service after the effective date constitutes
                  acceptance of the updated policy.
                </p>
                <p>
                  We will not retroactively reduce your rights under this
                  Privacy Policy without your explicit consent.
                </p>
              </Prose>
            </section>
          </div>

          {/* Footer */}
          <div className="px-8 sm:px-12 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} {COMPANY}. All rights reserved.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <Mail className="w-3.5 h-3.5" />
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
