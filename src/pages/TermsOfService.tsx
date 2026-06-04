import { Link } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  UserCheck,
  Shield,
  AlertTriangle,
  Ban,
  RefreshCw,
  Scale,
  Info,
  Lock,
  Mail,
} from "lucide-react";
import { useAuth } from "../services/authService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EFFECTIVE_DATE = "4 June 2026";
const CONTACT_EMAIL = "support@cashflow.app";
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

export default function TermsOfService() {
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
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Terms of Service
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
                Use {APP_NAME} responsibly. Your data belongs to you. We provide
                the Service as-is and cannot guarantee it will be error-free. We
                may suspend accounts that misuse the platform. Please read
                Sections 8 and 9 carefully — they limit our liability and
                explain how disputes are resolved.
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 sm:px-12 py-10 space-y-10">
            {/* 1 */}
            <section>
              <SectionHeading
                icon={Info}
                number={1}
                title="Agreement to These Terms"
              />
              <Prose>
                <p>
                  These Terms of Service ("Terms") constitute a legally binding
                  agreement between you ("User," "you") and {COMPANY} ("we,"
                  "our," "us") governing your access to and use of the
                  {APP_NAME} web application and any related services
                  (collectively, the "Service").
                </p>
                <p>
                  By creating an account or otherwise accessing the Service, you
                  confirm that you have read, understood, and agree to be bound
                  by these Terms and our{" "}
                  <Link
                    to="/privacy"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  , which is incorporated herein by reference. If you do not
                  agree to these Terms, you must not use the Service.
                </p>
                <p>
                  You must be at least 18 years of age to use the Service. By
                  using {APP_NAME}, you represent and warrant that you meet this
                  age requirement.
                </p>
              </Prose>
            </section>

            {/* 2 */}
            <section>
              <SectionHeading
                icon={Shield}
                number={2}
                title="Description of the Service"
              />
              <Prose>
                <p>
                  {APP_NAME} is a personal finance management tool that allows
                  you to track expenses, record income, manage budgets, and
                  generate financial reports. The Service is provided as a
                  Progressive Web Application (PWA) accessible via a web
                  browser.
                </p>
                <p>
                  The Service is designed for personal, non-commercial use. It
                  is not a financial advisory service, an accounting service, a
                  banking service, or a regulated financial product of any kind.
                  Nothing within the Service constitutes financial, investment,
                  tax, or legal advice.
                </p>
                <p>
                  We reserve the right to modify, suspend, or discontinue any
                  aspect of the Service at any time, with or without notice.
                  Where feasible, we will provide at least 30 days' notice of
                  significant changes that affect your use of the Service.
                </p>
              </Prose>
            </section>

            {/* 3 */}
            <section>
              <SectionHeading
                icon={UserCheck}
                number={3}
                title="Account Registration and Responsibilities"
              />
              <Prose>
                <p>
                  To access the Service, you must authenticate using a valid
                  Google account via Google Firebase Authentication. By signing
                  in, you authorise us to access the account information
                  described in our Privacy Policy.
                </p>
                <p className="font-medium text-slate-700 dark:text-slate-200">
                  You are responsible for:
                </p>
                <BulletList
                  items={[
                    "Maintaining the confidentiality of your Google account credentials.",
                    "All activity that occurs under your account, whether or not authorised by you.",
                    "Ensuring that all information you provide to the Service is accurate to the best of your knowledge.",
                    "Notifying us promptly at " +
                      CONTACT_EMAIL +
                      " if you suspect unauthorised access to your account.",
                  ]}
                />
                <p>
                  One account is permitted per individual. Accounts are
                  non-transferable. You may not share your account credentials
                  with any other person.
                </p>
              </Prose>
            </section>

            {/* 4 */}
            <section>
              <SectionHeading
                icon={Lock}
                number={4}
                title="Your Data and Ownership"
              />
              <Prose>
                <p>
                  You retain full ownership of all financial records,
                  categories, budgets, and other content you create within the
                  Service ("User Content"). We claim no intellectual property
                  rights over your User Content.
                </p>
                <p>
                  By using the Service, you grant us a limited, non-exclusive,
                  royalty-free licence to store, process, and transmit your User
                  Content solely for the purpose of providing the Service to
                  you. This licence terminates upon deletion of your account.
                </p>
                <p>
                  You are solely responsible for the accuracy of the data you
                  enter. We are not responsible for financial decisions you make
                  based on information displayed within the Service.
                </p>
              </Prose>
            </section>

            {/* 5 */}
            <section>
              <SectionHeading
                icon={Ban}
                number={5}
                title="Acceptable Use and Prohibited Conduct"
              />
              <Prose>
                <p>
                  You agree to use the Service only for lawful personal finance
                  management purposes and in accordance with these Terms. The
                  following conduct is expressly prohibited:
                </p>
                <BulletList
                  items={[
                    "Using the Service for any unlawful purpose, including money laundering, tax evasion, or fraud.",
                    "Attempting to gain unauthorised access to any part of the Service, its infrastructure, or another user's data.",
                    "Reverse engineering, decompiling, or disassembling any part of the Service.",
                    "Using automated tools, bots, scrapers, or scripts to access or interact with the Service.",
                    "Uploading or transmitting malicious code, viruses, or any content designed to disrupt or damage the Service.",
                    "Impersonating any person or entity or misrepresenting your affiliation with any person or entity.",
                    "Attempting to circumvent any security, rate-limiting, or access controls implemented within the Service.",
                    "Using the Service on behalf of a third party without their explicit authorisation.",
                  ]}
                />
                <p>
                  We reserve the right to investigate suspected violations and,
                  where appropriate, to suspend or permanently terminate
                  accounts engaged in prohibited conduct without prior notice.
                </p>
              </Prose>
            </section>

            {/* 6 */}
            <section>
              <SectionHeading
                icon={RefreshCw}
                number={6}
                title="Account Suspension and Termination"
              />
              <Prose>
                <p className="font-medium text-slate-700 dark:text-slate-200">
                  Termination by you:
                </p>
                <p>
                  You may stop using the Service at any time. To permanently
                  delete your account and all associated data, email us at{" "}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {CONTACT_EMAIL}
                  </a>
                  . We will process deletion requests within 30 days.
                </p>
                <p className="font-medium text-slate-700 dark:text-slate-200">
                  Termination by us:
                </p>
                <p>
                  We may suspend or terminate your access to the Service at any
                  time if we reasonably believe that you have violated these
                  Terms, that continued access poses a security risk, or that
                  providing the Service is no longer commercially feasible.
                  Where possible, we will provide 30 days' advance notice before
                  terminating an account that is not in violation of these
                  Terms.
                </p>
                <p>
                  Upon termination, your right to use the Service ceases
                  immediately. Sections 4, 7, 8, 9, 10, and 11 survive
                  termination of these Terms.
                </p>
              </Prose>
            </section>

            {/* 7 */}
            <section>
              <SectionHeading
                icon={Shield}
                number={7}
                title="Intellectual Property"
              />
              <Prose>
                <p>
                  All rights, title, and interest in and to the Service,
                  including the software, interface design, logos, trademarks,
                  and documentation (excluding your User Content), are and
                  remain the exclusive property of {COMPANY}. Nothing in these
                  Terms transfers any intellectual property rights to you.
                </p>
                <p>
                  We grant you a limited, revocable, non-exclusive,
                  non-transferable licence to use the Service solely for your
                  personal, non-commercial purposes in accordance with these
                  Terms.
                </p>
              </Prose>
            </section>

            {/* 8 */}
            <section>
              <SectionHeading
                icon={AlertTriangle}
                number={8}
                title={`Disclaimers and "As Is" Provision`}
              />
              <Prose>
                <p className="text-sm uppercase font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                  Please read this section carefully.
                </p>
                <p>
                  THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS
                  WITHOUT WARRANTY OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED
                  BY APPLICABLE LAW, WE EXPRESSLY DISCLAIM ALL WARRANTIES,
                  WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING
                  BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY,
                  FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND
                  ACCURACY.
                </p>
                <p>
                  We do not warrant that the Service will be uninterrupted,
                  error-free, or free from harmful components. We do not warrant
                  the accuracy, completeness, or timeliness of any information
                  provided through the Service.
                </p>
                <p>
                  The Service is a personal productivity tool. It is not a
                  substitute for professional financial, accounting, tax, or
                  legal advice. We are not responsible for any financial
                  decisions, losses, or outcomes arising from your use of, or
                  reliance on, information provided by the Service.
                </p>
              </Prose>
            </section>

            {/* 9 */}
            <section>
              <SectionHeading
                icon={Scale}
                number={9}
                title="Limitation of Liability"
              />
              <Prose>
                <p className="text-sm uppercase font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                  Please read this section carefully.
                </p>
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT
                  SHALL {COMPANY.toUpperCase()}, ITS OFFICERS, DIRECTORS,
                  EMPLOYEES, OR AGENTS BE LIABLE TO YOU FOR ANY INDIRECT,
                  INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY
                  DAMAGES ARISING OUT OF OR RELATING TO YOUR USE OF OR INABILITY
                  TO USE THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE
                  POSSIBILITY OF SUCH DAMAGES.
                </p>
                <p>
                  OUR TOTAL CUMULATIVE LIABILITY TO YOU FOR ALL CLAIMS ARISING
                  OUT OF OR RELATING TO THESE TERMS OR THE SERVICE SHALL NOT
                  EXCEED THE GREATER OF (A) THE TOTAL AMOUNT YOU PAID TO US IN
                  THE TWELVE MONTHS PRECEDING THE CLAIM, OR (B) INR 1,000 (ONE
                  THOUSAND INDIAN RUPEES).
                </p>
                <p>
                  Some jurisdictions do not allow the exclusion or limitation of
                  certain warranties or liabilities. In such jurisdictions, our
                  liability is limited to the minimum extent permitted by law.
                </p>
              </Prose>
            </section>

            {/* 10 */}
            <section>
              <SectionHeading
                icon={Scale}
                number={10}
                title="Governing Law and Dispute Resolution"
              />
              <Prose>
                <p>
                  These Terms are governed by and construed in accordance with
                  the laws of India, without regard to its conflict of law
                  provisions. Any dispute arising from or relating to these
                  Terms or the Service shall be subject to the exclusive
                  jurisdiction of the courts located in India.
                </p>
                <p>
                  Before initiating any formal legal proceedings, you agree to
                  first contact us at{" "}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {CONTACT_EMAIL}
                  </a>{" "}
                  and allow us a reasonable period (not less than 30 days) to
                  attempt to resolve the dispute informally.
                </p>
              </Prose>
            </section>

            {/* 11 */}
            <section>
              <SectionHeading
                icon={RefreshCw}
                number={11}
                title="Changes to These Terms"
              />
              <Prose>
                <p>
                  We may revise these Terms at any time. When we make material
                  changes, we will update the effective date above and, where
                  the change significantly affects your rights, notify you by
                  email at least 30 days before the changes take effect.
                </p>
                <p>
                  Your continued use of the Service after the revised Terms
                  become effective constitutes your acceptance of the updated
                  Terms. If you do not agree to the revised Terms, you must stop
                  using the Service before they take effect.
                </p>
              </Prose>
            </section>

            {/* 12 */}
            <section>
              <SectionHeading
                icon={Info}
                number={12}
                title="General Provisions"
              />
              <Prose>
                <BulletList
                  items={[
                    <>
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        Entire agreement.
                      </span>{" "}
                      These Terms, together with the Privacy Policy, constitute
                      the entire agreement between you and {COMPANY} regarding
                      the Service and supersede all prior agreements.
                    </>,
                    <>
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        Severability.
                      </span>{" "}
                      If any provision of these Terms is found to be
                      unenforceable, the remaining provisions will remain in
                      full force and effect.
                    </>,
                    <>
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        No waiver.
                      </span>{" "}
                      Our failure to enforce any provision of these Terms shall
                      not constitute a waiver of our right to enforce that
                      provision in the future.
                    </>,
                    <>
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        Assignment.
                      </span>{" "}
                      You may not assign or transfer any rights or obligations
                      under these Terms without our prior written consent. We
                      may assign our rights freely.
                    </>,
                    <>
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        Force majeure.
                      </span>{" "}
                      We shall not be liable for any failure to perform our
                      obligations where such failure results from any cause
                      beyond our reasonable control.
                    </>,
                  ]}
                />
              </Prose>
            </section>

            {/* 13 */}
            <section>
              <SectionHeading icon={Mail} number={13} title="Contact Us" />
              <Prose>
                <p>
                  If you have questions about these Terms or wish to report a
                  violation, please contact us:
                </p>
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl px-5 py-4 space-y-1">
                  <p className="font-medium text-slate-700 dark:text-slate-200">
                    {COMPANY}
                  </p>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-2 text-sm"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {CONTACT_EMAIL}
                  </a>
                </div>
              </Prose>
            </section>
          </div>

          {/* Footer */}
          <div className="px-8 sm:px-12 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} {COMPANY}. All rights reserved.
            </p>
            <Link
              to="/privacy"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Privacy Policy →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
